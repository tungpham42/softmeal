import type { MetadataRoute } from "next";
import { fetchRecipesServer } from "@/lib/firebase/server";

export const revalidate = 3600;

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function getValidDate(value?: string): Date | undefined {
  if (!value) return undefined;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/goi-y`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/huong-dan`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/gioi-thieu`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/lien-he`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/chinh-sach-bao-mat`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  let recipes: Awaited<ReturnType<typeof fetchRecipesServer>> = [];

  try {
    recipes = await fetchRecipesServer();
  } catch (error) {
    console.error("Failed to load recipes for sitemap:", error);
  }

  const recipePages: MetadataRoute.Sitemap = recipes
    .filter((recipe) => recipe.slug)
    .map((recipe) => {
      const lastModified = getValidDate(recipe.updatedAt ?? recipe.createdAt);

      return {
        url: `${siteUrl}/cong-thuc/${encodeURIComponent(recipe.slug)}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "weekly",
        priority: 0.9,
        ...(recipe.imageUrl ? { images: [recipe.imageUrl] } : {}),
      };
    });

  return [...staticPages, ...recipePages];
}
