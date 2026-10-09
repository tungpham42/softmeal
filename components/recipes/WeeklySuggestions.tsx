"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchRecipes } from "@/lib/firebase/data";
import type { Recipe } from "@/lib/types";
import { categoryLabel } from "@/lib/category";
import Icon from "@/components/ui/Icon";
import { LoadingBlock } from "@/components/ui/Alert";

/* -------------------------------------------------------------------------- */
/*  Types & constants                                                          */
/* -------------------------------------------------------------------------- */

type MealSlot = "Breakfast" | "Lunch" | "Dinner";
type MealMap = Record<MealSlot, string>;
type DayPlan = { day: string; meals: MealMap };
type ViewTab = "plan" | "shopping" | "nutrition";
type PlanView = "day" | "week";
type ShoppingScope = "week" | number; // number = day index
type NutrientKey = keyof NonNullable<Recipe["nutrition"]>;
type Toast = { message: string; undo?: () => void };

type IngredientLine = {
  key: string;
  label: string;
  amount?: number;
  unit?: string;
  name: string;
  count: number;
  recipes: string[];
};

const DAYS = [
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
  "Chủ Nhật",
];
const DAYS_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const MEALS: Array<{ key: MealSlot; label: string; hint: string }> = [
  { key: "Breakfast", label: "Bữa sáng", hint: "Gọn nhẹ, đủ năng lượng" },
  { key: "Lunch", label: "Bữa trưa", hint: "Bữa chính trong ngày" },
  { key: "Dinner", label: "Bữa tối", hint: "Ngon miệng, vừa bụng" },
];
const TOTAL_SLOTS = DAYS.length * MEALS.length;

const PLAN_STORAGE_PREFIX = "softmeal-week-plan-v1:";
const SHOPPING_STORAGE_PREFIX = "softmeal-shopping-checked-v1:";

const NUTRIENTS: Array<{ key: NutrientKey; label: string }> = [
  { key: "calories", label: "Năng lượng" },
  { key: "proteinContent", label: "Chất đạm" },
  { key: "carbohydrateContent", label: "Tinh bột" },
  { key: "fatContent", label: "Chất béo" },
  { key: "fiberContent", label: "Chất xơ" },
  { key: "sodiumContent", label: "Natri" },
];

/* -------------------------------------------------------------------------- */
/*  Date & storage helpers                                                     */
/* -------------------------------------------------------------------------- */

function getWeekStart(date = new Date()): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  return monday;
}

function getLocalWeekKey(date = new Date()): string {
  const monday = getWeekStart(date);
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const dom = String(monday.getDate()).padStart(2, "0");
  return `${monday.getFullYear()}-${month}-${dom}`;
}

function getTodayIndex(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

/** "5/10" for each day of the current week. */
function getWeekDateLabels(): string[] {
  const monday = getWeekStart();
  return DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
}

// localStorage can throw (private mode, quota, blocked cookies) — never crash on it.
function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/* -------------------------------------------------------------------------- */
/*  Plan helpers                                                               */
/* -------------------------------------------------------------------------- */

function blankMeals(): MealMap {
  return { Breakfast: "", Lunch: "", Dinner: "" };
}

/**
 * Pick a random recipe for a slot. Prefers recipes matching the slot's
 * category, and recipes not in `avoid` (so the week has more variety).
 */
function pickRecipe(
  recipes: Recipe[],
  slot: MealSlot,
  avoid: Set<string>,
  exclude?: string,
): Recipe | undefined {
  const preferred = recipes.filter((r) => r.category === slot);
  const savory = recipes.filter((r) => r.category !== "Dessert");
  const candidates = preferred.length
    ? preferred
    : savory.length
      ? savory
      : recipes;
  const withoutCurrent = candidates.filter((r) => r.id !== exclude);
  const base = withoutCurrent.length ? withoutCurrent : candidates;
  const fresh = base.filter((r) => !avoid.has(r.id));
  const pool = fresh.length ? fresh : base;
  return pool[Math.floor(Math.random() * pool.length)];
}

function createPlan(recipes: Recipe[]): DayPlan[] {
  const usedInWeek = new Set<string>();
  return DAYS.map((day) => {
    const meals = blankMeals();
    for (const { key } of MEALS) {
      const recipe = pickRecipe(recipes, key, usedInWeek);
      if (recipe) {
        meals[key] = recipe.id;
        usedInWeek.add(recipe.id);
      }
    }
    return { day, meals };
  });
}

/** Returns null when nothing valid was saved, so the caller can auto-generate. */
function restorePlan(raw: string | null, recipes: Recipe[]): DayPlan[] | null {
  if (!raw) return null;
  try {
    const saved: unknown = JSON.parse(raw);
    if (!Array.isArray(saved)) return null;
    const validIds = new Set(recipes.map((r) => r.id));
    return DAYS.map((day) => {
      const entry = saved.find(
        (item) => item && typeof item === "object" && item.day === day,
      );
      const meals = blankMeals();
      for (const { key } of MEALS) {
        const id = entry?.meals?.[key];
        // Intentionally cleared slots stay empty instead of being re-randomised.
        if (typeof id === "string" && validIds.has(id)) meals[key] = id;
      }
      return { day, meals };
    });
  } catch {
    return null;
  }
}

function countPlanned(day: DayPlan): number {
  return MEALS.filter(({ key }) => Boolean(day.meals[key])).length;
}

/* -------------------------------------------------------------------------- */
/*  Ingredient parsing & shopping list                                         */
/* -------------------------------------------------------------------------- */

function numericAmount(value: string): number | undefined {
  const normalized = value.trim().replace(",", ".");
  const fraction = normalized.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator ? Number(fraction[1]) / denominator : undefined;
  }
  const result = Number(normalized);
  return Number.isFinite(result) ? result : undefined;
}

const UNITS =
  "muỗng\\s+cà\\s+phê|muỗng\\s+canh|thìa\\s+cà\\s+phê|thìa\\s+canh|kg|grams|gram|gr|g|ml|lít|lit|l|quả|trái|củ|nhánh|bó|gói|miếng|con|chén|bát|lon|lá|nắm|muỗng|thìa|viên|tép|ít";
const AMOUNT = "(\\d+(?:[.,]\\d+)?(?:\\s*\\/\\s*\\d+)?)";
// `(?!\p{L})` stops a short unit like "l" or "g" from eating the start of a
// word ("2 lá chanh" must not become unit "l" + name "á chanh").
const PREFIX_RE = new RegExp(
  `^${AMOUNT}\\s*(?:(${UNITS})(?!\\p{L}))?\\s*(?:[:：,–-]\\s*)?(.*?)\\s*$`,
  "iu",
);
const SUFFIX_RE = new RegExp(
  `^(.*?)\\s*(?:[:：,–-]\\s*)?${AMOUNT}\\s*(${UNITS})\\s*$`,
  "iu",
);

const normalizeText = (s: string) =>
  s.toLocaleLowerCase("vi").replace(/\s+/g, " ").trim();

function parseIngredient(
  raw: string,
): Omit<IngredientLine, "count" | "recipes"> {
  const text = raw.trim();
  const prefix = text.match(PREFIX_RE);
  const suffix = text.match(SUFFIX_RE);
  let amount: number | undefined;
  let unit = "";
  let name = "";

  if (prefix && prefix[3]?.trim()) {
    amount = numericAmount(prefix[1]);
    unit = normalizeText(prefix[2] ?? "");
    name = prefix[3].trim();
  } else if (suffix && suffix[1]?.trim()) {
    name = suffix[1]
      .trim()
      .replace(/[:：,–-]+$/, "")
      .trim();
    amount = numericAmount(suffix[2]);
    unit = normalizeText(suffix[3]);
  }

  if (!name || amount === undefined) {
    return { key: `text:${normalizeText(text)}`, label: text, name: text };
  }

  // Convert only unambiguous metric units before aggregating.
  if (unit === "kg") {
    amount *= 1000;
    unit = "g";
  } else if (unit === "gram" || unit === "grams" || unit === "gr") {
    unit = "g";
  } else if (unit === "l" || unit === "lit" || unit === "lít") {
    amount *= 1000;
    unit = "ml";
  }

  const key = `qty:${normalizeText(name).replace(/[.。]+$/, "")}|${unit}`;
  return { key, label: `${amount} ${unit} ${name}`.trim(), amount, unit, name };
}

function formatAmount(amount: number): string {
  return Number.isInteger(amount)
    ? String(amount)
    : amount.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

/** Show 1500 g as "1,5 kg" and 1200 ml as "1,2 l" for readability. */
function prettyLabel(item: IngredientLine): string {
  if (item.amount === undefined) return item.label;
  let { amount } = item;
  let unit = item.unit ?? "";
  if (unit === "g" && amount >= 1000) {
    amount /= 1000;
    unit = "kg";
  } else if (unit === "ml" && amount >= 1000) {
    amount /= 1000;
    unit = "l";
  }
  return `${formatAmount(amount)} ${unit} ${item.name}`
    .replace(/\s+/g, " ")
    .trim();
}

function buildShoppingList(
  days: DayPlan[],
  recipesById: Map<string, Recipe>,
): IngredientLine[] {
  const items = new Map<string, IngredientLine>();
  for (const day of days) {
    for (const { key } of MEALS) {
      const recipe = recipesById.get(day.meals[key]);
      if (!recipe) continue;
      for (const raw of recipe.ingredients) {
        if (!raw.trim()) continue;
        const parsed = parseIngredient(raw);
        const current = items.get(parsed.key);
        if (current) {
          current.count += 1;
          if (!current.recipes.includes(recipe.title))
            current.recipes.push(recipe.title);
          if (current.amount !== undefined && parsed.amount !== undefined) {
            current.amount += parsed.amount;
          }
        } else {
          items.set(parsed.key, {
            ...parsed,
            count: 1,
            recipes: [recipe.title],
          });
        }
      }
    }
  }
  return [...items.values()]
    .map((item) => ({ ...item, label: prettyLabel(item) }))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

/* -------------------------------------------------------------------------- */
/*  Nutrition helpers                                                          */
/* -------------------------------------------------------------------------- */

function nutrientText(recipe: Recipe, key: NutrientKey): string | undefined {
  const value = recipe.nutrition?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseNutrientValue(
  text: string | undefined,
): { num: number; unit: string } | undefined {
  if (!text) return undefined;
  const match = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return undefined;
  const num = Number(match[1].replace(",", "."));
  if (!Number.isFinite(num)) return undefined;
  return { num, unit: text.replace(match[1], "").trim().toLowerCase() };
}

/** Sum a nutrient across recipes; undefined when no data or units disagree. */
function sumNutrient(
  recipes: Recipe[],
  key: NutrientKey,
): { text?: string; missing: number } {
  const parsed = recipes.map((r) => parseNutrientValue(nutrientText(r, key)));
  const present = parsed.filter((p): p is { num: number; unit: string } =>
    Boolean(p),
  );
  const missing = recipes.length - present.length;
  if (!present.length) return { missing };
  if (new Set(present.map((p) => p.unit)).size > 1) return { missing };
  const total = present.reduce((s, p) => s + p.num, 0);
  const unit = present[0].unit;
  return {
    text: `${formatAmount(Math.round(total * 10) / 10)}${unit ? ` ${unit}` : ""}`,
    missing,
  };
}

/* -------------------------------------------------------------------------- */
/*  Small presentational pieces                                                */
/* -------------------------------------------------------------------------- */

function NutrientGrid({
  recipe,
  columns = "grid-cols-2 sm:grid-cols-3",
}: {
  recipe: Recipe;
  columns?: string;
}) {
  return (
    <div className={`grid gap-2 ${columns}`}>
      {NUTRIENTS.map(({ key, label }) => {
        const value = nutrientText(recipe, key);
        return (
          <div key={key} className="rounded-xl bg-cream/80 p-3">
            <p className="text-xs text-muted">{label}</p>
            <p
              className={`mt-1 break-words text-sm font-bold ${value ? "text-ink" : "font-normal text-muted"}`}
            >
              {value ?? "Chưa có dữ liệu"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-border/60"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div
        className="h-full rounded-full bg-lacquer transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Meal card                                                                  */
/* -------------------------------------------------------------------------- */

function MealCard({
  idPrefix,
  slot,
  recipeId,
  recipe,
  recipes,
  onChange,
  onShuffle,
  onClear,
}: {
  idPrefix: string;
  slot: { key: MealSlot; label: string; hint: string };
  recipeId: string;
  recipe?: Recipe;
  recipes: Recipe[]; // already sorted by title
  onChange: (id: string) => void;
  onShuffle: () => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const suggested = recipes.filter((r) => r.category === slot.key);
  const others = recipes.filter((r) => r.category !== slot.key);
  const optionLabel = (r: Recipe) =>
    `${r.title} · ${categoryLabel(r.category)}`;

  return (
    <div className="rounded-2xl border border-border/80 bg-cream/40 p-4">
      <div className="grid gap-3 lg:grid-cols-[0.8fr_1.5fr] lg:items-center">
        <div>
          <p className="font-bold text-ink">{slot.label}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{slot.hint}</p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor={`${idPrefix}-select`}>
            Chọn món cho {slot.label.toLowerCase()}
          </label>
          <select
            id={`${idPrefix}-select`}
            className="form-input min-w-0 flex-1"
            value={recipeId}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Chưa chọn món</option>
            {suggested.length > 0 && others.length > 0 ? (
              <>
                <optgroup label={`Gợi ý cho ${slot.label.toLowerCase()}`}>
                  {suggested.map((r) => (
                    <option key={r.id} value={r.id}>
                      {optionLabel(r)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Các món khác">
                  {others.map((r) => (
                    <option key={r.id} value={r.id}>
                      {optionLabel(r)}
                    </option>
                  ))}
                </optgroup>
              </>
            ) : (
              recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {optionLabel(r)}
                </option>
              ))
            )}
          </select>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onShuffle}
              className="btn-secondary"
              title="Đổi sang một món ngẫu nhiên khác"
            >
              <Icon name="refresh" size={16} />
              <span className="ml-1">Đổi món</span>
            </button>
            {recipeId && (
              <button
                type="button"
                onClick={onClear}
                className="btn-secondary"
                aria-label={`Bỏ món ${slot.label.toLowerCase()}`}
                title="Bỏ món này"
              >
                Bỏ
              </button>
            )}
          </div>
        </div>
      </div>

      {recipe ? (
        <div className="mt-3 border-t border-border/70 pt-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link
                href={`/cong-thuc/${recipe.slug}`}
                className="font-serif text-lg font-bold text-ink hover:text-lacquer"
              >
                {recipe.title}
              </Link>
              {recipe.description && (
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">
                  {recipe.description}
                </p>
              )}
              <p className="mt-2 text-xs text-muted">
                {recipe.ingredients.length} nguyên liệu · {recipe.steps.length}{" "}
                bước nấu
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="btn-secondary shrink-0 self-start"
              aria-expanded={open}
            >
              {open ? "Thu gọn" : "Xem cách nấu"}
            </button>
          </div>

          {open && (
            <div className="mt-4 grid gap-5 border-t border-border pt-4 lg:grid-cols-2">
              <div>
                <h3 className="font-serif text-lg font-bold text-lacquer">
                  Nguyên liệu
                </h3>
                {recipe.ingredients.length ? (
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-ink">
                    {recipe.ingredients.map((ingredient, i) => (
                      <li
                        key={`${ingredient}-${i}`}
                        className="border-b border-border/60 pb-2"
                      >
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">
                    Chưa có danh sách nguyên liệu.
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-lacquer">
                  Các bước chế biến
                </h3>
                {recipe.steps.length ? (
                  <ol className="mt-2 space-y-3 text-sm leading-6 text-ink">
                    {recipe.steps.map((step, i) => (
                      <li key={`${i}-${step}`} className="flex gap-3">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gold/30 text-xs font-bold text-lacquer">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-sm text-muted">
                    Chưa có hướng dẫn chế biến.
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 lg:col-span-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <h3 className="font-serif text-lg font-bold text-lacquer">
                    Dinh dưỡng được cung cấp
                  </h3>
                  <Link
                    href={`/cong-thuc/${recipe.slug}`}
                    className="text-sm font-bold text-lacquer underline underline-offset-4"
                  >
                    Mở trang công thức đầy đủ
                  </Link>
                </div>
                <div className="mt-3">
                  <NutrientGrid recipe={recipe} />
                </div>
                <p className="mt-3 text-xs leading-5 text-muted">
                  Dữ liệu dinh dưỡng phụ thuộc thông tin công thức do tác giả
                  cung cấp; không tự ước tính khi thiếu dữ liệu.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Chọn một món ở danh sách, hoặc bấm “Đổi món” để nhận gợi ý ngẫu nhiên.
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export default function WeeklySuggestions() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    () => new Set(),
  );
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [activeTab, setActiveTab] = useState<ViewTab>("plan");
  const [planView, setPlanView] = useState<PlanView>("day");
  const [selectedDay, setSelectedDay] = useState(() => getTodayIndex());
  const [nutritionDay, setNutritionDay] = useState(() => getTodayIndex());
  // Default to today's list; the person can switch to the whole week or another day.
  const [shoppingScope, setShoppingScope] = useState<ShoppingScope>(() =>
    getTodayIndex(),
  );
  const [shoppingQuery, setShoppingQuery] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [copied, setCopied] = useState(false);

  const weekKey = useMemo(() => getLocalWeekKey(), []);
  const weekDates = useMemo(() => getWeekDateLabels(), []);
  const todayIndex = getTodayIndex();

  /* ----- load recipes + restore saved state (single effect) ----- */
  useEffect(() => {
    let alive = true;
    fetchRecipes()
      .then((items) => {
        if (!alive) return;
        setRecipes(items);
        setPlan(
          restorePlan(readStorage(`${PLAN_STORAGE_PREFIX}${weekKey}`), items) ??
            createPlan(items),
        );
        let checked: string[] = [];
        try {
          const parsed: unknown = JSON.parse(
            readStorage(`${SHOPPING_STORAGE_PREFIX}${weekKey}`) ?? "[]",
          );
          if (Array.isArray(parsed))
            checked = parsed.filter((x): x is string => typeof x === "string");
        } catch {
          /* ignore corrupt data */
        }
        setCheckedItems(new Set(checked));
        setReady(true);
      })
      .catch(() => {
        if (alive) setError("Không thể tải công thức. Vui lòng thử lại.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [weekKey, reloadToken]);

  /* ----- persist ----- */
  useEffect(() => {
    if (ready)
      writeStorage(`${PLAN_STORAGE_PREFIX}${weekKey}`, JSON.stringify(plan));
  }, [plan, ready, weekKey]);

  useEffect(() => {
    if (ready)
      writeStorage(
        `${SHOPPING_STORAGE_PREFIX}${weekKey}`,
        JSON.stringify([...checkedItems]),
      );
  }, [checkedItems, ready, weekKey]);

  /* ----- toast auto-dismiss ----- */
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(id);
  }, [toast]);

  /* ----- "copied" check mark auto-reset ----- */
  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  /* ----- derived data ----- */
  const recipesById = useMemo(
    () => new Map(recipes.map((r) => [r.id, r])),
    [recipes],
  );
  const sortedRecipes = useMemo(
    () => [...recipes].sort((a, b) => a.title.localeCompare(b.title, "vi")),
    [recipes],
  );
  const plannedMealsCount = useMemo(
    () => plan.reduce((sum, day) => sum + countPlanned(day), 0),
    [plan],
  );

  const shoppingDays = useMemo(
    () =>
      shoppingScope === "week"
        ? plan
        : plan.filter((_, i) => i === shoppingScope),
    [plan, shoppingScope],
  );
  const shoppingItems = useMemo(
    () => buildShoppingList(shoppingDays, recipesById),
    [shoppingDays, recipesById],
  );
  const visibleShopping = useMemo(() => {
    const q = normalizeText(shoppingQuery);
    return q
      ? shoppingItems.filter((i) => normalizeText(i.label).includes(q))
      : shoppingItems;
  }, [shoppingItems, shoppingQuery]);
  const toBuy = visibleShopping.filter((i) => !checkedItems.has(i.key));
  const bought = visibleShopping.filter((i) => checkedItems.has(i.key));
  const checkedCount = shoppingItems.filter((i) =>
    checkedItems.has(i.key),
  ).length;

  const nutritionRecipes = useMemo(() => {
    const day = plan[nutritionDay];
    if (!day) return [];
    return MEALS.flatMap(({ key, label }) => {
      const recipe = recipesById.get(day.meals[key]);
      return recipe ? [{ slot: label, recipe }] : [];
    });
  }, [plan, nutritionDay, recipesById]);

  /* ----- actions ----- */
  const notify = useCallback((message: string, undo?: () => void) => {
    setToast({ message, undo });
  }, []);

  async function copyText(text: string, okMessage: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      notify(okMessage);
      return true;
    } catch {
      window.prompt("Sao chép nội dung:", text);
      return false;
    }
  }

  function regeneratePlan() {
    const previous = plan;
    const previousChecked = checkedItems;
    setPlan(createPlan(recipes));
    setCheckedItems(new Set());
    notify("Đã bốc thực đơn mới cho cả tuần.", () => {
      setPlan(previous);
      setCheckedItems(previousChecked);
    });
  }

  function clearPlan() {
    const previous = plan;
    setPlan(DAYS.map((day) => ({ day, meals: blankMeals() })));
    notify("Đã xoá toàn bộ thực đơn tuần.", () => setPlan(previous));
  }

  function setMeal(dayIndex: number, slot: MealSlot, recipeId: string) {
    setPlan((current) =>
      current.map((day, i) =>
        i === dayIndex
          ? { ...day, meals: { ...day.meals, [slot]: recipeId } }
          : day,
      ),
    );
  }

  function shuffleMeal(dayIndex: number, slot: MealSlot) {
    const day = plan[dayIndex];
    if (!day) return;
    const avoid = new Set(plan.flatMap((d) => Object.values(d.meals)));
    const next = pickRecipe(recipes, slot, avoid, day.meals[slot]);
    if (next) setMeal(dayIndex, slot, next.id);
  }

  function fillEmptyMeals() {
    const avoid = new Set(plan.flatMap((d) => Object.values(d.meals)));
    const previous = plan;
    setPlan(
      plan.map((day) => {
        const meals = { ...day.meals };
        for (const { key } of MEALS) {
          if (meals[key]) continue;
          const recipe = pickRecipe(recipes, key, avoid);
          if (recipe) {
            meals[key] = recipe.id;
            avoid.add(recipe.id);
          }
        }
        return { ...day, meals };
      }),
    );
    notify("Đã điền các bữa còn trống.", () => setPlan(previous));
  }

  function toggleShoppingItem(key: string) {
    setCheckedItems((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function uncheckVisible() {
    const previous = checkedItems;
    const visibleKeys = new Set(shoppingItems.map((i) => i.key));
    setCheckedItems(
      new Set([...checkedItems].filter((k) => !visibleKeys.has(k))),
    );
    notify("Đã bỏ đánh dấu.", () => setCheckedItems(previous));
  }

  async function copyShoppingList() {
    const lines = toBuy.map((i) => `[ ] ${i.label}`);
    const title =
      shoppingScope === "week"
        ? "Danh sách đi chợ cả tuần"
        : `Danh sách đi chợ ${DAYS[shoppingScope]}`;
    const ok = await copyText(
      lines.length
        ? `${title}\n${lines.join("\n")}`
        : "Danh sách đi chợ đang trống.",
      "Đã sao chép phần còn cần mua.",
    );
    if (ok) setCopied(true);
  }

  function copyWeekPlan() {
    const text = plan
      .map((day, i) => {
        const rows = MEALS.map(({ key, label }) => {
          const r = recipesById.get(day.meals[key]);
          return `  ${label}: ${r ? r.title : "—"}`;
        });
        return `${day.day} (${weekDates[i]})\n${rows.join("\n")}`;
      })
      .join("\n\n");
    copyText(`Thực đơn tuần\n\n${text}`, "Đã sao chép thực đơn tuần.");
  }

  /* ----- early returns (after all hooks) ----- */
  if (loading)
    return (
      <LoadingBlock label="Đang chuẩn bị thực đơn và danh sách đi chợ..." />
    );

  if (error)
    return (
      <div className="notice-danger space-y-3">
        <p>{error}</p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setReloadToken((t) => t + 1)}
        >
          Thử lại
        </button>
      </div>
    );

  if (!recipes.length) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center">
        <h1 className="section-title">Cùng lên thực đơn đầu tiên</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
          Chưa có công thức để xếp món. Hãy thêm vài món vào sổ tay, rồi quay
          lại để tự động lên thực đơn, gom nguyên liệu và xem dinh dưỡng.
        </p>
        <Link href="/them" className="btn-primary mt-5 inline-flex">
          Thêm công thức
        </Link>
      </div>
    );
  }

  const tabs: Array<{
    key: ViewTab;
    label: string;
    description: string;
    badge?: string;
  }> = [
    {
      key: "plan",
      label: "Thực đơn tuần",
      description: "Chọn món cho từng bữa",
      badge: `${plannedMealsCount}/${TOTAL_SLOTS}`,
    },
    {
      key: "shopping",
      label: "Đi chợ",
      description: "Nguyên liệu cần mua",
      badge: shoppingItems.length
        ? `${checkedCount}/${shoppingItems.length}`
        : undefined,
    },
    {
      key: "nutrition",
      label: "Dinh dưỡng",
      description: "Xem thông tin theo từng ngày",
    },
  ];

  const selectedPlan = plan[selectedDay];
  const emptySlots = TOTAL_SLOTS - plannedMealsCount;

  return (
    <section className="space-y-6">
      {/* ---------------------------- Header ---------------------------- */}
      <header className="hero-paper relative overflow-hidden rounded-[2rem] px-6 py-7 text-ivory shadow-[0_22px_65px_rgba(125,36,24,0.16)] sm:px-9 sm:py-9">
        <div className="absolute -right-12 -top-16 size-56 rounded-full border border-gold/20 bg-gold/5" />
        <div className="relative">
          <span className="eyebrow text-gold-light">
            <Icon name="calendar" size={15} /> Kế hoạch bếp nhà ·{" "}
            {DAYS[todayIndex]}, {weekDates[todayIndex]}
          </span>
          <h1 className="mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight sm:text-4xl">
            Hôm nay ăn gì? Cả tuần đã có kế hoạch.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ivory/80">
            Chọn món, gom nguyên liệu đi chợ, mở cách nấu và xem dinh dưỡng —
            tất cả trong một nơi.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab("plan");
                setPlanView("day");
                setSelectedDay(todayIndex);
              }}
              className="btn-gold"
            >
              Xem bữa hôm nay
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("shopping");
                setShoppingScope(todayIndex);
              }}
              className="btn-outline-dark border-ivory/30 text-ivory hover:bg-ivory/10"
            >
              Đi chợ cần mua gì?
            </button>
          </div>
        </div>
      </header>

      {/* ----------------------------- Tabs ----------------------------- */}
      <nav
        role="tablist"
        aria-label="Tiện ích bếp"
        className="grid gap-2 rounded-3xl border border-border bg-card p-2 sm:grid-cols-3"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`tab-${tab.key}`}
              aria-selected={active}
              aria-controls={`panel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-2xl px-4 py-3 text-left transition ${active ? "bg-lacquer text-ivory shadow-sm" : "text-ink hover:bg-cream"}`}
            >
              <span className="flex items-center justify-between gap-2 font-bold">
                {tab.label}
                {tab.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? "bg-ivory/20 text-ivory" : "bg-gold/20 text-lacquer"}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
              <span
                className={`mt-1 block text-xs ${active ? "text-ivory/75" : "text-muted"}`}
              >
                {tab.description}
              </span>
            </button>
          );
        })}
      </nav>

      {/* --------------------------- Plan tab --------------------------- */}
      {activeTab === "plan" && selectedPlan && (
        <div
          role="tabpanel"
          id="panel-plan"
          aria-labelledby="tab-plan"
          className="space-y-5"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="eyebrow">
                <Icon name="bowl" size={15} /> Từ thứ Hai đến Chủ Nhật
              </span>
              <h2 className="section-title mt-2">Thực đơn của gia đình</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Đã lên {plannedMealsCount}/{TOTAL_SLOTS} bữa. Kế hoạch tự lưu
                trên thiết bị này theo từng tuần.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {emptySlots > 0 && (
                <button
                  type="button"
                  onClick={fillEmptyMeals}
                  className="btn-secondary"
                >
                  Điền {emptySlots} bữa trống
                </button>
              )}
              <button
                type="button"
                onClick={regeneratePlan}
                className="btn-secondary"
              >
                <Icon name="refresh" size={16} />
                <span className="ml-1">Bốc thực đơn mới</span>
              </button>
              <button
                type="button"
                onClick={copyWeekPlan}
                className="btn-secondary"
              >
                <Icon name="copy" size={16} />
                <span className="ml-1">Sao chép thực đơn</span>
              </button>
              {plannedMealsCount > 0 && (
                <button
                  type="button"
                  onClick={clearPlan}
                  className="btn-secondary"
                >
                  Xoá hết
                </button>
              )}
            </div>
          </div>

          {/* view switch */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={planView === "day"}
              onClick={() => setPlanView("day")}
              className={`pill ${planView === "day" ? "pill-active" : ""}`}
            >
              Từng ngày
            </button>
            <button
              type="button"
              aria-pressed={planView === "week"}
              onClick={() => setPlanView("week")}
              className={`pill ${planView === "week" ? "pill-active" : ""}`}
            >
              Tổng quan cả tuần
            </button>
          </div>

          {planView === "day" ? (
            <>
              {/* day picker */}
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                role="group"
                aria-label="Chọn ngày"
              >
                {plan.map((day, i) => {
                  const active = selectedDay === i;
                  const done = countPlanned(day);
                  return (
                    <button
                      key={day.day}
                      type="button"
                      onClick={() => setSelectedDay(i)}
                      aria-pressed={active}
                      aria-current={i === todayIndex ? "date" : undefined}
                      className={`min-w-[4.5rem] shrink-0 rounded-2xl border px-3 py-2 text-center transition ${active ? "border-lacquer bg-lacquer text-ivory" : "border-border bg-card text-ink hover:bg-cream"}`}
                    >
                      <span className="block text-sm font-bold">
                        {DAYS_SHORT[i]}
                      </span>
                      <span
                        className={`block text-xs ${active ? "text-ivory/80" : "text-muted"}`}
                      >
                        {weekDates[i]}
                      </span>
                      <span
                        className={`mt-1 block text-[11px] font-semibold ${active ? "text-gold-light" : done === MEALS.length ? "text-bamboo" : "text-muted"}`}
                      >
                        {i === todayIndex ? "Hôm nay · " : ""}
                        {done}/{MEALS.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-serif text-2xl font-bold text-lacquer">
                    {selectedPlan.day}{" "}
                    <span className="text-base font-medium text-muted">
                      · {weekDates[selectedDay]}
                    </span>
                  </h3>
                  {selectedDay !== todayIndex && (
                    <button
                      type="button"
                      onClick={() => setSelectedDay(todayIndex)}
                      className="text-sm font-semibold text-lacquer underline underline-offset-4"
                    >
                      Về hôm nay
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {MEALS.map((slot) => (
                    <MealCard
                      key={`${selectedDay}-${slot.key}`}
                      idPrefix={`meal-${selectedDay}-${slot.key}`}
                      slot={slot}
                      recipeId={selectedPlan.meals[slot.key]}
                      recipe={recipesById.get(selectedPlan.meals[slot.key])}
                      recipes={sortedRecipes}
                      onChange={(id) => setMeal(selectedDay, slot.key, id)}
                      onShuffle={() => shuffleMeal(selectedDay, slot.key)}
                      onClear={() => setMeal(selectedDay, slot.key, "")}
                    />
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={selectedDay === 0}
                    onClick={() => setSelectedDay((d) => Math.max(0, d - 1))}
                  >
                    ← Hôm trước
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={selectedDay === DAYS.length - 1}
                    onClick={() =>
                      setSelectedDay((d) => Math.min(DAYS.length - 1, d + 1))
                    }
                  >
                    Hôm sau →
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
              <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                    <th className="p-3 font-bold">Ngày</th>
                    {MEALS.map((m) => (
                      <th key={m.key} className="p-3 font-bold">
                        {m.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.map((day, i) => (
                    <tr
                      key={day.day}
                      className={`border-b border-border/60 last:border-0 ${i === todayIndex ? "bg-gold/10" : ""}`}
                    >
                      <th scope="row" className="p-3 align-top">
                        <span className="block font-serif font-bold text-lacquer">
                          {day.day}
                        </span>
                        <span className="text-xs font-normal text-muted">
                          {weekDates[i]}
                          {i === todayIndex ? " · Hôm nay" : ""}
                        </span>
                      </th>
                      {MEALS.map(({ key, label }) => {
                        const r = recipesById.get(day.meals[key]);
                        return (
                          <td key={key} className="p-3 align-top">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDay(i);
                                setPlanView("day");
                              }}
                              aria-label={`${day.day}, ${label}: ${r ? r.title : "chưa chọn món"}. Bấm để chỉnh sửa.`}
                              className={`w-full rounded-xl px-3 py-2 text-left transition hover:bg-cream ${r ? "font-semibold text-ink" : "text-muted"}`}
                            >
                              {r ? r.title : "+ Chọn món"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ------------------------- Shopping tab ------------------------- */}
      {activeTab === "shopping" && (
        <div
          role="tabpanel"
          id="panel-shopping"
          aria-labelledby="tab-shopping"
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title">Đi chợ</h2>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="shopping-scope">
                Phạm vi danh sách
              </label>
              <select
                id="shopping-scope"
                className="form-input w-auto"
                value={String(shoppingScope)}
                onChange={(e) =>
                  setShoppingScope(
                    e.target.value === "week" ? "week" : Number(e.target.value),
                  )
                }
              >
                <option value="week">Cả tuần</option>
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {i === todayIndex ? `${d} (hôm nay)` : d}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={copyShoppingList}
                disabled={toBuy.length === 0}
                className="btn-primary inline-flex items-center w-100"
                aria-label="Sao chép phần cần mua"
                title="Sao chép phần cần mua"
              >
                <Icon name={copied ? "check" : "copy"} size={18} />
                <span className="ml-1.5 hidden sm:inline">
                  {copied ? "Đã chép" : "Sao chép"}
                </span>
              </button>
            </div>
          </div>

          {shoppingItems.length === 0 ? (
            <div className="notice-info flex flex-wrap items-center justify-between gap-3">
              <span>
                {shoppingScope === "week"
                  ? "Chưa có món nào để gom nguyên liệu."
                  : `${shoppingScope === todayIndex ? "Hôm nay" : DAYS[shoppingScope]} chưa có món nào.`}
              </span>
              <div className="flex gap-2">
                {shoppingScope !== "week" && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShoppingScope("week")}
                  >
                    Xem cả tuần
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    if (shoppingScope !== "week") setSelectedDay(shoppingScope);
                    setPlanView("day");
                    setActiveTab("plan");
                  }}
                >
                  Chọn món
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <ProgressBar
                    value={checkedCount}
                    max={shoppingItems.length}
                  />
                </div>
                <span className="shrink-0 text-sm font-semibold text-muted">
                  {checkedCount}/{shoppingItems.length}
                </span>
              </div>

              {shoppingItems.length > 12 && (
                <>
                  <label className="sr-only" htmlFor="shopping-search">
                    Tìm nguyên liệu
                  </label>
                  <input
                    id="shopping-search"
                    type="search"
                    className="form-input mt-3"
                    placeholder="Tìm nguyên liệu…"
                    value={shoppingQuery}
                    onChange={(e) => setShoppingQuery(e.target.value)}
                  />
                </>
              )}

              {visibleShopping.length === 0 ? (
                <p className="py-4 text-sm text-muted">
                  Không có “{shoppingQuery}”.
                </p>
              ) : toBuy.length > 0 ? (
                <ul className="mt-2 divide-y divide-border/60">
                  {toBuy.map((item) => (
                    <ShoppingRow
                      key={item.key}
                      item={item}
                      checked={false}
                      onToggle={toggleShoppingItem}
                    />
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm font-semibold text-bamboo">
                  Đã mua đủ 🎉
                </p>
              )}

              {bought.length > 0 && (
                <details className="mt-2 border-t border-border pt-1">
                  <summary className="cursor-pointer py-2 text-sm font-semibold text-muted">
                    Đã mua ({bought.length})
                  </summary>
                  <ul className="divide-y divide-border/60">
                    {bought.map((item) => (
                      <ShoppingRow
                        key={item.key}
                        item={item}
                        checked
                        onToggle={toggleShoppingItem}
                      />
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={uncheckVisible}
                    className="mt-2 text-sm font-semibold text-lacquer underline underline-offset-4"
                  >
                    Bỏ tích hết
                  </button>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------- Nutrition tab ------------------------ */}
      {activeTab === "nutrition" && (
        <div
          role="tabpanel"
          id="panel-nutrition"
          aria-labelledby="tab-nutrition"
          className="space-y-5"
        >
          <div>
            <span className="eyebrow">Ăn ngon, hiểu món mình ăn</span>
            <h2 className="section-title mt-2">Dinh dưỡng theo thực đơn</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Chọn ngày để xem dinh dưỡng từng món và tổng cả ngày, dựa trên dữ
              liệu có trong công thức.
            </p>
          </div>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Chọn ngày"
          >
            {DAYS.map((day, i) => (
              <button
                key={day}
                type="button"
                onClick={() => setNutritionDay(i)}
                aria-pressed={nutritionDay === i}
                className={`pill shrink-0 ${nutritionDay === i ? "pill-active" : ""}`}
              >
                {day}
                {i === todayIndex ? " · hôm nay" : ""}
              </button>
            ))}
          </div>

          {nutritionRecipes.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-serif text-xl font-bold text-lacquer">
                Tổng cả ngày · {DAYS[nutritionDay]}
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {NUTRIENTS.map(({ key, label }) => {
                  const { text, missing } = sumNutrient(
                    nutritionRecipes.map((n) => n.recipe),
                    key,
                  );
                  return (
                    <div key={key} className="rounded-xl bg-cream/80 p-3">
                      <p className="text-xs text-muted">{label}</p>
                      <p
                        className={`mt-1 break-words text-sm font-bold ${text ? "text-ink" : "font-normal text-muted"}`}
                      >
                        {text ?? "Chưa đủ dữ liệu"}
                      </p>
                      {text && missing > 0 && (
                        <p className="mt-1 text-[11px] text-muted">
                          thiếu {missing} món
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                Tổng chỉ cộng các món có số liệu cùng đơn vị; không tự ước tính
                phần còn thiếu.
              </p>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            {nutritionRecipes.map(({ slot, recipe }) => (
              <article
                key={`${slot}-${recipe.id}`}
                className="rounded-3xl border border-border bg-card p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  {slot}
                </p>
                <Link
                  href={`/cong-thuc/${recipe.slug}`}
                  className="mt-2 block font-serif text-xl font-bold text-ink hover:text-lacquer"
                >
                  {recipe.title}
                </Link>
                {recipe.description && (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
                    {recipe.description}
                  </p>
                )}
                <div className="mt-4">
                  <NutrientGrid recipe={recipe} columns="grid-cols-2" />
                </div>
                <p className="mt-3 text-xs leading-5 text-muted">
                  Giá trị theo dữ liệu công thức, chưa chắc tương ứng với khẩu
                  phần thực tế của bạn.
                </p>
              </article>
            ))}
          </div>

          {!nutritionRecipes.length && (
            <div className="notice-info flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Chưa có món cho {DAYS[nutritionDay]}. Hãy chọn món trong “Thực
                đơn tuần” trước nhé.
              </span>
              <button
                type="button"
                className="btn-secondary self-start"
                onClick={() => {
                  setSelectedDay(nutritionDay);
                  setPlanView("day");
                  setActiveTab("plan");
                }}
              >
                Chọn món cho ngày này
              </button>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs leading-5 text-muted">
        Thực đơn và danh sách đi chợ được lưu cục bộ theo tuần trên trình duyệt
        hiện tại. Dữ liệu không tự đồng bộ giữa các thiết bị.
      </p>

      {/* ----------------------------- Toast ---------------------------- */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      >
        {toast && (
          <div className="pointer-events-auto flex items-center gap-4 rounded-2xl bg-ink px-4 py-3 text-sm text-ivory shadow-lg">
            <span>{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                className="font-bold text-gold-light underline underline-offset-4"
                onClick={() => {
                  toast.undo?.();
                  setToast(null);
                }}
              >
                Hoàn tác
              </button>
            )}
            <button
              type="button"
              aria-label="Đóng thông báo"
              className="text-ivory/70 hover:text-ivory"
              onClick={() => setToast(null)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shopping row                                                               */
/* -------------------------------------------------------------------------- */

function ShoppingRow({
  item,
  checked,
  onToggle,
}: {
  item: IngredientLine;
  checked: boolean;
  onToggle: (key: string) => void;
}) {
  const recipes = item.recipes.join(", ");
  return (
    <li>
      <label
        className="flex cursor-pointer items-center gap-3 py-2.5"
        title={`Dùng cho: ${recipes}`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(item.key)}
          className="size-5 shrink-0 accent-[#7d2418]"
        />
        <span
          className={`min-w-0 flex-1 font-medium ${checked ? "text-muted line-through" : "text-ink"}`}
        >
          {item.label}
        </span>
        <span className="hidden max-w-[40%] shrink-0 truncate text-xs text-muted sm:block">
          {recipes}
        </span>
      </label>
    </li>
  );
}
