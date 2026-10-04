"use client";

import { useEffect, useMemo, useState } from "react";
import type { Comment, Recipe, SortOption } from "@/lib/types";
import {
  deleteComment,
  deleteRecipe,
  fetchComments,
  fetchRecipes,
} from "@/lib/firebase/data";
import RequireAuth from "@/components/auth/RequireAuth";
import RecipeCard from "@/components/recipes/RecipeCard";
import Pagination from "@/components/ui/Pagination";
import Icon from "@/components/ui/Icon";
import Alert, { LoadingBlock } from "@/components/ui/Alert";

interface ModeratedRecipe extends Recipe {
  comments: Comment[];
}

export default function AdminPanel() {
  return (
    <RequireAuth adminOnly>
      <AdminInner />
    </RequireAuth>
  );
}

function AdminInner() {
  const [recipes, setRecipes] = useState<ModeratedRecipe[]>([]);
  const [sort, setSort] = useState<SortOption>("alphabetAsc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const ITEMS = 12;

  useEffect(() => {
    async function load() {
      try {
        const base = await fetchRecipes();
        const withComments = await Promise.all(
          base.map(async (recipe) => ({
            ...recipe,
            comments: await fetchComments(recipe.id),
          })),
        );
        setRecipes(withComments);
      } catch {
        setError("Không thể tải công thức hoặc bình luận.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const sorted = useMemo(
    () =>
      [...recipes].sort((a, b) => {
        if (sort === "alphabetDesc")
          return b.title.localeCompare(a.title, "vi");
        if (sort === "dateAsc")
          return (
            new Date(a.createdAt ?? 0).getTime() -
            new Date(b.createdAt ?? 0).getTime()
          );
        if (sort === "dateDesc")
          return (
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
          );
        return a.title.localeCompare(b.title, "vi");
      }),
    [recipes, sort],
  );
  const current = sorted.slice((page - 1) * ITEMS, page * ITEMS);

  async function removeRecipe(id: string) {
    if (!window.confirm("Xóa công thức này? Hành động không thể hoàn tác."))
      return;
    try {
      await deleteRecipe(id);
      setRecipes((prev) => prev.filter((x) => x.id !== id));
    } catch {
      setError("Không thể xóa công thức.");
    }
  }
  async function removeComment(recipeId: string, commentId: string) {
    try {
      await deleteComment(recipeId, commentId);
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId
            ? { ...r, comments: r.comments.filter((c) => c.id !== commentId) }
            : r,
        ),
      );
    } catch {
      setError("Không thể xóa bình luận.");
    }
  }

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow">
            <Icon name="settings" size={15} /> Phòng bếp quản trị
          </span>
          <h1 className="section-title">Quản trị nội dung</h1>
          <p className="mt-2 text-sm text-muted">
            Kiểm duyệt công thức và bình luận trong cộng đồng.
          </p>
        </div>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortOption);
            setPage(1);
          }}
          className="form-input sm:w-52"
        >
          <option value="alphabetAsc">Tên A → Z</option>
          <option value="alphabetDesc">Tên Z → A</option>
          <option value="dateDesc">Mới nhất</option>
          <option value="dateAsc">Cũ nhất</option>
        </select>
      </div>
      {error && (
        <div className="mb-5">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      {loading ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {current.map((recipe) => (
              <div key={recipe.id}>
                <RecipeCard
                  recipe={recipe}
                  admin
                  onDelete={() => void removeRecipe(recipe.id)}
                />
                <div className="mt-3 rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted">
                    <span className="flex items-center gap-2">
                      <Icon name="comment" size={14} /> Bình luận
                    </span>
                    <span>{recipe.comments.length}</span>
                  </div>
                  {recipe.comments.length ? (
                    <div className="mt-3 space-y-2">
                      {recipe.comments.slice(0, 5).map((comment) => (
                        <div
                          key={comment.id}
                          className="flex items-start justify-between gap-3 rounded-xl bg-cream/60 p-3 text-sm"
                        >
                          <div>
                            <strong>{comment.username || "Người dùng"}</strong>
                            <p className="mt-1 line-clamp-2 text-muted">
                              {comment.text}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="icon-button icon-button-danger shrink-0"
                            onClick={() =>
                              void removeComment(recipe.id, comment.id)
                            }
                            aria-label="Xóa bình luận"
                          >
                            <Icon name="comment-off" size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted">
                      Chưa có bình luận.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination
            itemsPerPage={ITEMS}
            totalItems={sorted.length}
            currentPage={page}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
