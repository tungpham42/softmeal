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
import type { Recipe } from "@/lib/types";
import {
  normalizeComment,
  normalizeRecipe,
  sortCommentsNewestFirst,
} from "@/lib/recipeNormalize";

export { normalizeRecipe };

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
  return sortCommentsNewestFirst(
    snapshot.docs.map((item) =>
      normalizeComment(item.id, item.data() as Record<string, unknown>),
    ),
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
  const createdAt = new Date().toISOString();
  const ref = await addDoc(collection(db, "recipes", recipeId, "comments"), {
    text: comment.text,
    username: comment.username ?? "Khách",
    userId: comment.userId ?? null, // không bao giờ để undefined
    createdAt,
  });
  return { id: ref.id, createdAt };
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
