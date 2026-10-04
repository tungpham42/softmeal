import type { Metadata } from "next";
import RecipeDetail from "@/components/recipes/RecipeDetail";
export const metadata: Metadata = {
  title: "Công thức",
  description: "Chi tiết công thức món ăn Việt.",
};
export default function RecipePage() {
  return <RecipeDetail />;
}
