"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Recipe } from "@/lib/types";
import {
  createRecipe,
  fetchRecipeBySlug,
  recipeSlugExists,
  saveRecipe,
} from "@/lib/firebase/data";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { useAuth } from "@/components/auth/AuthProvider";
import { categoryLabel, RECIPE_CATEGORIES } from "@/lib/category";
import slugify from "@/lib/slug";
import Icon from "@/components/ui/Icon";
import Alert, { LoadingBlock } from "@/components/ui/Alert";
import RequireAuth from "@/components/auth/RequireAuth";

const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;

/** Lấy video ID từ các dạng link YouTube phổ biến (watch, youtu.be, embed, shorts, live). */
function extractYouTubeId(rawUrl: string): string | null {
  const value = rawUrl.trim();
  if (!value) return null;
  try {
    const url = new URL(
      /^https?:\/\//i.test(value) ? value : `https://${value}`,
    );
    const host = url.hostname.replace(/^(www|m|music)\./, "");
    let id: string | null = null;
    if (host === "youtu.be") {
      id = url.pathname.split("/")[1] ?? null;
    } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else {
        const [, kind, videoId] = url.pathname.split("/");
        if (["embed", "shorts", "live", "v"].includes(kind))
          id = videoId ?? null;
      }
    }
    return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Ưu tiên ảnh chất lượng cao nhất (maxres); nếu video không có thì dùng hqdefault. */
function resolveYouTubeThumbnail(videoId: string): Promise<string> {
  const base = `https://i.ytimg.com/vi/${videoId}`;
  const fallback = `${base}/hqdefault.jpg`;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () =>
      // YouTube trả ảnh placeholder 120x90 khi không có maxres
      resolve(img.naturalWidth > 120 ? `${base}/maxresdefault.jpg` : fallback);
    img.onerror = () => resolve(fallback);
    img.src = `${base}/maxresdefault.jpg`;
  });
}

function EditorForm({
  mode,
  slug,
}: {
  mode: "create" | "edit";
  slug?: string;
}) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [initialLoading, setInitialLoading] = useState(mode === "edit");
  const [recipeId, setRecipeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [category, setCategory] = useState("Dinner");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAuto, setImageAuto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !slug) return;
    void fetchRecipeBySlug(slug)
      .then((recipe) => {
        if (!recipe) {
          setError("Không tìm thấy công thức để chỉnh sửa.");
          return;
        }
        setRecipeId(recipe.id);
        setTitle(recipe.title);
        setDescription(recipe.description);
        setIngredients(recipe.ingredients.join("\n"));
        setSteps(recipe.steps.join("\n"));
        setCategory(recipe.category);
        setYoutubeUrl(recipe.youtubeUrl ?? "");
        setImageUrl(recipe.imageUrl ?? "");
      })
      .catch(() => setError("Không thể tải công thức."))
      .finally(() => setInitialLoading(false));
  }, [mode, slug]);

  // Tự lấy ảnh bìa từ video YouTube khi chưa có ảnh do người dùng chọn/dán.
  useEffect(() => {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) return;
    if (imageFile) return;
    if (imageUrl.trim() && !imageAuto) return;
    let cancelled = false;
    void resolveYouTubeThumbnail(videoId).then((thumbnail) => {
      if (cancelled) return;
      setImageUrl(thumbnail);
      setImageAuto(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeUrl, imageFile]);

  const generatedSlug = useMemo(() => slugify(title), [title]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const finalSlug = await (async () => {
        const base = generatedSlug || `mon-${Date.now()}`;
        if (!(await recipeSlugExists(base, recipeId || undefined))) return base;
        let index = 2;
        while (
          await recipeSlugExists(`${base}-${index}`, recipeId || undefined)
        )
          index += 1;
        return `${base}-${index}`;
      })();

      let finalImage = imageUrl.trim();
      if (imageFile) finalImage = await uploadImageToCloudinary(imageFile);
      const payload: Partial<Recipe> = {
        title: title.trim(),
        description: description.trim(),
        category,
        ingredients: ingredients
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
        steps: steps
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
        youtubeUrl: youtubeUrl.trim(),
        imageUrl: finalImage,
        slug: finalSlug,
      };
      if (mode === "create") payload.userId = currentUser.uid;

      if (mode === "edit") {
        await saveRecipe(recipeId, payload);
      } else {
        await createRecipe(payload as Omit<Recipe, "id">);
      }
      setSuccess(
        mode === "edit" ? "Đã cập nhật công thức." : "Đã thêm công thức mới.",
      );
      window.setTimeout(() => router.push(`/cong-thuc/${finalSlug}`), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu công thức.");
    } finally {
      setBusy(false);
    }
  }

  if (initialLoading) return <LoadingBlock label="Đang mở công thức..." />;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7 flex flex-col gap-2">
        <span className="eyebrow">
          <Icon name={mode === "edit" ? "edit" : "plus"} size={15} /> Sổ tay bếp
        </span>
        <h1 className="section-title">
          {mode === "edit" ? "Chỉnh sửa công thức" : "Thêm công thức"}
        </h1>
        <p className="text-sm leading-6 text-muted">
          Ghi lại món ngon theo cách dễ đọc, dễ nấu và dễ truyền lại cho người
          thân.
        </p>
      </div>
      <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-8">
        {error && (
          <div className="mb-5">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}
        {success && (
          <div className="mb-5">
            <Alert tone="success">{success}</Alert>
          </div>
        )}
        <form onSubmit={submit} className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="form-label">
                <Icon name="bowl" size={15} /> Tên món / tiêu đề
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                required
                placeholder="Ví dụ: Phở bò gia truyền"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="form-label">
                <Icon name="book" size={15} /> Mô tả
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input min-h-28"
                required
                placeholder="Một vài câu giới thiệu về món ăn, dịp thường nấu hoặc hương vị đặc trưng..."
              />
            </label>
            <label className="block">
              <span className="form-label">
                <Icon name="tag" size={15} /> Danh mục
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-input"
              >
                {RECIPE_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {categoryLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="form-label">
                <Icon name="youtube" size={15} /> Video YouTube (tuỳ chọn)
              </span>
              <input
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  if (imageAuto) {
                    setImageUrl("");
                    setImageAuto(false);
                  }
                }}
                className="form-input"
                placeholder="https://www.youtube.com/..."
              />
            </label>
            <label className="block md:col-span-2">
              <span className="form-label">
                <Icon name="list" size={15} /> Nguyên liệu{" "}
                <span className="font-normal text-muted">
                  (mỗi dòng một nguyên liệu)
                </span>
              </span>
              <textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                className="form-input min-h-40"
                required
                placeholder={"500g thịt bò\n1kg xương ống\n..."}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="form-label">
                <Icon name="route" size={15} /> Cách làm{" "}
                <span className="font-normal text-muted">
                  (mỗi dòng một bước)
                </span>
              </span>
              <textarea
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                className="form-input min-h-44"
                required
                placeholder={
                  "Sơ chế nguyên liệu...\nNinh nước dùng...\nTrình bày và thưởng thức..."
                }
              />
            </label>
            <div className="block md:col-span-2">
              <span className="form-label">
                <Icon name="image" size={15} /> Ảnh món ăn
              </span>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setImageFile(e.target.files?.[0] ?? null);
                    setImageAuto(false);
                  }}
                  className="file-input"
                />
                <input
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageAuto(false);
                  }}
                  className="form-input"
                  placeholder="Hoặc dán URL ảnh (https://...)"
                />
              </div>
              {!imageFile && imageUrl.trim() && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Xem trước ảnh món ăn"
                    className="aspect-video w-full object-cover"
                  />
                </div>
              )}
              <span className="mt-2 block text-xs text-muted">
                {imageAuto
                  ? "Đang dùng ảnh bìa của video YouTube. Chọn ảnh khác hoặc dán URL để thay thế."
                  : "Ảnh mới sẽ được tải lên Cloudinary bằng unsigned upload preset; URL sẽ được giữ nguyên khi bạn dán ảnh có sẵn. Nếu để trống và có link YouTube, ảnh bìa video sẽ được dùng tự động."}
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-cream/70 p-4 text-sm text-muted">
            <strong className="text-ink">Đường dẫn dự kiến:</strong> /cong-thuc/
            {generatedSlug || "ten-mon"}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link href="/" className="btn-secondary justify-center">
              Huỷ
            </Link>
            <button disabled={busy} className="btn-primary justify-center">
              {busy ? (
                <span className="size-4 animate-spin rounded-full border-2 border-ivory/30 border-t-ivory" />
              ) : (
                <Icon name="check" size={17} />
              )}{" "}
              {mode === "edit" ? "Lưu thay đổi" : "Đăng công thức"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddRecipePage() {
  return (
    <RequireAuth>
      <EditorForm mode="create" />
    </RequireAuth>
  );
}

export function EditRecipePage() {
  const params = useParams<{ slug: string }>();
  return (
    <RequireAuth adminOnly>
      <EditorForm mode="edit" slug={params.slug} />
    </RequireAuth>
  );
}
