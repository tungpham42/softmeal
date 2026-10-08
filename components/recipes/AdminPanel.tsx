"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import RequireAuth from "@/components/auth/RequireAuth";
import RecipeCard from "@/components/recipes/RecipeCard";
import Alert, { LoadingBlock } from "@/components/ui/Alert";
import Icon from "@/components/ui/Icon";
import Pagination from "@/components/ui/Pagination";
import {
  deleteComment,
  deleteRecipe,
  fetchComments,
  fetchRecipes,
} from "@/lib/firebase/data";
import { categoryLabel } from "@/lib/category";
import { RECIPE_CATEGORIES } from "@/lib/types";
import type { Comment, Recipe } from "@/lib/types";

type ActiveTab = "recipes" | "comments";

type RecipeSort =
  | "alphabetAsc"
  | "alphabetDesc"
  | "dateAsc"
  | "dateDesc"
  | "commentsAsc"
  | "commentsDesc";

type CommentSort = "dateDesc" | "dateAsc" | "userAsc" | "recipeAsc";

interface ModeratedRecipe extends Recipe {
  comments: Comment[];
}

interface AdminComment extends Comment {
  recipeId: string;
  recipeTitle: string;
  recipeSlug: string;
}

const RECIPE_ITEMS = 12;
const COMMENT_ITEMS = 15;

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalized(value: string | undefined) {
  return (value ?? "").trim().toLocaleLowerCase("vi-VN");
}

function sortDate(a?: string, b?: string) {
  return new Date(a ?? 0).getTime() - new Date(b ?? 0).getTime();
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
  const [activeTab, setActiveTab] = useState<ActiveTab>("recipes");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState<number | null>(null);

  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeCategory, setRecipeCategory] = useState("all");
  const [recipeSort, setRecipeSort] = useState<RecipeSort>("dateDesc");
  const [recipePage, setRecipePage] = useState(1);

  const [commentSearch, setCommentSearch] = useState("");
  const [commentRecipeId, setCommentRecipeId] = useState("all");
  const [commentSort, setCommentSort] = useState<CommentSort>("dateDesc");
  const [commentPage, setCommentPage] = useState(1);

  const [deletingRecipeId, setDeletingRecipeId] = useState<string | null>(null);
  const [deletingCommentKey, setDeletingCommentKey] = useState<string | null>(
    null,
  );

  const loadData = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const base = await fetchRecipes();
      const results = await Promise.allSettled(
        base.map(async (recipe) => ({
          ...recipe,
          comments: await fetchComments(recipe.id),
        })),
      );

      const nextRecipes: ModeratedRecipe[] = [];
      let failedCommentLoads = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          nextRecipes.push(result.value);
        } else {
          failedCommentLoads += 1;
          nextRecipes.push({ ...base[index], comments: [] });
        }
      });

      setRecipes(nextRecipes);

      if (failedCommentLoads > 0) {
        setError(
          `Không thể tải bình luận của ${failedCommentLoads} công thức. Bạn có thể tải lại để thử lại.`,
        );
      }
    } catch {
      setError("Không thể tải dữ liệu quản trị. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setNow(Date.now());
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const allComments = useMemo<AdminComment[]>(
    () =>
      recipes.flatMap((recipe) =>
        recipe.comments.map((comment) => ({
          ...comment,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          recipeSlug: recipe.slug,
        })),
      ),
    [recipes],
  );

  const stats = useMemo(() => {
    const since = now === null ? null : now - 7 * 24 * 60 * 60 * 1000;
    const commentsLast7Days =
      since === null
        ? 0
        : allComments.filter((comment) => sortDate(comment.createdAt) >= since)
            .length;
    const commentedRecipes = recipes.filter(
      (recipe) => recipe.comments.length > 0,
    ).length;

    return {
      recipes: recipes.length,
      comments: allComments.length,
      commentsLast7Days,
      commentedRecipes,
      recipesWithoutComments: Math.max(0, recipes.length - commentedRecipes),
    };
  }, [allComments, now, recipes]);

  const filteredRecipes = useMemo(() => {
    const search = normalized(recipeSearch);

    return recipes
      .filter((recipe) => {
        const matchesSearch =
          !search ||
          normalized(recipe.title).includes(search) ||
          normalized(recipe.description).includes(search) ||
          normalized(recipe.slug).includes(search);
        const matchesCategory =
          recipeCategory === "all" || recipe.category === recipeCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (recipeSort) {
          case "alphabetDesc":
            return b.title.localeCompare(a.title, "vi");
          case "dateAsc":
            return sortDate(a.createdAt, b.createdAt);
          case "dateDesc":
            return sortDate(b.createdAt, a.createdAt);
          case "commentsAsc":
            return a.comments.length - b.comments.length;
          case "commentsDesc":
            return b.comments.length - a.comments.length;
          case "alphabetAsc":
          default:
            return a.title.localeCompare(b.title, "vi");
        }
      });
  }, [recipes, recipeSearch, recipeCategory, recipeSort]);

  const currentRecipePage = Math.min(
    recipePage,
    Math.max(1, Math.ceil(filteredRecipes.length / RECIPE_ITEMS)),
  );
  const currentRecipes = filteredRecipes.slice(
    (currentRecipePage - 1) * RECIPE_ITEMS,
    currentRecipePage * RECIPE_ITEMS,
  );

  const filteredComments = useMemo(() => {
    const search = normalized(commentSearch);

    return allComments
      .filter((comment) => {
        const haystack = [
          comment.text,
          comment.username,
          comment.userId,
          comment.recipeTitle,
        ]
          .map(normalized)
          .join(" ");

        const matchesSearch = !search || haystack.includes(search);
        const matchesRecipe =
          commentRecipeId === "all" || comment.recipeId === commentRecipeId;

        return matchesSearch && matchesRecipe;
      })
      .sort((a, b) => {
        switch (commentSort) {
          case "dateAsc":
            return sortDate(a.createdAt, b.createdAt);
          case "userAsc":
            return (a.username ?? "").localeCompare(b.username ?? "", "vi");
          case "recipeAsc":
            return a.recipeTitle.localeCompare(b.recipeTitle, "vi");
          case "dateDesc":
          default:
            return sortDate(b.createdAt, a.createdAt);
        }
      });
  }, [allComments, commentSearch, commentRecipeId, commentSort]);

  const currentCommentPage = Math.min(
    commentPage,
    Math.max(1, Math.ceil(filteredComments.length / COMMENT_ITEMS)),
  );
  const currentComments = filteredComments.slice(
    (currentCommentPage - 1) * COMMENT_ITEMS,
    currentCommentPage * COMMENT_ITEMS,
  );

  function showRecipeComments(recipeId: string) {
    setCommentRecipeId(recipeId);
    setCommentSearch("");
    setCommentPage(1);
    setActiveTab("comments");
  }

  function clearCommentFilters() {
    setCommentSearch("");
    setCommentRecipeId("all");
    setCommentSort("dateDesc");
    setCommentPage(1);
  }

  function updateRecipeSearch(value: string) {
    setRecipeSearch(value);
    setRecipePage(1);
  }

  function updateRecipeCategory(value: string) {
    setRecipeCategory(value);
    setRecipePage(1);
  }

  function updateRecipeSort(value: RecipeSort) {
    setRecipeSort(value);
    setRecipePage(1);
  }

  function updateCommentSearch(value: string) {
    setCommentSearch(value);
    setCommentPage(1);
  }

  function updateCommentRecipe(value: string) {
    setCommentRecipeId(value);
    setCommentPage(1);
  }

  function updateCommentSort(value: CommentSort) {
    setCommentSort(value);
    setCommentPage(1);
  }

  async function removeRecipe(id: string) {
    const recipe = recipes.find((item) => item.id === id);
    const title = recipe?.title ?? "công thức này";

    if (!window.confirm(`Xóa ${title}? Hành động không thể hoàn tác.`)) return;

    setDeletingRecipeId(id);
    setError("");

    try {
      await deleteRecipe(id);
      setRecipes((prev) => prev.filter((item) => item.id !== id));

      if (commentRecipeId === id) {
        clearCommentFilters();
      }
    } catch {
      setError("Không thể xóa công thức.");
    } finally {
      setDeletingRecipeId(null);
    }
  }

  async function removeComment(recipeId: string, commentId: string) {
    const comment = allComments.find(
      (item) => item.recipeId === recipeId && item.id === commentId,
    );

    const author = comment?.username || "người dùng";
    if (
      !window.confirm(
        `Xóa bình luận của ${author}? Hành động không thể hoàn tác.`,
      )
    ) {
      return;
    }

    const commentKey = `${recipeId}:${commentId}`;
    setDeletingCommentKey(commentKey);
    setError("");

    try {
      await deleteComment(recipeId, commentId);
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === recipeId
            ? {
                ...recipe,
                comments: recipe.comments.filter(
                  (item) => item.id !== commentId,
                ),
              }
            : recipe,
        ),
      );
    } catch {
      setError("Không thể xóa bình luận.");
    } finally {
      setDeletingCommentKey(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="eyebrow">
            <Icon name="settings" size={15} /> Phòng bếp quản trị
          </span>
          <h1 className="section-title">Quản trị nội dung</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Quản lý công thức, theo dõi hoạt động bình luận và dọn dẹp nội dung
            không phù hợp trong cộng đồng.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary shrink-0 self-start lg:self-auto"
          onClick={() => void loadData(true)}
          disabled={loading || refreshing}
        >
          <Icon
            name="refresh"
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Đang tải lại..." : "Tải lại dữ liệu"}
        </button>
      </header>

      {error && (
        <div className="mb-5">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {loading ? (
        <LoadingBlock label="Đang tải dữ liệu quản trị..." />
      ) : (
        <>
          <section
            aria-label="Tổng quan"
            className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
          >
            <StatCard
              icon="book"
              label="Công thức"
              value={stats.recipes}
              detail="Tổng số công thức"
            />
            <StatCard
              icon="comment"
              label="Bình luận"
              value={stats.comments}
              detail="Tổng số bình luận"
            />
            <StatCard
              icon="calendar"
              label="7 ngày qua"
              value={stats.commentsLast7Days}
              detail="Bình luận mới"
            />
            <StatCard
              icon="eye"
              label="Có tương tác"
              value={stats.commentedRecipes}
              detail="Công thức có bình luận"
            />
            <StatCard
              icon="comment-off"
              label="Chưa có bình luận"
              value={stats.recipesWithoutComments}
              detail="Cần thêm tương tác"
            />
          </section>

          <div className="mb-6 rounded-3xl border border-border bg-card p-1 shadow-sm">
            <div className="grid gap-1 sm:grid-cols-2">
              <TabButton
                active={activeTab === "recipes"}
                count={filteredRecipes.length}
                icon="book"
                label="Công thức"
                onClick={() => setActiveTab("recipes")}
              />
              <TabButton
                active={activeTab === "comments"}
                count={filteredComments.length}
                icon="comment"
                label="Bình luận"
                onClick={() => setActiveTab("comments")}
              />
            </div>
          </div>

          {activeTab === "recipes" ? (
            <RecipesSection
              recipeSearch={recipeSearch}
              recipeCategory={recipeCategory}
              recipeSort={recipeSort}
              currentRecipes={currentRecipes}
              filteredCount={filteredRecipes.length}
              recipePage={currentRecipePage}
              deletingRecipeId={deletingRecipeId}
              deletingCommentKey={deletingCommentKey}
              onSearch={updateRecipeSearch}
              onCategory={updateRecipeCategory}
              onSort={updateRecipeSort}
              onPageChange={setRecipePage}
              onDeleteRecipe={removeRecipe}
              onDeleteComment={removeComment}
              onShowAllComments={showRecipeComments}
            />
          ) : (
            <CommentsSection
              comments={currentComments}
              totalFiltered={filteredComments.length}
              recipes={recipes}
              search={commentSearch}
              recipeId={commentRecipeId}
              sort={commentSort}
              page={currentCommentPage}
              deletingCommentKey={deletingCommentKey}
              onSearch={updateCommentSearch}
              onRecipe={updateCommentRecipe}
              onSort={updateCommentSort}
              onPageChange={setCommentPage}
              onDelete={removeComment}
              onClear={clearCommentFilters}
            />
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: "book" | "comment" | "calendar" | "eye" | "comment-off";
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-wider text-muted">
            {label}
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-lacquer">
            {value.toLocaleString("vi-VN")}
          </div>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gold/10 text-turmeric-700">
          <Icon name={icon} size={18} />
        </span>
      </div>
      <p className="mt-2 text-xs text-muted">{detail}</p>
    </article>
  );
}

function TabButton({
  active,
  count,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  icon: "book" | "comment";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition ${
        active
          ? "bg-lacquer text-ivory shadow-sm"
          : "text-muted hover:bg-cream hover:text-lacquer"
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon name={icon} size={16} /> {label}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          active ? "bg-ivory/15 text-ivory" : "bg-cream text-ink"
        }`}
      >
        {count.toLocaleString("vi-VN")}
      </span>
    </button>
  );
}

function RecipesSection({
  recipeSearch,
  recipeCategory,
  recipeSort,
  currentRecipes,
  filteredCount,
  recipePage,
  deletingRecipeId,
  deletingCommentKey,
  onSearch,
  onCategory,
  onSort,
  onPageChange,
  onDeleteRecipe,
  onDeleteComment,
  onShowAllComments,
}: {
  recipeSearch: string;
  recipeCategory: string;
  recipeSort: RecipeSort;
  currentRecipes: ModeratedRecipe[];
  filteredCount: number;
  recipePage: number;
  deletingRecipeId: string | null;
  deletingCommentKey: string | null;
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
  onSort: (value: RecipeSort) => void;
  onPageChange: (page: number) => void;
  onDeleteRecipe: (id: string) => void;
  onDeleteComment: (recipeId: string, commentId: string) => void;
  onShowAllComments: (recipeId: string) => void;
}) {
  return (
    <section>
      <div className="mb-5 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr]">
          <label>
            <span className="form-label">
              <Icon name="search" size={15} /> Tìm công thức
            </span>
            <input
              value={recipeSearch}
              onChange={(event) => onSearch(event.target.value)}
              className="form-input"
              placeholder="Tên, mô tả hoặc slug..."
            />
          </label>

          <label>
            <span className="form-label">Danh mục</span>
            <select
              value={recipeCategory}
              onChange={(event) => onCategory(event.target.value)}
              className="form-input"
            >
              <option value="all">Tất cả danh mục</option>
              {RECIPE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {categoryLabel(category)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="form-label">Sắp xếp</span>
            <select
              value={recipeSort}
              onChange={(event) => onSort(event.target.value as RecipeSort)}
              className="form-input"
            >
              <option value="dateDesc">Mới nhất</option>
              <option value="dateAsc">Cũ nhất</option>
              <option value="alphabetAsc">Tên A → Z</option>
              <option value="alphabetDesc">Tên Z → A</option>
              <option value="commentsDesc">Nhiều bình luận nhất</option>
              <option value="commentsAsc">Ít bình luận nhất</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>
            Đang hiển thị <strong className="text-ink">{filteredCount}</strong>{" "}
            công thức phù hợp.
          </span>
          {recipeSearch || recipeCategory !== "all" ? (
            <button
              type="button"
              className="font-bold text-lacquer hover:underline"
              onClick={() => {
                onSearch("");
                onCategory("all");
              }}
            >
              Xóa bộ lọc
            </button>
          ) : null}
        </div>
      </div>

      {currentRecipes.length ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {currentRecipes.map((recipe) => (
              <div key={recipe.id}>
                <div
                  className={
                    deletingRecipeId === recipe.id
                      ? "pointer-events-none opacity-60"
                      : ""
                  }
                >
                  <RecipeCard
                    recipe={recipe}
                    admin
                    onDelete={() => void onDeleteRecipe(recipe.id)}
                  />
                </div>

                <div className="mt-3 rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted">
                      <Icon name="comment" size={14} /> Bình luận
                      <span className="rounded-full bg-cream px-2 py-0.5 text-ink">
                        {recipe.comments.length}
                      </span>
                    </div>
                    {recipe.comments.length > 0 ? (
                      <button
                        type="button"
                        className="text-xs font-bold text-lacquer hover:underline"
                        onClick={() => onShowAllComments(recipe.id)}
                      >
                        Quản lý tất cả
                      </button>
                    ) : null}
                  </div>

                  {recipe.comments.length ? (
                    <div className="mt-3 space-y-2">
                      {recipe.comments.slice(0, 3).map((comment) => (
                        <CommentPreview
                          key={comment.id}
                          comment={comment}
                          deleting={
                            deletingCommentKey === `${recipe.id}:${comment.id}`
                          }
                          onDelete={() =>
                            onDeleteComment(recipe.id, comment.id)
                          }
                        />
                      ))}

                      {recipe.comments.length > 3 ? (
                        <button
                          type="button"
                          className="mt-1 w-full rounded-xl border border-dashed border-border px-3 py-2 text-xs font-bold text-muted transition hover:border-lacquer/30 hover:text-lacquer"
                          onClick={() => onShowAllComments(recipe.id)}
                        >
                          Xem thêm {recipe.comments.length - 3} bình luận
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl bg-cream/50 p-3 text-xs text-muted">
                      Chưa có bình luận.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination
            itemsPerPage={RECIPE_ITEMS}
            totalItems={filteredCount}
            currentPage={recipePage}
            onPageChange={onPageChange}
          />
        </>
      ) : (
        <EmptyState
          icon="book"
          title="Không tìm thấy công thức"
          description="Hãy thử thay đổi từ khóa hoặc bộ lọc danh mục."
        />
      )}
    </section>
  );
}

function CommentPreview({
  comment,
  deleting,
  onDelete,
}: {
  comment: Comment;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl bg-cream/60 p-3 text-sm ${
        deleting ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <strong className="text-ink">
            {comment.username || "Người dùng"}
          </strong>
          <span className="text-xs text-muted">
            {formatDate(comment.createdAt)}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 leading-6 text-muted">{comment.text}</p>
      </div>
      <button
        type="button"
        className="icon-button icon-button-danger shrink-0"
        disabled={deleting}
        onClick={onDelete}
        aria-label="Xóa bình luận"
        title="Xóa bình luận"
      >
        <Icon name="comment-off" size={16} />
      </button>
    </div>
  );
}

function CommentsSection({
  comments,
  totalFiltered,
  recipes,
  search,
  recipeId,
  sort,
  page,
  deletingCommentKey,
  onSearch,
  onRecipe,
  onSort,
  onPageChange,
  onDelete,
  onClear,
}: {
  comments: AdminComment[];
  totalFiltered: number;
  recipes: ModeratedRecipe[];
  search: string;
  recipeId: string;
  sort: CommentSort;
  page: number;
  deletingCommentKey: string | null;
  onSearch: (value: string) => void;
  onRecipe: (value: string) => void;
  onSort: (value: CommentSort) => void;
  onPageChange: (page: number) => void;
  onDelete: (recipeId: string, commentId: string) => void;
  onClear: () => void;
}) {
  return (
    <section>
      <div className="mb-5 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr]">
          <label>
            <span className="form-label">
              <Icon name="search" size={15} /> Tìm bình luận
            </span>
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              className="form-input"
              placeholder="Nội dung, người dùng, ID hoặc công thức..."
            />
          </label>

          <label>
            <span className="form-label">Công thức</span>
            <select
              value={recipeId}
              onChange={(event) => onRecipe(event.target.value)}
              className="form-input"
            >
              <option value="all">Tất cả công thức</option>
              {recipes
                .filter((recipe) => recipe.comments.length > 0)
                .sort((a, b) => a.title.localeCompare(b.title, "vi"))
                .map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.title}
                  </option>
                ))}
            </select>
          </label>

          <label>
            <span className="form-label">Sắp xếp</span>
            <select
              value={sort}
              onChange={(event) => onSort(event.target.value as CommentSort)}
              className="form-input"
            >
              <option value="dateDesc">Mới nhất</option>
              <option value="dateAsc">Cũ nhất</option>
              <option value="userAsc">Tên người dùng A → Z</option>
              <option value="recipeAsc">Tên công thức A → Z</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>
            Đang hiển thị <strong className="text-ink">{totalFiltered}</strong>{" "}
            bình luận phù hợp.
          </span>
          {search || recipeId !== "all" || sort !== "dateDesc" ? (
            <button
              type="button"
              className="font-bold text-lacquer hover:underline"
              onClick={onClear}
            >
              Đặt lại bộ lọc
            </button>
          ) : null}
        </div>
      </div>

      {comments.length ? (
        <>
          <div className="space-y-3">
            {comments.map((comment) => (
              <article
                key={`${comment.recipeId}-${comment.id}`}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="font-bold text-ink">
                        {comment.username || "Người dùng"}
                      </span>
                      {comment.userId ? (
                        <span className="rounded-full bg-cream px-2 py-0.5 text-xs text-muted">
                          UID: {comment.userId}
                        </span>
                      ) : (
                        <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-bold text-turmeric-700">
                          Khách
                        </span>
                      )}
                      <span className="text-xs text-muted">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink">
                      {comment.text}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold uppercase tracking-wider text-muted">
                        Công thức:
                      </span>
                      <Link
                        href={`/cong-thuc/${comment.recipeSlug}`}
                        className="inline-flex items-center gap-1 rounded-full bg-cream px-3 py-1.5 font-bold text-lacquer hover:bg-gold/15"
                      >
                        <Icon name="eye" size={13} /> {comment.recipeTitle}
                      </Link>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-secondary text-red-700 hover:border-red-200 hover:bg-red-50 hover:text-red-800"
                    disabled={
                      deletingCommentKey === `${comment.recipeId}:${comment.id}`
                    }
                    onClick={() => onDelete(comment.recipeId, comment.id)}
                  >
                    <Icon name="comment-off" size={16} />
                    {deletingCommentKey === `${comment.recipeId}:${comment.id}`
                      ? "Đang xóa..."
                      : "Xóa bình luận"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <Pagination
            itemsPerPage={COMMENT_ITEMS}
            totalItems={totalFiltered}
            currentPage={page}
            onPageChange={onPageChange}
          />
        </>
      ) : (
        <EmptyState
          icon="comment"
          title="Không có bình luận phù hợp"
          description="Thử thay đổi từ khóa, công thức hoặc cách sắp xếp."
        />
      )}
    </section>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: "book" | "comment";
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-sm">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-cream text-lacquer">
        <Icon name={icon} size={24} />
      </div>
      <h2 className="mt-4 font-serif text-2xl font-bold text-lacquer">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
        {description}
      </p>
    </div>
  );
}
