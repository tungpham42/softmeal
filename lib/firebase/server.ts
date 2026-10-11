import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Comment, Recipe } from "@/lib/types";
import {
  normalizeComment,
  normalizeRecipe,
  sortCommentsNewestFirst,
} from "@/lib/recipeNormalize";

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
  return snapshot.docs.map((doc) => normalizeRecipe(doc.id, doc.data()));
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

  return normalizeRecipe(document.id, document.data());
}

export type RecipePageData = {
  recipe: Recipe;
  author: string;
  comments: Comment[];
  related: Recipe[];
};

const ANONYMOUS_AUTHOR = "Tác giả ẩn danh";

/**
 * Everything the recipe detail page needs, in ONE server round trip:
 * recipe -> (comments | author | same-category recipes) in parallel.
 * Only same-category recipes are queried, instead of downloading the whole
 * collection in the browser just to filter it.
 */
export async function fetchRecipePageServer(
  slug: string,
): Promise<RecipePageData | null> {
  const db = getDb();
  const recipe = await fetchRecipeBySlugServer(slug);

  if (!recipe) {
    return null;
  }

  const [commentsSnap, authorSnap, relatedSnap] = await Promise.all([
    db.collection("recipes").doc(recipe.id).collection("comments").get(),
    recipe.userId
      ? db.collection("users").doc(recipe.userId).get()
      : Promise.resolve(null),
    db
      .collection("recipes")
      .where("category", "==", recipe.category)
      .limit(13)
      .get(),
  ]);

  const profile = authorSnap?.exists ? authorSnap.data() : undefined;

  return {
    recipe,
    author: String(
      profile?.username ?? profile?.displayName ?? ANONYMOUS_AUTHOR,
    ),
    comments: sortCommentsNewestFirst(
      commentsSnap.docs.map((d) => normalizeComment(d.id, d.data())),
    ),
    related: relatedSnap.docs
      .filter((d) => d.id !== recipe.id)
      .slice(0, 12)
      .map((d) => normalizeRecipe(d.id, d.data())),
  };
}
