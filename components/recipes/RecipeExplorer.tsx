"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { fetchRecipes } from "@/lib/firebase/data";
import type { Recipe, SortOption } from "@/lib/types";
import { categoryLabel, RECIPE_CATEGORIES } from "@/lib/category";
import RecipeCard from "@/components/recipes/RecipeCard";
import Pagination from "@/components/ui/Pagination";
import Icon from "@/components/ui/Icon";
import { LoadingBlock } from "@/components/ui/Alert";

const ITEMS_PER_PAGE = 12;

export default function RecipeExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = (searchParams.get("sort") as SortOption) || "alphabetAsc";
  const page = Math.max(1, Number(searchParams.get("page") || 1));

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchRecipes()
      .then(setRecipes)
      .catch(() => setError("Không thể tải công thức. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = recipes.filter((recipe) => {
      const matchesSearch =
        !query ||
        recipe.title.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query);
      const matchesCategory = !category || recipe.category === category;
      return matchesSearch && matchesCategory;
    });
    return [...list].sort((a, b) => {
      if (sort === "alphabetDesc") return b.title.localeCompare(a.title, "vi");
      if (sort === "dateAsc")
        return (
          new Date(a.createdAt ?? 0).getTime() -
          new Date(b.createdAt ?? 0).getTime()
        );
      if (sort === "dateDesc")
        return (
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime()
        );
      return a.title.localeCompare(b.title, "vi");
    });
  }, [recipes, search, category, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const current = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  function updateUrl(
    nextPage: number,
    nextSearch = search,
    nextCategory = category,
    nextSort = sort,
  ) {
    const next = new URLSearchParams();
    if (nextSearch) next.set("search", nextSearch);
    if (nextCategory) next.set("category", nextCategory);
    if (nextSort !== "alphabetAsc") next.set("sort", nextSort);
    if (nextPage > 1) next.set("page", String(nextPage));

    const qs = next.toString();
    const url = `${pathname}${qs ? `?${qs}` : ""}`;

    if (nextCategory !== category) {
      // Category drives title/description/OG -> let the server re-run generateMetadata
      router.replace(url, { scroll: false });
    } else {
      // Search / sort / page: client-only update, no server round-trip
      window.history.replaceState(null, "", url);
    }
  }

  function reset() {
    updateUrl(1, "", "", "alphabetAsc");
  }

  return (
    <section>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow">
            <Icon name="bowl" size={15} /> Bếp nhà Việt
          </span>
          <h2 className="section-title">Khám phá công thức</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Từ món cơm gia đình đến món đãi khách — tìm cảm hứng cho mâm cơm hôm
            nay.
          </p>
        </div>
        <button
          onClick={reset}
          type="button"
          className="btn-secondary self-start sm:self-auto"
        >
          <Icon name="refresh" size={16} /> Đặt lại
        </button>
      </div>

      <div className="mb-8 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr]">
          <label className="relative block">
            <span className="sr-only">Tìm kiếm công thức</span>
            <input
              value={search}
              onChange={(e) => updateUrl(1, e.target.value, category, sort)}
              className="form-input pr-11"
              placeholder="Tìm món ăn, nguyên liệu, tên công thức..."
            />
            <Icon
              name="search"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
            />
          </label>
          <label>
            <span className="sr-only">Danh mục</span>
            <select
              value={category}
              onChange={(e) => updateUrl(1, search, e.target.value, sort)}
              className="form-input"
            >
              <option value="">Tất cả danh mục</option>
              {RECIPE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {categoryLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Sắp xếp</span>
            <select
              value={sort}
              onChange={(e) =>
                updateUrl(1, search, category, e.target.value as SortOption)
              }
              className="form-input"
            >
              <option value="alphabetAsc">Tên A → Z</option>
              <option value="alphabetDesc">Tên Z → A</option>
              <option value="dateDesc">Mới nhất</option>
              <option value="dateAsc">Cũ nhất</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <LoadingBlock label="Đang mở sổ tay món ngon..." />
      ) : error ? (
        <div className="notice-danger">{error}</div>
      ) : current.length === 0 ? (
        <div className="notice-info">
          <strong>Chưa có công thức phù hợp.</strong>
          <span>Thử đổi từ khóa hoặc chọn “Tất cả danh mục”.</span>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted">
            Hiển thị <strong className="text-ink">{current.length}</strong> /{" "}
            {filtered.length} công thức
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {current.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
          <Pagination
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filtered.length}
            currentPage={currentPage}
            onPageChange={updateUrl}
          />
        </>
      )}
    </section>
  );
}
