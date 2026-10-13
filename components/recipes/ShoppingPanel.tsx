"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import {
  SHOPPING_PLACES,
  getIngredientKeyword,
  getIngredientSearchUrl,
  getStoreAddressUrl,
  getMarketAddressUrl,
} from "@/lib/recipes/shopping";

/**
 * Shopping, with the fewest possible steps:
 *  - pick a retailer ONCE for the whole recipe,
 *  - every ingredient then has a single direct link to that retailer,
 *  - one button copies the whole shopping list.
 * (Previously: open a modal per ingredient -> pick a retailer -> open a
 * Google search in a new tab.)
 */
export default function ShoppingPanel({
  ingredients,
}: {
  ingredients: string[];
}) {
  const [placeIndex, setPlaceIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const place = SHOPPING_PLACES[placeIndex];

  const keywords = useMemo(
    () => ingredients.map((item) => getIngredientKeyword(item)),
    [ingredients],
  );

  async function copyList() {
    try {
      await navigator.clipboard.writeText(
        ingredients.map((item) => `- ${item}`).join("\n"),
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context / denied): ignore silently.
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted">Mua tại:</span>

        {SHOPPING_PLACES.map((item, index) => (
          <button
            key={item.name}
            type="button"
            aria-pressed={index === placeIndex}
            onClick={() => setPlaceIndex(index)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lacquer ${
              index === placeIndex
                ? "border-lacquer bg-lacquer text-white"
                : "border-border bg-cream/60 text-ink hover:bg-cream"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
        <a
          href={getStoreAddressUrl(place.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-bamboo underline underline-offset-4"
        >
          <Icon name="map-pin" size={13} />
          Cửa hàng {place.name} gần bạn
        </a>

        <a
          href={getMarketAddressUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-bamboo underline underline-offset-4"
        >
          <Icon name="map-pin" size={13} />
          Chợ gần bạn
        </a>

        <button
          type="button"
          onClick={copyList}
          className="inline-flex items-center gap-1 text-lacquer underline underline-offset-4"
        >
          {copied ? "Đã sao chép danh sách" : "Sao chép danh sách đi chợ"}
        </button>
      </div>

      <ul className="mt-2 divide-y divide-dashed divide-border">
        {ingredients.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-center justify-between gap-3 py-2 text-sm"
          >
            <span className="text-ink">{item}</span>

            <a
              href={getIngredientSearchUrl(keywords[index], place.domain)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Tìm ${keywords[index]} tại ${place.name}`}
              className="shrink-0 rounded-lg border border-border bg-cream/50 px-2.5 py-1 text-xs font-bold text-lacquer transition hover:bg-cream"
            >
              Xem giá
            </a>
          </li>
        ))}
      </ul>

      <p className="pt-2 text-xs leading-5 text-muted">
        Giá bán, tồn kho và địa chỉ thực tế cần được xác nhận trên website hoặc
        bản đồ.
      </p>
    </div>
  );
}
