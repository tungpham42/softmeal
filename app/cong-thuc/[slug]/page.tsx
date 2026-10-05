import type { Metadata } from "next";
import { cache } from "react";
import RecipeDetail from "@/components/recipes/RecipeDetail";
import { categoryLabel } from "@/lib/category";
import type { Recipe } from "@/lib/types";
import { fetchRecipeBySlugServer } from "@/lib/firebase/server";

const SITE_NAME = "Bếp nhà Tùng";
const RECIPE_PATH = "/cong-thuc";

const getRecipeBySlug = cache((slug: string) => fetchRecipeBySlugServer(slug));

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

function getMetadataBase(): URL | undefined {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  return value ? new URL(value) : undefined;
}

function resolveUrl(
  value: string | undefined,
  base: URL | undefined,
): string | undefined {
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
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) {
    return {
      title: {
        absolute: `Không tìm thấy công thức | ${SITE_NAME}`,
      },
      description:
        "Công thức món ăn không tồn tại hoặc đã được gỡ khỏi Bếp nhà Tùng.",
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
  const title = `${recipe.title} | ${SITE_NAME}`;
  const description = truncate(
    recipe.description ||
      `Hướng dẫn nấu ${recipe.title}${category ? `, thuộc nhóm ${category}` : ""}, cùng nguyên liệu và các bước thực hiện chi tiết.`,
    160,
  );

  return {
    ...(metadataBase ? { metadataBase } : {}),
    title: { absolute: title },
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

function RecipeJsonLd({ recipe }: { recipe: Recipe }) {
  const metadataBase = getMetadataBase();
  const imageUrl = resolveUrl(recipe.imageUrl, metadataBase);
  const canonical = resolveUrl(getRecipeUrl(recipe.slug), metadataBase);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: cleanText(recipe.title),
    description: cleanText(recipe.description),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    recipeCategory: categoryLabel(recipe.category),
    recipeIngredient: recipe.ingredients.map(cleanText).filter(Boolean),
    recipeInstructions: recipe.steps
      .map(cleanText)
      .filter(Boolean)
      .map((text) => ({
        "@type": "HowToStep",
        text,
      })),
    ...(canonical
      ? {
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": canonical,
          },
        }
      : {}),
    ...(recipe.youtubeUrl
      ? {
          video: {
            "@type": "VideoObject",
            name: cleanText(recipe.title),
            description: cleanText(recipe.description),
            embedUrl: recipe.youtubeUrl,
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
  const recipe = await getRecipeBySlug(slug);

  return (
    <>
      {recipe ? <RecipeJsonLd recipe={recipe} /> : null}
      <RecipeDetail />
    </>
  );
}
