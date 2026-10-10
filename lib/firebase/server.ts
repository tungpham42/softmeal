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
export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
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

export async function fetchRecipeBySlugServer(
  slug: string,
): Promise<Recipe | null> {
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
