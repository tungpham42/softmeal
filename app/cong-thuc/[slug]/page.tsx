import type { Metadata } from "next";
import { cache } from "react";
import RecipeDetail from "@/components/recipes/RecipeDetail";
import { categoryLabel } from "@/lib/category";
import { getRecipeYieldSchema } from "@/lib/recipeYield";
import type { Recipe } from "@/lib/types";
import { fetchRecipePageServer } from "@/lib/firebase/server";
import { SITE_NAME, SITE_URL, RECIPE_PATH } from "@/lib/seo";

// One cached server fetch shared by generateMetadata, JSON-LD and the UI.
const getRecipePage = cache((slug: string) => fetchRecipePageServer(slug));

type RecipePageProps = {
  params: Promise<{ slug: string }>;
};

function cleanText(value: string | undefined | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number): string {
  const text = cleanText(value);

  if (text.length <= maxLength) {
    return text;
  }

  const shortened = text
    .slice(0, maxLength - 1)
    .replace(/\s+\S*$/, "")
    .trim();

  return `${shortened}…`;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map(cleanText).filter(Boolean))];
}

function getRecipeUrl(slug: string): string {
  return `${RECIPE_PATH}/${encodeURIComponent(slug)}`;
}

function getMetadataBase(): URL {
  const value =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") || SITE_URL;

  return new URL(value);
}

function resolveUrl(value: string | undefined, base: URL): string | undefined {
  if (!value) return undefined;

  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
}

function buildKeywords(recipe: Recipe): string[] {
  const category = categoryLabel(recipe.category);

  return unique([
    recipe.title,
    "công thức",
    "công thức món ăn",
    "nấu ăn",
    "món ngon",
    category,
    category ? `công thức ${category}` : "",
    ...recipe.ingredients.slice(0, 8),
  ]).slice(0, 15);
}

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = (await getRecipePage(slug))?.recipe;

  if (!recipe) {
    return {
      title: "Không tìm thấy công thức",
      description: `Công thức món ăn không tồn tại hoặc đã được gỡ khỏi ${SITE_NAME}.`,
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const metadataBase = getMetadataBase();
  const canonical = getRecipeUrl(recipe.slug);
  const imageUrl = resolveUrl(recipe.imageUrl, metadataBase);
  const category = categoryLabel(recipe.category);
  const title = recipe.title;
  const description = truncate(
    recipe.description ||
      `Hướng dẫn nấu ${recipe.title}${category ? `, thuộc nhóm ${category}` : ""}, cùng nguyên liệu và các bước thực hiện chi tiết.`,
    160,
  );

  return {
    ...(metadataBase ? { metadataBase } : {}),
    title: title,
    description,
    keywords: buildKeywords(recipe),
    applicationName: SITE_NAME,
    category: category || "Công thức món ăn",
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-video-preview": -1,
        "max-snippet": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "vi_VN",
      type: "article",
      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                alt: `${recipe.title} - ${SITE_NAME}`,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

type SeoRecipe = Recipe & {
  author?: string | { name?: string; url?: string };
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
};

function getOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  const text = String(value).trim();
  return text || undefined;
}

function getIsoDate(value: unknown): string | undefined {
  if (!value) return undefined;

  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "string" || typeof value === "number") {
    date = new Date(value);
  } else if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    date = value.toDate();
  } else {
    return undefined;
  }

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function getYouTubeVideoId(value: string): string | undefined {
  try {
    const url = new URL(value);

    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1).split("/")[0] || undefined;
    }

    if (
      url.hostname === "youtube.com" ||
      url.hostname === "www.youtube.com" ||
      url.hostname === "m.youtube.com"
    ) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v") || undefined;
      }

      const embedMatch = url.pathname.match(
        /^\/(?:embed|shorts|live)\/([^/?#]+)/,
      );
      return embedMatch?.[1];
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function getVideoEmbedUrl(value: string): string {
  const videoId = getYouTubeVideoId(value);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : value;
}

function getVideoThumbnailUrl(
  youtubeUrl: string,
  imageUrl: string | undefined,
): string | undefined {
  const videoId = getYouTubeVideoId(youtubeUrl);

  if (videoId) {
    return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
  }

  return imageUrl;
}

const NON_SCHEMA_NUTRITION_KEYS = new Set([
  "calciumContent",
  "potassiumContent",
  "ironContent",
  "zincContent",
  "magnesiumContent",
]);

function getNutritionSchema(recipe: SeoRecipe) {
  const raw = recipe.nutrition;
  if (!raw || typeof raw !== "object") return undefined;

  const nutrition = Object.fromEntries(
    Object.entries(raw).filter(
      ([key, value]) =>
        !NON_SCHEMA_NUTRITION_KEYS.has(key) && getOptionalString(value),
    ),
  );

  return Object.keys(nutrition).length > 0
    ? {
        "@type": "NutritionInformation",
        ...nutrition,
      }
    : undefined;
}

function getAuthorSchema(recipe: SeoRecipe, metadataBase: URL | undefined) {
  if (recipe.author && typeof recipe.author === "object") {
    const name = getOptionalString(recipe.author.name);

    if (name) {
      const authorUrl = metadataBase
        ? resolveUrl(recipe.author.url, metadataBase)
        : undefined;

      return {
        "@type": "Person",
        name,
        ...(authorUrl ? { url: authorUrl } : {}),
      };
    }
  }

  if (typeof recipe.author === "string" && recipe.author.trim()) {
    return {
      "@type": "Person",
      name: cleanText(recipe.author),
    };
  }

  return {
    "@type": "Organization",
    name: SITE_NAME,
    ...(metadataBase ? { url: metadataBase.toString() } : {}),
  };
}

function RecipeJsonLd({ recipe }: { recipe: Recipe }) {
  const seoRecipe = recipe as SeoRecipe;
  const metadataBase = getMetadataBase();
  const imageUrl = resolveUrl(recipe.imageUrl, metadataBase);
  const canonical = resolveUrl(getRecipeUrl(recipe.slug), metadataBase);
  const author = getAuthorSchema(seoRecipe, metadataBase);
  const datePublished = getIsoDate(recipe.createdAt);
  const prepTime = getOptionalString(seoRecipe.prepTime);
  const cookTime = getOptionalString(seoRecipe.cookTime);
  const totalTime = getOptionalString(seoRecipe.totalTime);
  const recipeYield = getRecipeYieldSchema(recipe);
  const nutrition = getNutritionSchema(seoRecipe);
  const youtubeUrl = getOptionalString(recipe.youtubeUrl);

  const recipeInstructions = recipe.steps
    .map(cleanText)
    .filter(Boolean)
    .map((text, index) => ({
      "@type": "HowToStep",
      name: `Bước ${index + 1}`,
      text,
      ...(canonical ? { url: `${canonical}#recipe-step-${index + 1}` } : {}),
    }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: cleanText(recipe.title),
    description: cleanText(recipe.description),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    author,
    ...(datePublished ? { datePublished } : {}),
    ...(prepTime ? { prepTime } : {}),
    ...(cookTime ? { cookTime } : {}),
    ...(totalTime ? { totalTime } : {}),
    recipeYield,
    ...(nutrition ? { nutrition } : {}),
    recipeCategory: categoryLabel(recipe.category),
    recipeIngredient: recipe.ingredients.map(cleanText).filter(Boolean),
    recipeInstructions,
    ...(canonical
      ? {
          url: canonical,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": canonical,
          },
        }
      : {}),
    ...(youtubeUrl
      ? {
          video: {
            "@type": "VideoObject",
            name: cleanText(recipe.title),
            description: cleanText(recipe.description),
            thumbnailUrl: getVideoThumbnailUrl(youtubeUrl, imageUrl),
            ...(datePublished ? { uploadDate: datePublished } : {}),
            embedUrl: getVideoEmbedUrl(youtubeUrl),
            ...(canonical ? { url: `${canonical}#video` } : {}),
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params;
  const data = await getRecipePage(slug);

  return (
    <>
      {data ? <RecipeJsonLd recipe={data.recipe} /> : null}
      <RecipeDetail initialData={data} />
    </>
  );
}
