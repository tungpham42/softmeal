export { RECIPE_CATEGORIES } from "@/lib/types";
const labels: Record<string, string> = {
  Breakfast: "Bữa sáng",
  Lunch: "Bữa trưa",
  Dinner: "Bữa tối",
  Vegan: "Món chay",
  Dessert: "Tráng miệng",
};

export function categoryLabel(category?: string) {
  return category ? (labels[category] ?? category) : "Ẩm thực Việt";
}

export const categoryAccent: Record<string, string> = {
  Breakfast: "bg-turmeric/15 text-turmeric-700 border-turmeric/30",
  Lunch: "bg-bamboo/10 text-bamboo border-bamboo/20",
  Dinner: "bg-lacquer/10 text-lacquer border-lacquer/20",
  Vegan: "bg-bamboo/10 text-bamboo border-bamboo/20",
  Dessert: "bg-plum/10 text-plum border-plum/20",
};
