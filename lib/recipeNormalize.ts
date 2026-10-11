import type { Comment, Recipe } from "@/lib/types";
import { NUTRITION_FIELDS } from "@/lib/nutrition";
import { normalizeRecipeYield } from "@/lib/recipeYield";

/**
 * Pure (no "use client", no Firebase SDK) normalizers shared by the browser
 * data layer and the server data layer, so both return the same plain,
 * serializable shapes (Timestamps become ISO strings).
 */

export function normalizeDate(value: unknown) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

function normalizeCategory(value: unknown): Recipe["category"] {
  const categories: Recipe["category"][] = [
    "Breakfast",
    "Lunch",
    "Dinner",
    "Dessert",
    "Vegan",
    "Wellness",
  ];
  return categories.find((category) => category === value) ?? "Breakfast";
}

function normalizeNutrition(value: unknown): Recipe["nutrition"] {
  if (!value || typeof value !== "object") return undefined;

  const source = value as Record<string, unknown>;
  const result: NonNullable<Recipe["nutrition"]> = {};

  for (const { key } of NUTRITION_FIELDS) {
    const raw = source[key];
    if (typeof raw === "string" && raw.trim()) {
      result[key] = raw.trim();
    } else if (typeof raw === "number" && Number.isFinite(raw)) {
      result[key] = String(raw);
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function normalizeRecipe(
  id: string,
  data: Record<string, unknown>,
): Recipe {
  return {
    id,
    title: String(data.title ?? "Untitled recipe"),
    slug: String(data.slug ?? id),
    description: String(data.description ?? ""),
    ingredients: Array.isArray(data.ingredients)
      ? data.ingredients.map(String)
      : [],
    steps: Array.isArray(data.steps) ? data.steps.map(String) : [],
    category: normalizeCategory(data.category),
    imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
    youtubeUrl: data.youtubeUrl ? String(data.youtubeUrl) : undefined,
    nutrition: normalizeNutrition(data.nutrition),
    recipeYield: normalizeRecipeYield(data.recipeYield ?? data.servings),
    userId: data.userId ? String(data.userId) : undefined,
    createdAt: normalizeDate(data.createdAt as Recipe["createdAt"]),
    updatedAt: normalizeDate(data.updatedAt as Recipe["updatedAt"]),
  };
}

export function normalizeComment(
  id: string,
  data: Record<string, unknown>,
): Comment {
  return {
    id,
    text: String(data.text ?? ""),
    userId: data.userId ? String(data.userId) : undefined,
    username: data.username ? String(data.username) : undefined,
    createdAt: normalizeDate(data.createdAt as Comment["createdAt"]),
  };
}

export function sortCommentsNewestFirst(comments: Comment[]): Comment[] {
  return comments.sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime(),
  );
}
