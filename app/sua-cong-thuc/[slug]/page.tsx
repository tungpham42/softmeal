import type { Metadata } from "next";
import { EditRecipePage } from "@/components/recipes/RecipeEditor";
export const metadata: Metadata = { title: "Chỉnh sửa công thức" };
export default function EditRecipeRoute() { return <EditRecipePage />; }
