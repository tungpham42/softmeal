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
import ThemedSelect from "@/components/ui/ThemedSelect";
import RequireAuth from "@/components/auth/RequireAuth";
import { extractYouTubeId, resolveYouTubeThumbnail } from "@/lib/youtube";
import {
  EMPTY_NUTRITION_FORM,
  NUTRITION_FIELDS,
  formToNutrition,
  nutritionToForm,
  type NutritionForm,
} from "@/lib/nutrition";

type GeneratedRecipe = Pick<
  Recipe,
  "title" | "description" | "category" | "ingredients" | "steps"
> & {
  nutrition?: NonNullable<Recipe["nutrition"]>;
};

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
  const [category, setCategory] = useState<Recipe["category"]>("Dinner");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [transcriptInput, setTranscriptInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAuto, setImageAuto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [nutrition, setNutrition] =
    useState<NutritionForm>(EMPTY_NUTRITION_FORM);

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
        setNutrition(nutritionToForm(recipe.nutrition));
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

  async function generateFromYouTube() {
    if (!currentUser) {
      setError("Vui lòng đăng nhập trước khi tạo công thức bằng AI.");
      return;
    }
    if (!extractYouTubeId(youtubeUrl)) {
      setError(
        "Hãy nhập đường dẫn video YouTube hợp lệ trước khi tạo nội dung.",
      );
      return;
    }

    const hasExistingContent = Boolean(
      title.trim() || description.trim() || ingredients.trim() || steps.trim(),
    );
    if (
      hasExistingContent &&
      !window.confirm(
        "AI sẽ thay thế tiêu đề, mô tả, nguyên liệu, cách làm, danh mục và dinh dưỡng hiện tại. Bạn muốn tiếp tục?",
      )
    ) {
      return;
    }

    setAiBusy(true);
    setError("");
    setSuccess("");
    setAiMessage("");
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/ai/generate-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          youtubeUrl: youtubeUrl.trim(),
          transcript: transcriptInput.trim(),
        }),
      });
      const result = (await response.json()) as {
        recipe?: GeneratedRecipe;
        error?: string;
        source?: {
          videoTitle?: string;
          channel?: string;
          transcriptLanguage?: string;
        };
      };
      if (!response.ok) {
        throw new Error(result.error || "Không thể tạo nội dung từ video này.");
      }
      const recipe = result.recipe;
      if (
        !recipe ||
        !recipe.title ||
        !recipe.description ||
        !Array.isArray(recipe.ingredients) ||
        !Array.isArray(recipe.steps)
      ) {
        throw new Error("AI trả về bản nháp chưa đầy đủ. Vui lòng thử lại.");
      }

      setTitle(recipe.title);
      setDescription(recipe.description);
      setCategory(recipe.category);
      setIngredients(recipe.ingredients.join("\n"));
      setSteps(recipe.steps.join("\n"));
      setNutrition(nutritionToForm(recipe.nutrition));
      setAiMessage(
        `Đã tạo bản nháp${result.source?.videoTitle ? ` từ video “${result.source.videoTitle}”` : " từ video YouTube"}. Hãy kiểm tra định lượng, cách làm và các ước tính dinh dưỡng trước khi lưu.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tạo công thức bằng AI.",
      );
    } finally {
      setAiBusy(false);
    }
  }

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
        nutrition: formToNutrition(nutrition),
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
          thân. Bạn cũng có thể tạo bản nháp từ video YouTube bằng AI.
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
              <ThemedSelect
                name="category"
                ariaLabel="Danh mục"
                value={category}
                onChange={(value) => setCategory(value as Recipe["category"])}
                options={[
                  ...RECIPE_CATEGORIES.map((item) => ({
                    value: item,
                    label: categoryLabel(item),
                  })),
                ]}
                placeholder="Chọn danh mục"
              />
            </label>
            <div className="block">
              <label htmlFor="recipe-youtube-url" className="form-label">
                <Icon name="youtube" size={15} /> Video YouTube
              </label>
              <input
                id="recipe-youtube-url"
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  setAiMessage("");
                  if (imageAuto) {
                    setImageUrl("");
                    setImageAuto(false);
                  }
                }}
                className="form-input"
                placeholder="https://www.youtube.com/..."
              />
              <p className="mt-2 text-xs leading-5 text-muted">
                AI đọc phụ đề video để soạn tiêu đề, mô tả, nguyên liệu, cách
                làm và dinh dưỡng.
              </p>
            </div>
            <div className="md:col-span-2 rounded-2xl border border-border bg-cream/40 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-ink">
                    Tạo nội dung bằng AI
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Dùng AI tạo bản nháp để bạn xem lại; công thức chưa được lưu
                    cho đến khi bấm nút đăng.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void generateFromYouTube()}
                  disabled={aiBusy || busy || !youtubeUrl.trim()}
                  className="btn-primary shrink-0 justify-center disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {aiBusy ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-ivory/30 border-t-ivory" />
                  ) : (
                    <Icon name="refresh" size={17} />
                  )}{" "}
                  {aiBusy ? "Đang tạo bản nháp..." : "Tạo công thức bằng AI"}
                </button>
              </div>
              <label className="mt-4 block">
                <span className="mb-1 block text-sm font-medium text-ink">
                  Lời thoại / phụ đề video (không bắt buộc)
                </span>
                <textarea
                  value={transcriptInput}
                  onChange={(e) => setTranscriptInput(e.target.value)}
                  className="form-input min-h-24"
                  maxLength={60000}
                  placeholder="Để trống để AI tự lấy phụ đề YouTube. Nếu video không có phụ đề hoặc máy chủ không đọc được, hãy dán lời thoại/mô tả vào đây."
                />
                <span className="mt-1 block text-xs text-muted">
                  {transcriptInput.length.toLocaleString("vi-VN")} / 60.000 ký
                  tự
                </span>
              </label>
              {aiMessage && (
                <p
                  className="mt-3 text-sm leading-6 text-green-800"
                  role="status"
                >
                  {aiMessage}
                </p>
              )}
            </div>
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
            <fieldset className="md:col-span-2">
              <legend className="form-label">
                <Icon name="list" size={15} /> Giá trị dinh dưỡng{" "}
                <span className="font-normal text-muted">
                  (tuỳ chọn, tính cho mỗi khẩu phần)
                </span>
              </legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {NUTRITION_FIELDS.map((field) => (
                  <label key={field.key} className="block">
                    <span className="mb-1 block text-xs text-muted">
                      {field.label} ({field.unit})
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={nutrition[field.key]}
                      onChange={(e) =>
                        setNutrition((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="form-input"
                      placeholder="0"
                    />
                  </label>
                ))}
              </div>
            </fieldset>
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
            <button
              disabled={busy || aiBusy}
              className="btn-primary justify-center"
            >
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
