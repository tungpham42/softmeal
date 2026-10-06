"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { auth, db } from "./client";
import type { Comment, Recipe } from "@/lib/types";

function normalizeDate(value: unknown) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

function normalizeCategory(value: unknown): Recipe["category"] {
  const categories: Recipe["category"][] = [
    "Breakfast",
    "Lunch",
    "Dinner",
    "Dessert",
    "Vegan",
    "Wellness",
  ];
  return categories.find((category) => category === value) ?? "Breakfast";
}

export function normalizeRecipe(
  id: string,
  data: Record<string, unknown>,
): Recipe {
  return {
    id,
    title: String(data.title ?? "Untitled recipe"),
    slug: String(data.slug ?? id),
    description: String(data.description ?? ""),
    ingredients: Array.isArray(data.ingredients)
      ? data.ingredients.map(String)
      : [],
    steps: Array.isArray(data.steps) ? data.steps.map(String) : [],
    category: normalizeCategory(data.category),
    imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
    youtubeUrl: data.youtubeUrl ? String(data.youtubeUrl) : undefined,
    userId: data.userId ? String(data.userId) : undefined,
    createdAt: normalizeDate(data.createdAt as Recipe["createdAt"]),
    updatedAt: normalizeDate(data.updatedAt as Recipe["updatedAt"]),
  };
}

export async function fetchRecipes() {
  const snapshot = await getDocs(collection(db, "recipes"));
  return snapshot.docs.map((item) =>
    normalizeRecipe(item.id, item.data() as Record<string, unknown>),
  );
}

export async function fetchRecipeBySlug(slug: string) {
  const snapshot = await getDocs(
    query(collection(db, "recipes"), where("slug", "==", slug)),
  );
  if (snapshot.empty) return null;
  const item = snapshot.docs[0];
  return normalizeRecipe(item.id, item.data() as Record<string, unknown>);
}

export async function fetchRecipesByUser(userId: string) {
  const snapshot = await getDocs(
    query(collection(db, "recipes"), where("userId", "==", userId)),
  );
  return snapshot.docs.map((item) =>
    normalizeRecipe(item.id, item.data() as Record<string, unknown>),
  );
}

export async function fetchUserProfile(userId: string) {
  const snapshot = await getDoc(doc(db, "users", userId));
  return snapshot.exists()
    ? (snapshot.data() as Record<string, unknown>)
    : null;
}

export async function isAdminUser(user: User | null) {
  if (!user) return false;
  const configuredEmail =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();
  if (configuredEmail && user.email?.toLowerCase() === configuredEmail)
    return true;
  try {
    const profile = await fetchUserProfile(user.uid);
    return profile?.isAdmin === true;
  } catch {
    return false;
  }
}

export async function upsertUserDocument(
  user: User,
  extra: Record<string, unknown> = {},
) {
  const currentTime = new Date().toISOString();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = user.email?.toLowerCase();

  const profile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName ?? extra.username ?? null,
    username: extra.username ?? user.displayName ?? null,
    authProvider:
      extra.authProvider ?? user.providerData[0]?.providerId ?? "password",
    lastLogin: currentTime,
    ...extra,
    isAdmin:
      Boolean(adminEmail && userEmail === adminEmail) || Boolean(extra.isAdmin),
  };
  await setDoc(doc(db, "users", user.uid), profile, { merge: true });
  return profile;
}

export async function updateCommentsForUsername(
  userId: string,
  username: string,
) {
  const recipesSnapshot = await getDocs(collection(db, "recipes"));
  const jobs: Promise<unknown>[] = [];
  for (const recipeDoc of recipesSnapshot.docs) {
    const commentsSnapshot = await getDocs(
      query(
        collection(db, "recipes", recipeDoc.id, "comments"),
        where("userId", "==", userId),
      ),
    );
    for (const comment of commentsSnapshot.docs) {
      jobs.push(updateDoc(comment.ref, { username }));
    }
  }
  await Promise.all(jobs);
  return jobs.length;
}

export async function createOrUpdateUser(
  user: User,
  extra: Record<string, unknown> = {},
) {
  const username = String(extra.username ?? user.displayName ?? "Người dùng");
  const data = await upsertUserDocument(user, { ...extra, username });
  if (!user.isAnonymous) await updateCommentsForUsername(user.uid, username);
  return data;
}

export async function fetchComments(recipeId: string) {
  const snapshot = await getDocs(
    collection(db, "recipes", recipeId, "comments"),
  );
  const comments: Comment[] = snapshot.docs.map((item) => {
    const data = item.data() as Record<string, unknown>;
    return {
      id: item.id,
      text: String(data.text ?? ""),
      userId: data.userId ? String(data.userId) : undefined,
      username: data.username ? String(data.username) : undefined,
      createdAt: normalizeDate(data.createdAt as Comment["createdAt"]),
    };
  });
  return comments.sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime(),
  );
}

export async function addRecipeComment(
  recipeId: string,
  comment: {
    text: string;
    username?: string;
    userId?: string | null; // khách: undefined hoặc null đều được
  },
) {
  await addDoc(collection(db, "recipes", recipeId, "comments"), {
    text: comment.text,
    username: comment.username ?? "Khách",
    userId: comment.userId ?? null, // không bao giờ để undefined
    createdAt: new Date().toISOString(),
  });
}

export async function deleteRecipe(recipeId: string) {
  await deleteDoc(doc(db, "recipes", recipeId));
}

export async function deleteComment(recipeId: string, commentId: string) {
  await deleteDoc(doc(db, "recipes", recipeId, "comments", commentId));
}

export async function saveRecipe(recipeId: string, payload: Partial<Recipe>) {
  await updateDoc(doc(db, "recipes", recipeId), {
    ...payload,
    updatedAt: new Date().toISOString(),
  });
}

export async function createRecipe(payload: Omit<Recipe, "id">) {
  const ref = await addDoc(collection(db, "recipes"), {
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function recipeSlugExists(slug: string, ignoreId?: string) {
  const snapshot = await getDocs(
    query(collection(db, "recipes"), where("slug", "==", slug)),
  );
  return snapshot.docs.some((item) => item.id !== ignoreId);
}

export async function getAuthorName(userId?: string) {
  if (!userId) return "Tác giả ẩn danh";
  const profile = await fetchUserProfile(userId);
  return String(profile?.username ?? profile?.displayName ?? "Tác giả ẩn danh");
}

export { auth };
