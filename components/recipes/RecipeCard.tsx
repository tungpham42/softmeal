import Link from "next/link";
import Image from "next/image";
import type { Recipe } from "@/lib/types";
import { categoryAccent, categoryLabel } from "@/lib/category";
import Icon from "@/components/ui/Icon";

export default function RecipeCard({
  recipe,
  admin = false,
  onDelete,
}: {
  recipe: Recipe;
  admin?: boolean;
  onDelete?: () => void;
}) {
  const accent =
    categoryAccent[recipe.category] ?? "bg-gold text-lacquer border-white/70";
  return (
    <article className="group overflow-hidden rounded-3xl border border-border bg-card shadow-[0_12px_36px_rgba(87,45,24,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(87,45,24,0.14)]">
      <Link href={`/cong-thuc/${recipe.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-gold/20 via-cream to-bamboo/10">
          {recipe.imageUrl ? (
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-lacquer/30">
              <Icon name="bowl" size={58} strokeWidth={1.3} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
          <span
            className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide shadow-lg shadow-black/25 ${accent}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            {categoryLabel(recipe.category)}
          </span>
        </div>
      </Link>
      <div className="flex min-h-56 flex-col p-5">
        <Link
          href={`/cong-thuc/${recipe.slug}`}
          className="font-serif text-2xl font-bold leading-tight text-lacquer transition hover:text-turmeric-700"
        >
          {recipe.title}
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
          {recipe.description}
        </p>
        <div className="mt-auto pt-5 flex items-center justify-between gap-3">
          <Link href={`/cong-thuc/${recipe.slug}`} className="btn-primary">
            <Icon name="eye" size={16} /> Xem công thức
          </Link>
          {admin && (
            <div className="flex gap-2">
              <Link
                href={`/sua-cong-thuc/${recipe.slug}`}
                className="icon-button"
                aria-label="Chỉnh sửa"
              >
                <Icon name="edit" />
              </Link>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="icon-button icon-button-danger"
                  aria-label="Xóa"
                >
                  <Icon name="trash" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
