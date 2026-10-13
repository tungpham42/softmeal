"use client";

import type { FormEvent } from "react";
import type { Comment } from "@/lib/types";
import Alert from "@/components/ui/Alert";
import Icon from "@/components/ui/Icon";
import { formatCommentDate } from "@/lib/recipes/comment-date";

interface RecipeCommentsProps {
  comments: Comment[];
  isSignedIn: boolean;
  guestName: string;
  onGuestNameChange: (value: string) => void;
  commentText: string;
  onCommentTextChange: (value: string) => void;
  error: string;
  commentBusy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}

/** Presentational comment list and form; persistence remains in useRecipeComments. */
export default function RecipeComments({
  comments,
  isSignedIn,
  guestName,
  onGuestNameChange,
  commentText,
  onCommentTextChange,
  error,
  commentBusy,
  onSubmit,
}: RecipeCommentsProps) {
  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="subheading">
        <Icon name="comment" size={19} />
        Bình luận{" "}
        <span className="text-sm font-sans font-medium text-muted">
          ({comments.length})
        </span>
      </h2>

      {comments.length ? (
        <div className="mt-4 space-y-3">
          {comments.map((comment) => {
            const dateLabel = formatCommentDate(comment.createdAt);
            return (
              <div
                key={comment.id}
                className="rounded-2xl border border-border bg-cream/40 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-ink">
                    {comment.username || "Người dùng"}
                  </strong>
                  <span className="text-xs text-muted" title={dateLabel}>
                    {dateLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {comment.text}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-cream/60 p-4 text-sm text-muted">
          Chưa có bình luận. Hãy là người đầu tiên góp chuyện!
        </p>
      )}

      <div className="mt-5">
        {error && (
          <div className="mb-3">
            <Alert tone="warning">{error}</Alert>
          </div>
        )}
        <form onSubmit={onSubmit}>
          {!isSignedIn && (
            <input
              value={guestName}
              onChange={(event) => onGuestNameChange(event.target.value)}
              className="form-input mb-3"
              maxLength={40}
              placeholder="Tên của bạn (không bắt buộc)"
              aria-label="Tên của bạn"
            />
          )}
          <textarea
            value={commentText}
            onChange={(event) => onCommentTextChange(event.target.value)}
            className="form-input min-h-28"
            required
            maxLength={1000}
            placeholder="Thêm bình luận của bạn..."
          />
          <button
            disabled={commentBusy || !commentText.trim()}
            className="btn-primary mt-3"
          >
            {commentBusy ? (
              "Đang đăng..."
            ) : (
              <>
                <Icon name="comment" size={16} />
                Đăng bình luận
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
