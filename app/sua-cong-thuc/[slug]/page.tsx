import type { Metadata } from "next";
import { cache } from "react";
import { EditRecipePage } from "@/components/recipes/RecipeEditor";
import { fetchRecipeBySlugServer } from "@/lib/firebase/server";
import { categoryLabel } from "@/lib/category";
import type { Recipe } from "@/lib/types";

const SITE_NAME = "Bếp Việt";
const RECIPE_PATH = "/cong-thuc";

const getRecipeBySlug = cache((slug: string) => fetchRecipeBySlugServer(slug));

type EditRecipePageProps = {
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
    return value;
  }
}

function buildKeywords(recipe: Recipe): string[] {
  const category = categoryLabel(recipe.category);

  return unique([
    recipe.title,
    "chỉnh sửa công thức",
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
}: EditRecipePageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  const noIndexRobots: Metadata["robots"] = {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true,
    },
  };

  if (!recipe) {
    return {
      title: {
        absolute: `Chỉnh sửa công thức | ${SITE_NAME}`,
      },
      description:
        "Trang chỉnh sửa công thức trong Bếp Việt. Công thức không tồn tại hoặc đã được gỡ bỏ.",
      applicationName: SITE_NAME,
      robots: noIndexRobots,
    };
  }

  const metadataBase = getMetadataBase();
  const canonical = getRecipeUrl(recipe.slug);
  const imageUrl = resolveUrl(recipe.imageUrl, metadataBase);
  const category = categoryLabel(recipe.category);
  const title = `Chỉnh sửa "${recipe.title}" | ${SITE_NAME}`;
  const description = truncate(
    `Chỉnh sửa và cập nhật công thức "${recipe.title}"${
      category ? `, thuộc nhóm ${category}` : ""
    } trên ${SITE_NAME}.`,
    160,
  );
  const keywords = buildKeywords(recipe);

  const openGraphImages = imageUrl
    ? [
        {
          url: imageUrl,
          alt: `${recipe.title} - ${SITE_NAME}`,
        },
      ]
    : undefined;

  return {
    ...(metadataBase ? { metadataBase } : {}),
    title: {
      absolute: title,
    },
    description,
    keywords,
    applicationName: SITE_NAME,
    category: category || "Công thức món ăn",
    alternates: {
      canonical,
    },
    robots: noIndexRobots,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      locale: "vi_VN",
      type: "website",
      ...(openGraphImages ? { images: openGraphImages } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default function EditRecipeRoute() {
  return <EditRecipePage />;
}
