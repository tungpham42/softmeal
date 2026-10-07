export const RECIPE_CATEGORIES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Dessert",
  "Vegan",
  "Wellness",
] as const;
export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export type SortOption =
  | "alphabetAsc"
  | "alphabetDesc"
  | "dateAsc"
  | "dateDesc";

export type RecipeNutrition = {
  calories?: string;
  proteinContent?: string;
  carbohydrateContent?: string;
  fatContent?: string;
  calciumContent?: string;
  fiberContent?: string;
  sugarContent?: string;
  sodiumContent?: string;
  cholesterolContent?: string;
  potassiumContent?: string;
  ironContent?: string;
  zincContent?: string;
};

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string;
  ingredients: string[];
  steps: string[];
  category: RecipeCategory;
  imageUrl?: string;
  youtubeUrl?: string;
  nutrition?: RecipeNutrition;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  text: string;
  userId?: string;
  username?: string;
  createdAt?: string;
}

export interface UserProfileData {
  uid: string;
  email?: string | null;
  username?: string | null;
  displayName?: string | null;
  isAdmin?: boolean;
  authProvider?: string;
}
