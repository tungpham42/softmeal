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

/**
 * Server-only recipe lookup used by Next.js generateMetadata().
 * Keep this file free of `use client` and browser-only Firebase APIs.
 */
export async function fetchRecipesServer(): Promise<Recipe[]> {
  const snapshot = await getDb().collection("recipes").get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
    } as Recipe;
  });
}

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

function decodeFirestoreValue(value: FirestoreValue): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) {
    return (value.arrayValue?.values ?? []).map(decodeFirestoreValue);
  }
  if ("mapValue" in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue?.fields ?? {}).map(([key, nested]) => [
        key,
        decodeFirestoreValue(nested),
      ]),
    );
  }
  return null;
}

/**
 * Fallback used when no Firebase Admin credentials are configured (e.g. on
 * Netlify without FIREBASE_SERVICE_ACCOUNT_B64). It reads the same public
 * recipes the browser already reads, through the Firestore REST API using the
 * public NEXT_PUBLIC_* web config, so it needs no secret.
 */
async function fetchRecipeBySlugRest(slug: string): Promise<Recipe | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    return null;
  }

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
      next: { revalidate: 60 },
    },
  );

  if (!response.ok) {
    throw new Error(`Firestore REST query failed with ${response.status}.`);
  }

  const rows = (await response.json()) as Array<{
    document?: { name: string; fields?: Record<string, FirestoreValue> };
  }>;
  const document = rows.find((row) => row.document)?.document;

  if (!document) {
    return null;
  }

  const data = Object.fromEntries(
    Object.entries(document.fields ?? {}).map(([key, value]) => [
      key,
      decodeFirestoreValue(value),
    ]),
  );

  return {
    ...data,
    id: document.name.split("/").pop() ?? "",
  } as Recipe;
}

async function fetchRecipeBySlugAdmin(slug: string): Promise<Recipe | null> {
  const snapshot = await getDb()
    .collection("recipes")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const document = snapshot.docs[0];
  const data = document.data();

  return {
    ...data,
    id: document.id,
  } as Recipe;
}

/**
 * Server-only lookup used by generateMetadata() and the recipe pages.
 * It must never throw: the pages render their content client-side, so a
 * failed lookup should only cost SEO metadata, not turn the route into a 500.
 */
export async function fetchRecipeBySlugServer(
  slug: string,
): Promise<Recipe | null> {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64?.trim()) {
    try {
      return await fetchRecipeBySlugAdmin(slug);
    } catch (error) {
      console.error("Firebase Admin recipe lookup failed:", error);
    }
  }

  try {
    return await fetchRecipeBySlugRest(slug);
  } catch (error) {
    console.error("Firestore REST recipe lookup failed:", error);
    return null;
  }
}
