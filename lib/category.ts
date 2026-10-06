import { RECIPE_CATEGORIES } from "@/lib/types";
import type { RecipeCategory } from "@/lib/types";

export { RECIPE_CATEGORIES };

const labels: Record<string, string> = {
  Breakfast: "Bữa sáng",
  Lunch: "Bữa trưa",
  Dinner: "Bữa tối",
  Dessert: "Tráng miệng",
  Vegan: "Món chay",
  Wellness: "Món dưỡng sinh",
};

export function categoryLabel(category?: string) {
  return category ? (labels[category] ?? category) : "Ẩm thực Việt";
}

export function isRecipeCategory(value?: string): value is RecipeCategory {
  return !!value && (RECIPE_CATEGORIES as readonly string[]).includes(value);
}

export const categoryAccent: Record<string, string> = {
  Breakfast: "bg-turmeric-700 text-white border-white/70",
  Lunch: "bg-gold text-lacquer border-white/70",
  Dinner: "bg-lacquer text-white border-white/70",
  Vegan: "bg-bamboo text-white border-white/70",
  Dessert: "bg-plum text-white border-white/70",
  Wellness: "bg-bamboo text-white border-white/70",
};
