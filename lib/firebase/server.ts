import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import {
  getApps as getWebApps,
  initializeApp as initializeWebApp,
} from "firebase/app";
import {
  collection as webCollection,
  getDocs as webGetDocs,
  getFirestore as getWebFirestore,
  limit as webLimit,
  query as webQuery,
  where as webWhere,
} from "firebase/firestore";
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

// Lazy init: avoids failing at import time (e.g. during `next build`).
function getDb() {
  return getFirestore(getFirebaseAdminApp());
}

/**
 * Public recipe lookup for pages that only need metadata / JSON-LD.
 * This uses the Firebase Web SDK when Admin credentials aren't configured,
 * so public recipe pages can still render on Netlify without a service account.
 * Firestore security rules still apply to this lookup.
 */
function getPublicDb() {
  const appName = "softmeal-public-recipe-metadata";
  const existingApp = getWebApps().find((app) => app.name === appName);
  if (existingApp) {
    return getWebFirestore(existingApp);
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.projectId ||
    !firebaseConfig.appId
  ) {
    throw new Error(
      "Public recipe metadata lookup requires NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_APP_ID.",
    );
  }

  const app = initializeWebApp(firebaseConfig, appName);
  return getWebFirestore(app);
}

const recipeCategories = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Dessert",
  "Vegan",
  "Wellness",
] as const;

function normalizeRecipeForMetadata(
  id: string,
  rawData: Record<string, unknown>,
): Recipe {
  const category =
    recipeCategories.find((value) => value === rawData.category) ?? "Breakfast";

  return {
    ...rawData,
    id,
    title:
      typeof rawData.title === "string" ? rawData.title : "Untitled recipe",
    slug: typeof rawData.slug === "string" ? rawData.slug : id,
    description:
      typeof rawData.description === "string" ? rawData.description : "",
    ingredients: Array.isArray(rawData.ingredients)
      ? rawData.ingredients.map(String)
      : [],
    steps: Array.isArray(rawData.steps) ? rawData.steps.map(String) : [],
    category,
    imageUrl:
      typeof rawData.imageUrl === "string" ? rawData.imageUrl : undefined,
    youtubeUrl:
      typeof rawData.youtubeUrl === "string" ? rawData.youtubeUrl : undefined,
    nutrition:
      rawData.nutrition && typeof rawData.nutrition === "object"
        ? (rawData.nutrition as Recipe["nutrition"])
        : undefined,
    userId: typeof rawData.userId === "string" ? rawData.userId : undefined,
  } as Recipe;
}

/**
 * Server-only recipe lookup used by Next.js generateMetadata().
 * Prefer Admin SDK when configured; otherwise use a rules-protected public read.
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

export async function fetchRecipeBySlugServer(
  slug: string,
): Promise<Recipe | null> {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_B64?.trim()) {
    const snapshot = await webGetDocs(
      webQuery(
        webCollection(getPublicDb(), "recipes"),
        webWhere("slug", "==", slug),
        webLimit(1),
      ),
    );

    if (snapshot.empty) {
      return null;
    }

    const document = snapshot.docs[0];
    return normalizeRecipeForMetadata(
      document.id,
      document.data() as Record<string, unknown>,
    );
  }

  const snapshot = await getDb()
    .collection("recipes")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const document = snapshot.docs[0];
  return normalizeRecipeForMetadata(
    document.id,
    document.data() as Record<string, unknown>,
  );
}
