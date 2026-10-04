import type { Metadata } from "next";
import { AddRecipePage } from "@/components/recipes/RecipeEditor";
export const metadata: Metadata = { title: "Thêm công thức" };
export default function AddPage() {
  return <AddRecipePage />;
}
