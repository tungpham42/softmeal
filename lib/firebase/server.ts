import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { Recipe } from "@/lib/types";

function getFirebaseAdminApp() {
  const apps = getApps();

  if (apps.length > 0) {
    return apps[0];
  }

  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_B64;

  if (!encoded) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_B64.");
  }

  let serviceAccount: {
    project_id: string;
    client_email: string;
    private_key: string;
  };

  try {
    serviceAccount = JSON.parse(
      Buffer.from(encoded, "base64").toString("utf8"),
    );
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_B64 is not valid base64-encoded JSON.",
    );
  }

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  });
}

/** Verify a Firebase client ID token before a server-side API uses the user identity. */
export async function verifyFirebaseIdToken(
  idToken: string,
): Promise<DecodedIdToken> {
  return getAuth(getFirebaseAdminApp()).verifyIdToken(idToken);
}

// Lazy init: avoids failing at import time (e.g. during `next build`)
function getDb() {
  return getFirestore(getFirebaseAdminApp());
}

/* ------------------------------------------------------------------ */
/* Firestore REST fallback (no service account needed)                 */
/* Used when Admin credentials are missing/invalid on the host         */
/* (e.g. Netlify env var size limits). Reads public recipes only.      */
/* ------------------------------------------------------------------ */

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  mapValue?: { fields?: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
};

function decodeValue(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) {
    return (value.arrayValue?.values ?? []).map(decodeValue);
  }
  if ("mapValue" in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue?.fields ?? {}).map(([k, v]) => [
        k,
        decodeValue(v),
      ]),
    );
  }
  return undefined;
}

async function fetchRecipeBySlugRest(slug: string): Promise<Recipe | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) return null;

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId,
    )}/databases/(default)/documents:runQuery?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "recipes" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "slug" },
              op: "EQUAL",
              value: { stringValue: slug },
            },
          },
          limit: 1,
        },
      }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    },
  );
  if (!response.ok) return null;

  const rows = (await response.json()) as Array<{
    document?: { name: string; fields?: Record<string, FirestoreValue> };
  }>;
  const doc = rows.find((row) => row.document)?.document;
  if (!doc) return null;

  const data = decodeValue({ mapValue: { fields: doc.fields } }) as Record<
    string,
    unknown
  >;
  return {
    ...data,
    id: doc.name.split("/").pop() ?? "",
  } as Recipe;
}

function normalizeRecipe(recipe: Recipe): Recipe {
  // Admin SDK returns Timestamp objects, which cannot be serialised safely
  // into JSON-LD / metadata. Convert them to ISO strings.
  const toIso = (value: unknown): string | undefined => {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (
      typeof value === "object" &&
      "toDate" in value &&
      typeof (value as { toDate: unknown }).toDate === "function"
    ) {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }
    return undefined;
  };
  return {
    ...recipe,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    createdAt: toIso(recipe.createdAt),
    updatedAt: toIso(recipe.updatedAt),
  };
}

/**
 * Server-only recipe lookup used by Next.js generateMetadata().
 * Keep this file free of `use client` and browser-only Firebase APIs.
 */
export async function fetchRecipesServer(): Promise<Recipe[]> {
  try {
    const snapshot = await getDb().collection("recipes").get();
    return snapshot.docs.map((doc) =>
      normalizeRecipe({ ...doc.data(), id: doc.id } as Recipe),
    );
  } catch (error) {
    console.error("fetchRecipesServer failed:", error);
    return [];
  }
}

/**
 * Never throws: a failing lookup must not turn the recipe page into a 500.
 * The client component (RecipeDetail / EditRecipePage) still loads the
 * recipe itself, so returning null here only degrades SEO metadata.
 */
export async function fetchRecipeBySlugServer(
  slug: string,
): Promise<Recipe | null> {
  try {
    const snapshot = await getDb()
      .collection("recipes")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const document = snapshot.docs[0];
    return normalizeRecipe({ ...document.data(), id: document.id } as Recipe);
  } catch (adminError) {
    console.error("Firebase Admin lookup failed, trying REST:", adminError);
    try {
      const recipe = await fetchRecipeBySlugRest(slug);
      return recipe ? normalizeRecipe(recipe) : null;
    } catch (restError) {
      console.error("Firestore REST lookup failed:", restError);
      return null;
    }
  }
}
