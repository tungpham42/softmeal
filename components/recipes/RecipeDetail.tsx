"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RecipePageData } from "@/lib/firebase/server";
import { useAuth } from "@/components/auth/AuthProvider";
import Icon from "@/components/ui/Icon";
import Alert from "@/components/ui/Alert";
import { categoryAccent, categoryLabel } from "@/lib/category";
import { youtubeEmbedUrl } from "@/lib/youtube";
import RecipeImage from "@/components/recipe/RecipeImage";
import { nutritionRows } from "@/lib/nutrition";
import { formatRecipeYield } from "@/lib/recipeYield";
import { SITE_NAME } from "@/lib/seo";
import ShoppingPanel from "@/components/recipes/ShoppingPanel";
import ShareLinks from "@/components/recipes/ShareLinks";
import RecipeComments from "@/components/recipes/RecipeComments";
import { getYouTubeSourceUrl } from "@/lib/recipes/youtube-source";
import { useRecipeComments } from "@/hooks/useRecipeComments";
import { useRecipeViewCount } from "@/hooks/useRecipeViewCount";


export default function RecipeDetail({
  initialData,
}: {
  initialData: RecipePageData | null;
}) {
  const { currentUser, isAdmin } = useAuth();

  // Everything arrives pre-fetched from the server page: no spinner, no
  // client-side fetch waterfall.
  const recipe = initialData?.recipe ?? null;
  const author = initialData?.author ?? "Tác giả ẩn danh";
  const related = initialData?.related ?? [];

  const {
    comments,
    commentText,
    setCommentText,
    guestName,
    setGuestName,
    error,
    commentBusy,
    submitComment,
  } = useRecipeComments({
    recipeId: recipe?.id,
    initialComments: initialData?.comments ?? [],
    currentUser,
  });
  const [relatedPage, setRelatedPage] = useState(1);

  const [doneIngredients, setDoneIngredients] = useState<Set<number>>(
    () => new Set(),
  );

  const [doneSteps, setDoneSteps] = useState<Set<number>>(() => new Set());

  const views = useRecipeViewCount(recipe?.id, recipe?.views ?? 0);

  function toggleItem(
    setter: (updater: (prev: Set<number>) => Set<number>) => void,
    index: number,
  ) {
    setter((prev) => {
      const next = new Set(prev);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  }

  const embed = useMemo(
    () => youtubeEmbedUrl(recipe?.youtubeUrl),
    [recipe?.youtubeUrl],
  );

  const youtubeSourceUrl = useMemo(
    () => getYouTubeSourceUrl(recipe?.youtubeUrl),
    [recipe?.youtubeUrl],
  );

  const relatedItems = related.slice((relatedPage - 1) * 3, relatedPage * 3);

  const relatedPages = Math.max(1, Math.ceil(related.length / 3));


  if (!recipe) {
    return (
      <div className="mx-auto max-w-2xl">
        <Alert tone="warning">Không tìm thấy công thức.</Alert>
      </div>
    );
  }

  const owner = currentUser?.uid && recipe.userId === currentUser.uid;

  return (
    <article className="mx-auto max-w-5xl">
      <div className="mb-5 text-sm text-muted">
        <Link href="/" className="hover:text-lacquer">
          {SITE_NAME}
        </Link>

        <span className="mx-2">/</span>

        <Link
          href={`/?category=${encodeURIComponent(recipe.category)}`}
          className="hover:text-lacquer"
        >
          {categoryLabel(recipe.category)}
        </Link>

        <span className="mx-2">/</span>
        <span>{recipe.title}</span>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_18px_70px_rgba(83,43,23,0.1)]">
        <div className="relative aspect-[16/8] bg-cream">
          <RecipeImage
            imageUrl={recipe.imageUrl}
            youtubeUrl={recipe.youtubeUrl}
            alt={recipe.title}
            priority
            sizes="100vw"
            className="object-cover"
            fallback={
              <div className="grid h-full place-items-center text-lacquer/20">
                <Icon name="bowl" size={90} strokeWidth={1.2} />
              </div>
            }
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

          <div className="absolute bottom-5 left-5 right-5">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold backdrop-blur ${
                categoryAccent[recipe.category] ?? "bg-ivory/90 text-lacquer"
              }`}
            >
              {categoryLabel(recipe.category)}
            </span>

            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-bold leading-tight text-white drop-shadow md:text-5xl">
              {recipe.title}
            </h1>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_290px]">
            <div>
              <p className="text-base leading-8 text-muted">
                {recipe.description}
              </p>

              <div className="mt-5 space-y-2 rounded-2xl bg-cream/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Icon name="user" size={16} className="text-lacquer" />
                  Tác giả: {author}
                </div>

                {/* Mirrors the recipeYield value in the JSON-LD. */}
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Icon name="bowl" size={16} className="text-lacquer" />
                  Khẩu phần: {formatRecipeYield(recipe)}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Icon name="eye" size={16} className="text-lacquer" />
                  Lượt xem: {views.toLocaleString("vi-VN")}
                </div>
              </div>

              <div className="mt-7">
                <h2 className="subheading">
                  <Icon name="share" size={19} />
                  Chia sẻ công thức
                </h2>

                <ShareLinks title={recipe.title} />
              </div>

              {embed && (
                <section className="mt-8">
                  <h2 className="subheading">
                    <Icon name="youtube" size={19} />
                    Video hướng dẫn
                  </h2>

                  <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-black">
                    <iframe
                      src={embed}
                      title={recipe.title}
                      className="h-full w-full"
                      allowFullScreen
                    />
                  </div>
                </section>
              )}

              {youtubeSourceUrl && (
                <section
                  aria-labelledby="recipe-source-heading"
                  className="mt-8 rounded-2xl border border-border bg-cream/60 p-4 sm:p-5"
                >
                  <h2
                    id="recipe-source-heading"
                    className="flex items-center gap-2 font-semibold text-ink"
                  >
                    <Icon name="youtube" size={18} className="text-lacquer" />
                    Nguồn tham khảo
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    Công thức này tham khảo từ video YouTube gốc. Bạn có thể xem
                    video để đối chiếu nguyên liệu và các bước thực hiện.
                  </p>

                  <a
                    href={youtubeSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-lacquer underline underline-offset-4 hover:text-lacquer/80"
                  >
                    Xem video gốc trên YouTube
                  </a>

                  <p className="mt-2 text-xs leading-5 text-muted">
                    Video và nội dung gốc thuộc về chủ sở hữu tương ứng.
                  </p>
                </section>
              )}

              {/* Ingredients and per-ingredient shopping links */}
              <section className="mt-8">
                <h2 className="subheading">
                  <Icon name="list" size={19} />
                  Nguyên liệu{" "}
                  <span className="text-sm font-sans font-medium text-muted">
                    ({recipe.ingredients.length})
                  </span>
                </h2>

                <ul className="mt-4 grid gap-x-10 rounded-3xl bg-cream/50 px-5 py-2 sm:grid-cols-2 sm:px-6">
                  {recipe.ingredients.map((item, index) => {
                    const done = doneIngredients.has(index);

                    return (
                      <li
                        key={`${item}-${index}`}
                        className="border-b border-dashed border-border py-3"
                      >
                        {/* Ingredient checklist */}
                        <button
                          type="button"
                          aria-pressed={done}
                          onClick={() => toggleItem(setDoneIngredients, index)}
                          className="group flex w-full items-start gap-3 text-left text-sm leading-6 text-ink transition-colors hover:text-lacquer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lacquer"
                        >
                          <span
                            aria-hidden
                            className={`mt-2 size-2 shrink-0 rounded-full transition-all duration-200 ${
                              done
                                ? "scale-125 bg-lacquer"
                                : "bg-gold group-hover:scale-150 group-hover:bg-lacquer"
                            }`}
                          />

                          <span
                            className={
                              done
                                ? "text-muted line-through decoration-lacquer/40"
                                : ""
                            }
                          >
                            {item}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <ShoppingPanel ingredients={recipe.ingredients} />
              </section>

              {/* Nutrition */}
              {nutritionRows(recipe.nutrition).length > 0 && (
                <section className="mt-8">
                  <h2 className="subheading">
                    <Icon name="list" size={19} />
                    Dinh dưỡng{" "}
                    <span className="text-sm font-sans font-medium text-muted">
                      (mỗi khẩu phần)
                    </span>
                  </h2>

                  <dl className="mt-4 grid gap-x-10 rounded-3xl bg-cream/50 px-5 py-2 sm:grid-cols-2 sm:px-6">
                    {nutritionRows(recipe.nutrition).map((row) => (
                      <div
                        key={row.label}
                        className="flex justify-between border-b border-dashed border-border py-3 text-sm"
                      >
                        <dt className="text-muted">{row.label}</dt>

                        <dd className="font-semibold text-ink">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {/* Cooking steps checklist */}
              <section className="mt-8">
                <h2 className="subheading">
                  <Icon name="route" size={19} />
                  Cách làm
                </h2>

                <ul className="mt-5">
                  {recipe.steps.map((item, index) => {
                    const done = doneSteps.has(index);
                    const last = index === recipe.steps.length - 1;

                    return (
                      <li key={`${item}-${index}`}>
                        <button
                          type="button"
                          aria-pressed={done}
                          onClick={() => toggleItem(setDoneSteps, index)}
                          className={`group relative block w-full pl-9 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lacquer ${
                            last ? "" : "pb-6"
                          }`}
                        >
                          {!last && (
                            <span
                              aria-hidden
                              className={`absolute bottom-0 left-[6px] top-6 w-0.5 rounded-full transition-colors duration-300 ${
                                done ? "bg-lacquer" : "bg-gold/40"
                              }`}
                            />
                          )}

                          <span
                            aria-hidden
                            className={`absolute left-0 top-[7px] size-3.5 rounded-full border-2 border-lacquer transition-all duration-200 group-hover:ring-4 group-hover:ring-gold/30 ${
                              done
                                ? "bg-lacquer"
                                : "bg-ivory group-hover:bg-gold"
                            }`}
                          />

                          <span
                            className={`block text-sm leading-7 transition-colors ${
                              done
                                ? "text-muted line-through decoration-lacquer/40"
                                : "text-ink"
                            }`}
                          >
                            {item}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <RecipeComments
                comments={comments}
                isSignedIn={Boolean(currentUser)}
                guestName={guestName}
                onGuestNameChange={setGuestName}
                commentText={commentText}
                onCommentTextChange={setCommentText}
                error={error}
                commentBusy={commentBusy}
                onSubmit={submitComment}
              />
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              {(owner || isAdmin) && (
                <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4">
                  <div className="text-sm font-bold text-lacquer">
                    Quản lý công thức
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/sua-cong-thuc/${recipe.slug}`}
                      className="btn-secondary"
                    >
                      <Icon name="edit" size={15} />
                      Chỉnh sửa
                    </Link>
                  </div>
                </div>
              )}

              {related.length > 0 && (
                <div>
                  <h2 className="subheading text-lg">Món cùng danh mục</h2>

                  <div className="mt-3 space-y-3">
                    {relatedItems.map((item) => (
                      <Link
                        key={item.id}
                        href={`/cong-thuc/${item.slug}`}
                        className="block rounded-2xl border border-border bg-cream/40 p-3 transition hover:-translate-y-0.5 hover:bg-cream"
                      >
                        <div className="text-xs font-bold text-muted">
                          {categoryLabel(item.category)}
                        </div>

                        <div className="mt-1 font-serif text-lg font-bold text-ink">
                          {item.title}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {relatedPages > 1 && (
                    <div className="mt-3 flex justify-between">
                      <button
                        className="page-button"
                        disabled={relatedPage === 1}
                        onClick={() => setRelatedPage((p) => p - 1)}
                        aria-label="Trang trước"
                      >
                        <Icon name="chevron-left" />
                      </button>

                      <span className="self-center text-xs text-muted">
                        {relatedPage} / {relatedPages}
                      </span>

                      <button
                        className="page-button"
                        disabled={relatedPage === relatedPages}
                        onClick={() => setRelatedPage((p) => p + 1)}
                        aria-label="Trang tiếp theo"
                      >
                        <Icon name="chevron-right" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </article>
  );
}
