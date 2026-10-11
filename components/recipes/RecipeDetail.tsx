"use client";

import type { FormEvent } from "react";
import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Comment } from "@/lib/types";
import { addRecipeComment } from "@/lib/firebase/data";
import type { RecipePageData } from "@/lib/firebase/server";
import { useAuth } from "@/components/auth/AuthProvider";
import Icon from "@/components/ui/Icon";
import Alert from "@/components/ui/Alert";
import { categoryAccent, categoryLabel } from "@/lib/category";
import { youtubeEmbedUrl } from "@/lib/youtube";
import RecipeImage from "@/components/recipe/RecipeImage";
import { nutritionRows } from "@/lib/nutrition";
import { isMobileOrTablet } from "@/lib/device";
import { SITE_NAME } from "@/lib/seo";

function subscribeToLocation() {
  return () => {};
}

const RECENT_COMMENT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Online retailers.
 *
 * Product searches use Google site-restricted search so this implementation
 * does not require paid APIs, API keys, or changes to the Recipe data model.
 */
const SHOPPING_PLACES = [
  {
    name: "Bách hóa XANH",
    domain: "bachhoaxanh.com",
    website: "https://www.bachhoaxanh.com/",
  },
  {
    name: "LOTTE Mart",
    domain: "lottemart.vn",
    website: "https://www.lottemart.vn/",
  },
  {
    name: "Co.op Online",
    domain: "cooponline.vn",
    website: "https://cooponline.vn/",
  },
  {
    name: "Kingfoodmart",
    domain: "kingfoodmart.com",
    website: "https://kingfoodmart.com/",
  },
  {
    name: "WinMart",
    domain: "winmart.vn",
    website: "https://winmart.vn/",
  },
  {
    name: "Ba Sạch",
    domain: "3sach.vn",
    website: "https://3sach.vn/",
  },
] as const;

/**
 * Measurement units commonly found in Vietnamese recipe ingredients.
 * Longer multi-word units come first so "muỗng canh" is removed as a whole.
 */
const INGREDIENT_UNIT_PATTERN = String.raw`(?:muỗng\s+cà\s+phê|muỗng\s+canh|muỗng\s+cafe|thìa\s+cà\s+phê|thìa\s+canh|tablespoons?|teaspoons?|tbsp|tsp|kilograms?|kilogrammes?|kg|grams?|grammes?|gam|gr|g|milligrams?|mg|millilit(?:er|re)s?|ml|lit(?:er|re)s?|lít|litre|liter|cc|ounces?|oz|pounds?|lbs?|cốc|chén|bát|ly|quả|trái|củ|cây|nhánh|tép|lát|miếng|bó|gói|bịch|hộp|chai|túi|lon|con|cái|viên|ổ|tờ|nắm|nhúm|ít|phần|chiếc|cups?)`;

/** Integer, decimal, range, fraction, mixed fraction, or common fraction glyph. */
const INGREDIENT_QUANTITY_PATTERN = String.raw`(?:\d+\s+\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?(?:\s*(?:-|–|—|đến)\s*\d+(?:[.,]\d+)?)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?|[¼½¾⅓⅔⅛⅜⅝⅞])`;

/**
 * Remove recipe quantities and measurement units from an ingredient name,
 * while keeping the ingredient keywords used for retailer and Maps searches.
 * Examples:
 *   "Bột mì 250g"          -> "Bột mì"
 *   "250 g bột mì"         -> "bột mì"
 *   "2 quả trứng gà"       -> "trứng gà"
 *   "1/2 muỗng cà phê muối" -> "muối"
 */
function getIngredientKeyword(ingredient: string): string {
  const unit = `${INGREDIENT_UNIT_PATTERN}(?=$|\\s|[,;:.)])`;
  const quantity = INGREDIENT_QUANTITY_PATTERN;
  let keyword = ingredient.normalize("NFC").trim();

  // Remove parenthetical quantity notes such as "(250g)" or "(2 quả)".
  const parentheticalQuantity = new RegExp(
    String.raw`\([^)]*${quantity}\s*${unit}[^)]*\)`,
    "gi",
  );
  keyword = keyword.replace(parentheticalQuantity, " ");

  // Remove a quantity/unit prefix, e.g. "250 g bột mì" or "2 quả trứng".
  const prefixQuantity = new RegExp(
    String.raw`^\s*(?:(?:khoảng|tầm|chừng|about|approximately)\s*)?${quantity}\s*(?:${unit})?\s*`,
    "i",
  );
  keyword = keyword.replace(prefixQuantity, "");

  // Remove a quantity/unit suffix, e.g. "Bột mì 250g" or "Muối: 1/2 thìa cà phê".
  const suffixQuantity = new RegExp(
    String.raw`\s*(?:[:=,;\-–—]\s*)?(?:(?:khoảng|tầm|chừng|about|approximately)\s*)?${quantity}\s*${unit}\s*$`,
    "i",
  );
  keyword = keyword.replace(suffixQuantity, "");

  // Tidy punctuation left by removing quantities and measurements.
  keyword = keyword
    .replace(/\s+([,;:])/g, "$1")
    .replace(/^[\s,;:–—-]+|[\s,;:–—-]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Avoid producing an empty search if the input is an unusual ingredient.
  return keyword || ingredient.trim();
}

/**
 * Search for only the ingredient keywords within a specific retailer's website.
 * Example: "Bột mì site:bachhoaxanh.com", not "Bột mì 250g ...".
 */
function getIngredientSearchUrl(ingredient: string, domain: string): string {
  const keyword = getIngredientKeyword(ingredient);
  const query = `${keyword} site:${domain}`;

  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Search Google Maps for nearby branches of a particular retailer.
 * Google Maps can show branch addresses and directions.
 */
function getStoreAddressUrl(storeName: string): string {
  const query = `${storeName} gần tôi`;

  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(query)
  );
}

/**
 * Search Google Maps for traditional markets near the user.
 */
function getMarketAddressUrl(ingredient?: string): string {
  const keyword = ingredient ? getIngredientKeyword(ingredient) : "";
  const query = keyword
    ? `chợ thực phẩm bán ${keyword} gần tôi`
    : "chợ thực phẩm gần tôi";

  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(query)
  );
}

function formatCommentDate(createdAt: unknown) {
  if (!createdAt) return "";

  let date: Date;

  if (createdAt instanceof Date) {
    date = createdAt;
  } else if (
    typeof createdAt === "object" &&
    createdAt !== null &&
    "toDate" in createdAt &&
    typeof createdAt.toDate === "function"
  ) {
    date = createdAt.toDate();
  } else if (
    typeof createdAt === "object" &&
    createdAt !== null &&
    "seconds" in createdAt
  ) {
    const seconds = Number(createdAt.seconds);
    const nanoseconds =
      "nanoseconds" in createdAt ? Number(createdAt.nanoseconds) : 0;

    date = new Date(seconds * 1000 + nanoseconds / 1_000_000);
  } else {
    date = new Date(createdAt as string | number);
  }

  if (Number.isNaN(date.getTime())) return "";

  const elapsedMs = Date.now() - date.getTime();

  if (elapsedMs >= 0 && elapsedMs < RECENT_COMMENT_THRESHOLD_MS) {
    const elapsedMinutes = Math.floor(elapsedMs / 60_000);

    if (elapsedMinutes < 1) {
      return "vừa xong";
    }

    if (elapsedMinutes < 60) {
      return `${elapsedMinutes} phút trước`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);

    if (elapsedHours < 24) {
      return `${elapsedHours} giờ trước`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);

    return `${elapsedDays} ngày trước`;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Accept only secure links that point to YouTube, so a recipe source cannot
 * accidentally render an unsafe or unrelated external URL.
 */
function getYouTubeSourceUrl(url?: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    const isYouTubeDomain =
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtu.be" ||
      hostname.endsWith(".youtu.be");

    if (parsed.protocol !== "https:" || !isYouTubeDomain) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
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

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  async function handleFacebookShare() {
    const shareData: ShareData = {
      title,
      text: title,
      url,
    };

    if (
      isMobileOrTablet() &&
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        if (
          typeof navigator.canShare !== "function" ||
          navigator.canShare(shareData)
        ) {
          await navigator.share(shareData);
          return;
        }
      } catch (error) {
        // User cancelled the native share sheet.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Web Share API failed:", error);
      }
    }

    // PC / Laptop or unsupported Web Share API.
    window.open(facebookShareUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="share facebook"
        onClick={handleFacebookShare}
        aria-label="Chia sẻ Facebook"
      >
        <Icon name="facebook" />
      </button>

      <a
        className="share x"
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chia sẻ X"
      >
        <Icon name="x" />
      </a>

      <a
        className="share pinterest"
        href={`https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chia sẻ Pinterest"
      >
        <Icon name="pinterest" />
      </a>

      <a
        className="share linkedin"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chia sẻ LinkedIn"
      >
        <Icon name="linkedin" />
      </a>
    </div>
  );
}

/**
 * Shopping, with the fewest possible steps:
 *  - pick a retailer ONCE for the whole recipe,
 *  - every ingredient then has a single direct link to that retailer,
 *  - one button copies the whole shopping list.
 * (Previously: open a modal per ingredient -> pick a retailer -> open a
 * Google search in a new tab.)
 */
function ShoppingPanel({ ingredients }: { ingredients: string[] }) {
  const [placeIndex, setPlaceIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const place = SHOPPING_PLACES[placeIndex];

  const keywords = useMemo(
    () => ingredients.map((item) => getIngredientKeyword(item)),
    [ingredients],
  );

  async function copyList() {
    try {
      await navigator.clipboard.writeText(
        ingredients.map((item) => `- ${item}`).join("\n"),
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context / denied): ignore silently.
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted">Mua tại:</span>

        {SHOPPING_PLACES.map((item, index) => (
          <button
            key={item.name}
            type="button"
            aria-pressed={index === placeIndex}
            onClick={() => setPlaceIndex(index)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lacquer ${
              index === placeIndex
                ? "border-lacquer bg-lacquer text-white"
                : "border-border bg-cream/60 text-ink hover:bg-cream"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
        <a
          href={getStoreAddressUrl(place.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-bamboo underline underline-offset-4"
        >
          <Icon name="map-pin" size={13} />
          Cửa hàng {place.name} gần bạn
        </a>

        <a
          href={getMarketAddressUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-bamboo underline underline-offset-4"
        >
          <Icon name="map-pin" size={13} />
          Chợ gần bạn
        </a>

        <button
          type="button"
          onClick={copyList}
          className="inline-flex items-center gap-1 text-lacquer underline underline-offset-4"
        >
          {copied ? "Đã sao chép danh sách" : "Sao chép danh sách đi chợ"}
        </button>
      </div>

      <ul className="mt-2 divide-y divide-dashed divide-border">
        {ingredients.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-center justify-between gap-3 py-2 text-sm"
          >
            <span className="text-ink">{item}</span>

            <a
              href={getIngredientSearchUrl(keywords[index], place.domain)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Tìm ${keywords[index]} tại ${place.name}`}
              className="shrink-0 rounded-lg border border-border bg-cream/50 px-2.5 py-1 text-xs font-bold text-lacquer transition hover:bg-cream"
            >
              Xem giá
            </a>
          </li>
        ))}
      </ul>

      <p className="pt-2 text-xs leading-5 text-muted">
        Giá bán, tồn kho và địa chỉ thực tế cần được xác nhận trên website hoặc
        bản đồ.
      </p>
    </div>
  );
}

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

  const [comments, setComments] = useState<Comment[]>(
    initialData?.comments ?? [],
  );
  const [commentText, setCommentText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [relatedPage, setRelatedPage] = useState(1);
  const [error, setError] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  const [doneIngredients, setDoneIngredients] = useState<Set<number>>(
    () => new Set(),
  );

  const [doneSteps, setDoneSteps] = useState<Set<number>>(() => new Set());

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

  async function submitComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!recipe || !commentText.trim()) {
      return;
    }

    setCommentBusy(true);

    try {
      const text = commentText.trim();

      const username = currentUser
        ? currentUser.displayName || "Người dùng ẩn danh"
        : guestName.trim() || "Khách";

      // Guests have no account: userId is null and they pick their own name.
      const saved = await addRecipeComment(recipe.id, {
        text,
        userId: currentUser?.uid,
        username,
      });

      // Append locally instead of re-downloading the whole comment list.
      setComments((prev) => [
        {
          id: saved.id,
          text,
          userId: currentUser?.uid,
          username,
          createdAt: saved.createdAt,
        },
        ...prev,
      ]);
      setCommentText("");
    } catch (err) {
      console.error("Comment error:", err);
      setError("Không thể đăng bình luận.");
    } finally {
      setCommentBusy(false);
    }
  }

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

              <div className="mt-5 rounded-2xl bg-cream/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Icon name="user" size={16} className="text-lacquer" />
                  Tác giả: {author}
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

              {/* Comments */}
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
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-2xl border border-border bg-cream/40 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-sm text-ink">
                            {comment.username || "Người dùng"}
                          </strong>

                          <span
                            className="text-xs text-muted"
                            title={formatCommentDate(comment.createdAt)}
                          >
                            {formatCommentDate(comment.createdAt)}
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
                  {error && (
                    <div className="mb-3">
                      <Alert tone="warning">{error}</Alert>
                    </div>
                  )}

                  <form onSubmit={submitComment}>
                    {!currentUser && (
                      <input
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="form-input mb-3"
                        maxLength={40}
                        placeholder="Tên của bạn (không bắt buộc)"
                        aria-label="Tên của bạn"
                      />
                    )}

                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
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
