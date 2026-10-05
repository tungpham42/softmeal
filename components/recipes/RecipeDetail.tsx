"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Comment, Recipe } from "@/lib/types";
import {
  addRecipeComment,
  fetchComments,
  fetchRecipeBySlug,
  fetchRecipes,
  getAuthorName,
} from "@/lib/firebase/data";
import { useAuth } from "@/components/auth/AuthProvider";
import Icon from "@/components/ui/Icon";
import Alert, { LoadingBlock } from "@/components/ui/Alert";
import { categoryAccent, categoryLabel } from "@/lib/category";

function youtubeEmbed(url?: string) {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([^?&/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function subscribeToLocation() {
  return () => {};
}

function getLocationHref() {
  return window.location.href;
}

function ShareLinks({ title }: { title: string }) {
  const url = useSyncExternalStore(
    subscribeToLocation,
    getLocationHref,
    () => "",
  );
  if (!url) return null;
  const encoded = encodeURIComponent(url);
  return (
    <div className="flex flex-wrap gap-2">
      <a
        className="share facebook"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chia sẻ Facebook"
      >
        <Icon name="facebook" />
      </a>
      <a
        className="share x"
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chia sẻ X"
      >
        <Icon name="x" />
      </a>
      <a
        className="share pinterest"
        href={`https://pinterest.com/pin/create/button/?url=${encoded}&description=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chia sẻ Pinterest"
      >
        <Icon name="pinterest" />
      </a>
      <a
        className="share linkedin"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chia sẻ LinkedIn"
      >
        <Icon name="linkedin" />
      </a>
    </div>
  );
}

export default function RecipeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { currentUser, isAdmin } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [author, setAuthor] = useState("Tác giả ẩn danh");
  const [comments, setComments] = useState<Comment[]>([]);
  const [related, setRelated] = useState<Recipe[]>([]);
  const [commentText, setCommentText] = useState("");
  const [relatedPage, setRelatedPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const item = await fetchRecipeBySlug(slug);
        if (!alive) return;
        if (!item) {
          setError("Không tìm thấy công thức.");
          return;
        }
        setRecipe(item);
        const [commentData, allRecipes, authorName] = await Promise.all([
          fetchComments(item.id),
          fetchRecipes(),
          getAuthorName(item.userId),
        ]);
        if (!alive) return;
        setComments(commentData);
        setAuthor(authorName);
        setRelated(
          allRecipes
            .filter((x) => x.id !== item.id && x.category === item.category)
            .slice(0, 12),
        );
      } catch {
        if (alive) setError("Không thể tải công thức. Vui lòng thử lại.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [slug]);

  const embed = useMemo(
    () => youtubeEmbed(recipe?.youtubeUrl),
    [recipe?.youtubeUrl],
  );
  const relatedItems = related.slice((relatedPage - 1) * 3, relatedPage * 3);
  const relatedPages = Math.max(1, Math.ceil(related.length / 3));

  async function submitComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser || !recipe || !commentText.trim()) return;
    setCommentBusy(true);
    try {
      await addRecipeComment(recipe.id, {
        text: commentText.trim(),
        userId: currentUser.uid,
        username: currentUser.displayName || "Người dùng ẩn danh",
      });
      setCommentText("");
      setComments(await fetchComments(recipe.id));
    } catch {
      setError("Không thể đăng bình luận.");
    } finally {
      setCommentBusy(false);
    }
  }

  if (loading) return <LoadingBlock label="Đang mở trang món ngon..." />;
  if (error || !recipe)
    return (
      <div className="mx-auto max-w-2xl">
        <Alert tone="warning">{error || "Không tìm thấy công thức."}</Alert>
      </div>
    );

  const owner = currentUser?.uid && recipe.userId === currentUser.uid;
  return (
    <article className="mx-auto max-w-5xl">
      <div className="mb-5 text-sm text-muted">
        <Link href="/" className="hover:text-lacquer">
          Bếp nhà Tùng
        </Link>
        <span className="mx-2">/</span>
        <span>{recipe.title}</span>
      </div>
      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_18px_70px_rgba(83,43,23,0.1)]">
        <div className="relative aspect-[16/8] bg-cream">
          {recipe.imageUrl ? (
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-lacquer/20">
              <Icon name="bowl" size={90} strokeWidth={1.2} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold backdrop-blur ${categoryAccent[recipe.category] ?? "bg-ivory/90 text-lacquer"}`}
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
              <div className="mt-5 rounded-2xl bg-cream/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Icon name="user" size={16} className="text-lacquer" /> Tác
                  giả: {author}
                </div>
              </div>
              <div className="mt-7">
                <h2 className="subheading">
                  <Icon name="share" size={19} /> Chia sẻ công thức
                </h2>
                <ShareLinks title={recipe.title} />
              </div>
              {embed && (
                <section className="mt-8">
                  <h2 className="subheading">
                    <Icon name="youtube" size={19} /> Video hướng dẫn
                  </h2>
                  <div className="overflow-hidden rounded-2xl border border-border bg-black aspect-video">
                    <iframe
                      src={embed}
                      title={recipe.title}
                      className="h-full w-full"
                      allowFullScreen
                    />
                  </div>
                </section>
              )}
              <section className="mt-8">
                <h2 className="subheading">
                  <Icon name="list" size={19} /> Nguyên liệu
                </h2>
                <ol className="mt-4 space-y-2">
                  {recipe.ingredients.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex gap-3 rounded-2xl border border-border/70 bg-cream/50 px-4 py-3 text-sm leading-6 text-ink"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gold font-serif font-bold text-lacquer">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="mt-8">
                <h2 className="subheading">
                  <Icon name="route" size={19} /> Cách làm
                </h2>
                <ol className="mt-4 space-y-4">
                  {recipe.steps.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lacquer text-sm font-bold text-ivory shadow-sm">
                        {index + 1}
                      </span>
                      <p className="pt-1 text-sm leading-7 text-ink">{item}</p>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="mt-10 border-t border-border pt-8">
                <h2 className="subheading">
                  <Icon name="comment" size={19} /> Bình luận{" "}
                  <span className="text-sm font-sans font-medium text-muted">
                    ({comments.length})
                  </span>
                </h2>
                {comments.length ? (
                  <div className="mt-4 space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-2xl border border-border bg-cream/40 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-sm text-ink">
                            {comment.username || "Người dùng"}
                          </strong>
                          <span className="text-xs text-muted">
                            {comment.createdAt
                              ? new Date(
                                  comment.createdAt as string,
                                ).toLocaleDateString("vi-VN")
                              : ""}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted">
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl bg-cream/60 p-4 text-sm text-muted">
                    Chưa có bình luận. Hãy là người đầu tiên góp chuyện!
                  </p>
                )}
                <div className="mt-5">
                  {currentUser ? (
                    <form onSubmit={submitComment}>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="form-input min-h-28"
                        required
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
                            <Icon name="comment" size={16} /> Đăng bình luận
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <Alert tone="warning">
                      Vui lòng{" "}
                      <Link href="/dang-nhap" className="font-bold underline">
                        đăng nhập
                      </Link>{" "}
                      để thêm bình luận.
                    </Alert>
                  )}
                </div>
              </section>
            </div>
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
                      <Icon name="edit" size={15} /> Chỉnh sửa
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
