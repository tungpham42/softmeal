import type { RecipeNutrition } from "@/lib/types";

export type NutritionKey = keyof RecipeNutrition;

export const NUTRITION_FIELDS: ReadonlyArray<{
  key: NutritionKey;
  label: string;
  unit: string; // shown to the user
  schemaUnit: string; // written to structured data
}> = [
  {
    key: "calories",
    label: "Năng lượng",
    unit: "kcal",
    schemaUnit: "calories",
  },
  { key: "proteinContent", label: "Chất đạm", unit: "g", schemaUnit: "grams" },
  { key: "fatContent", label: "Chất béo", unit: "g", schemaUnit: "grams" },
  {
    key: "carbohydrateContent",
    label: "Tinh bột (carb)",
    unit: "g",
    schemaUnit: "grams",
  },
  { key: "fiberContent", label: "Chất xơ", unit: "g", schemaUnit: "grams" },
  { key: "sugarContent", label: "Đường", unit: "g", schemaUnit: "grams" },
  {
    key: "sodiumContent",
    label: "Natri",
    unit: "mg",
    schemaUnit: "milligrams",
  },
  {
    key: "calciumContent",
    label: "Canxi",
    unit: "mg",
    schemaUnit: "milligrams",
  },
  {
    key: "potassiumContent",
    label: "Kali",
    unit: "mg",
    schemaUnit: "milligrams",
  },
  {
    key: "ironContent",
    label: "Sắt",
    unit: "mg",
    schemaUnit: "milligrams",
  },
  {
    key: "zincContent",
    label: "Kẽm",
    unit: "mg",
    schemaUnit: "milligrams",
  },
  {
    key: "cholesterolContent",
    label: "Cholesterol",
    unit: "mg",
    schemaUnit: "milligrams",
  },
];

export type NutritionForm = Record<NutritionKey, string>;

export const EMPTY_NUTRITION_FORM = Object.fromEntries(
  NUTRITION_FIELDS.map((f) => [f.key, ""]),
) as NutritionForm;

/** Stored strings ("12 grams") -> plain numbers for the form inputs. */
export function nutritionToForm(nutrition?: RecipeNutrition): NutritionForm {
  const form = { ...EMPTY_NUTRITION_FORM };
  for (const field of NUTRITION_FIELDS) {
    const match = nutrition?.[field.key]?.match(/\d+(?:[.,]\d+)?/);
    form[field.key] = match ? match[0].replace(",", ".") : "";
  }
  return form;
}

/** Form numbers -> schema.org strings. Empty or invalid inputs are dropped. */
export function formToNutrition(form: NutritionForm): RecipeNutrition {
  const result: RecipeNutrition = {};
  for (const field of NUTRITION_FIELDS) {
    const value = Number.parseFloat(form[field.key].replace(",", "."));
    if (Number.isFinite(value) && value >= 0) {
      result[field.key] = `${value} ${field.schemaUnit}`;
    }
  }
  return result;
}

/** Rows for display on the recipe page. */
export function nutritionRows(
  nutrition?: RecipeNutrition,
): { label: string; value: string }[] {
  const form = nutritionToForm(nutrition);
  return NUTRITION_FIELDS.filter((f) => form[f.key] !== "").map((f) => ({
    label: f.label,
    value: `${form[f.key]} ${f.unit}`,
  }));
}
