"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { Comment } from "@/lib/types";
import { addRecipeComment } from "@/lib/firebase/data";

type CommentUser = {
  uid?: string;
  displayName?: string | null;
} | null;

interface UseRecipeCommentsOptions {
  recipeId: string | undefined;
  initialComments: Comment[];
  currentUser: CommentUser;
}

/** Owns comment form state and persistence, independent of the recipe layout. */
export function useRecipeComments({
  recipeId,
  initialComments,
  currentUser,
}: UseRecipeCommentsOptions) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = commentText.trim();
    if (!recipeId || !text) return;

    setError("");
    setCommentBusy(true);

    try {
      const username = currentUser
        ? currentUser.displayName || "Người dùng ẩn danh"
        : guestName.trim() || "Khách";

      const saved = await addRecipeComment(recipeId, {
        text,
        userId: currentUser?.uid,
        username,
      });

      // Append locally; avoid downloading the entire comment list again.
      setComments((previous) => [
        {
          id: saved.id,
          text,
          userId: currentUser?.uid,
          username,
          createdAt: saved.createdAt,
        },
        ...previous,
      ]);
      setCommentText("");
    } catch (cause) {
      console.error("Comment error:", cause);
      setError("Không thể đăng bình luận.");
    } finally {
      setCommentBusy(false);
    }
  }

  return {
    comments,
    commentText,
    setCommentText,
    guestName,
    setGuestName,
    error,
    commentBusy,
    submitComment,
  };
}
