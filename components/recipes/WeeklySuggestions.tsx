"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchRecipes } from "@/lib/firebase/data";
import type { Recipe } from "@/lib/types";
import { categoryLabel, RECIPE_CATEGORIES } from "@/lib/category";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { LoadingBlock } from "@/components/ui/Alert";

const days = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

export default function WeeklySuggestions() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [active, setActive] = useState<string[]>([...RECIPE_CATEGORIES]);
  const [plan, setPlan] = useState<Array<{ day: string; meals: Recipe[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { void fetchRecipes().then(setRecipes).finally(() => setLoading(false)); }, []);

  const pools = useMemo(() => new Map(RECIPE_CATEGORIES.map((category) => [category, recipes.filter((recipe) => recipe.category === category)])), [recipes]);

  function generate() {
    setGenerating(true);
    window.setTimeout(() => {
      setPlan(days.map((day) => ({
        day,
        meals: active.flatMap((category) => {
          const pool = pools.get(category) ?? [];
          if (!pool.length) return [];
          return [pool[Math.floor(Math.random() * pool.length)]];
        }),
      })));
      setGenerating(false);
    }, 250);
  }

  useEffect(() => { if (recipes.length) generate(); /* initial plan */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes, active.join("|")]);

  if (loading) return <LoadingBlock label="Đang chuẩn bị thực đơn tuần..." />;
  if (!recipes.length) return <div className="notice-info">Không có công thức để gợi ý. Hãy thêm món mới vào sổ tay.</div>;

  return (
    <section>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><span className="eyebrow"><Icon name="calendar" size={15} /> Lên mâm cả tuần</span><h1 className="section-title">Gợi ý công thức theo tuần</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Chọn các nhóm món bạn muốn xuất hiện, rồi để Bếp Việt bốc thực đơn ngẫu nhiên.</p></div>
        <div className="flex flex-wrap gap-2">
          {RECIPE_CATEGORIES.map((category) => {
            const selected = active.includes(category);
            return <button key={category} type="button" aria-pressed={selected} onClick={() => setActive((prev) => selected ? prev.filter((x) => x !== category) : [...prev, category])} className={`pill ${selected ? "pill-active" : ""}`}>{categoryLabel(category)}</button>;
          })}
          <button type="button" onClick={generate} disabled={generating} className="btn-primary"><Icon name="refresh" size={16} /> {generating ? "Đang bốc..." : "Làm mới"}</button>
        </div>
      </div>

      <div className="grid gap-4">
        {plan.map((dayPlan, index) => (
          <details key={dayPlan.day} open={index === 0} className="group rounded-3xl border border-border bg-card shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-serif text-xl font-bold text-lacquer [&::-webkit-details-marker]:hidden"><span>{dayPlan.day}</span><span className="grid size-9 place-items-center rounded-full bg-gold/15 text-turmeric-700 transition group-open:rotate-180"><Icon name="chevron-right" size={17} /></span></summary>
            <div className="border-t border-border px-5 py-4">
              {dayPlan.meals.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{dayPlan.meals.map((recipe, mealIndex) => <Link key={`${recipe.id}-${mealIndex}`} href={`/cong-thuc/${recipe.slug}`} className="rounded-2xl border border-border/80 bg-cream/60 p-4 transition hover:-translate-y-0.5 hover:border-lacquer/20 hover:bg-cream"><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><span className="grid size-6 place-items-center rounded-full bg-gold text-lacquer">{mealIndex + 1}</span>{categoryLabel(recipe.category)}</div><div className="font-serif text-lg font-bold text-ink">{recipe.title}</div><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{recipe.description}</p></Link>)}</div> : <p className="text-sm text-muted">Không có món trong nhóm đã chọn.</p>}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
