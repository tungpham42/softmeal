import type { Recipe } from "@/lib/types";

/**
 * Used when a recipe has no stored yield. Nutrition values on the site are
 * already expressed "per serving", so one serving is a consistent baseline.
 */
export const DEFAULT_RECIPE_YIELD = "1 khẩu phần";

/** Accept strings or numbers from Firestore / the editor, drop everything else. */
export function normalizeRecipeYield(value: unknown): string | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? String(value) : undefined;
  }

  if (typeof value === "string") {
    const text = value.replace(/\s+/g, " ").trim();
    return text || undefined;
  }

  return undefined;
}

/** Human readable yield, e.g. "4" -> "4 khẩu phần", "4 người ăn" stays as is. */
export function formatRecipeYield(recipe: Pick<Recipe, "recipeYield">): string {
  const value = normalizeRecipeYield(recipe.recipeYield);

  if (!value) return DEFAULT_RECIPE_YIELD;

  return /^\d+(?:[.,]\d+)?$/.test(value) ? `${value} khẩu phần` : value;
}

/**
 * schema.org `recipeYield` value. Google recommends giving both the plain
 * number and the descriptive text, so we emit both when a number is present.
 * Always returns a value, which is what fixes the "Missing field recipeYield"
 * warning in the Rich Results test.
 */
export function getRecipeYieldSchema(
  recipe: Pick<Recipe, "recipeYield">,
): string | string[] {
  const text = formatRecipeYield(recipe);
  const amount = text.match(/\d+(?:[.,]\d+)?/)?.[0]?.replace(",", ".");

  return amount && amount !== text ? [amount, text] : text;
}
