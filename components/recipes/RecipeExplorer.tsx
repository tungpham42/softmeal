"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { fetchRecipes } from "@/lib/firebase/data";
import type { Recipe, SortOption } from "@/lib/types";
import { categoryLabel, RECIPE_CATEGORIES } from "@/lib/category";
import RecipeCard from "@/components/recipes/RecipeCard";
import Pagination from "@/components/ui/Pagination";
import Icon from "@/components/ui/Icon";
import { LoadingBlock } from "@/components/ui/Alert";
import { getCategoryMeta } from "@/lib/seo";
import { RECIPE_EXPLORER_RESET_EVENT } from "@/lib/recipeExplorerEvents";

const ITEMS_PER_PAGE = 12;
const LOCATION_CHANGE_EVENT = "recipe-explorer-location-change";

function setMeta(key: "name" | "property", id: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${id}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(key, id);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(LOCATION_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(LOCATION_CHANGE_EVENT, callback);
  };
}

function getLocationSearch() {
  return window.location.search;
}

function writeUrl(
  page: number,
  search: string,
  category: string,
  sort: SortOption,
) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (sort !== "alphabetAsc") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${params.toString() ? `?${params}` : ""}`,
  );
  window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
}

export default function RecipeExplorer() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const locationSearch = useSyncExternalStore(
    subscribeToLocation,
    getLocationSearch,
    () => "",
  );
  const params = new URLSearchParams(locationSearch);
  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const sort = (params.get("sort") as SortOption) || "alphabetAsc";
  const page = Math.max(1, Number(params.get("page") || 1));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchRecipes()
      .then(setRecipes)
      .catch(() => setError("Không thể tải công thức. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const meta = getCategoryMeta(category);
    const url = `${window.location.origin}/${category ? `?category=${category}` : ""}`;

    document.title = meta.fullTitle;
    setMeta("name", "description", meta.description);
    setMeta("property", "og:title", meta.fullTitle);
    setMeta("property", "og:description", meta.ogDescription);
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:title", meta.fullTitle);
    setMeta("name", "twitter:description", meta.ogDescription);
    setMeta("property", "og:image", meta.ogImage);
    setCanonical(url);
  }, [category]);

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
    writeUrl(nextPage, nextSearch, nextCategory, nextSort);
  }

  function reset() {
    writeUrl(1, "", "", "alphabetAsc");
  }

  useEffect(() => {
    const onReset = () => writeUrl(1, "", "", "alphabetAsc");
    window.addEventListener(RECIPE_EXPLORER_RESET_EVENT, onReset);
    return () =>
      window.removeEventListener(RECIPE_EXPLORER_RESET_EVENT, onReset);
  }, []);

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
              onChange={(e) => {
                const value = e.target.value;
                updateUrl(1, value, category, sort);
              }}
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
              onChange={(e) => {
                const value = e.target.value;
                updateUrl(1, search, value, sort);
              }}
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
              onChange={(e) => {
                const value = e.target.value as SortOption;
                updateUrl(1, search, category, value);
              }}
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
