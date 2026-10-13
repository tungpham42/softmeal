/**
 * Retailer discovery and shopping-search URL generation.
 * Pure functions only: no React state, browser APIs, or UI dependencies.
 */
export const SHOPPING_PLACES = [
  {
    name: "Bách hóa XANH",
    domain: "bachhoaxanh.com",
    website: "https://www.bachhoaxanh.com/",
  },
  {
    name: "LOTTE Mart",
    domain: "lottemart.vn",
    website: "https://www.lottemart.vn/",
  },
  {
    name: "Co.op Online",
    domain: "cooponline.vn",
    website: "https://cooponline.vn/",
  },
  {
    name: "Kingfoodmart",
    domain: "kingfoodmart.com",
    website: "https://kingfoodmart.com/",
  },
  {
    name: "AEON Mart",
    domain: "aeoneshop.com",
    website: "https://aeoneshop.com/",
  },
  {
    name: "Emart",
    domain: "emartmall.com.vn",
    website: "https://emartmall.com.vn/",
  },
  {
    name: "WinMart",
    domain: "winmart.vn",
    website: "https://winmart.vn/",
  },
  {
    name: "Ba Sạch",
    domain: "3sach.vn",
    website: "https://3sach.vn/",
  },
] as const;

/**
 * Measurement units commonly found in Vietnamese recipe ingredients.
 * Longer multi-word units come first so "muỗng canh" is removed as a whole.
 */
const INGREDIENT_UNIT_PATTERN = String.raw`(?:muỗng\s+cà\s+phê|muỗng\s+canh|muỗng\s+cafe|thìa\s+cà\s+phê|thìa\s+canh|tablespoons?|teaspoons?|tbsp|tsp|kilograms?|kilogrammes?|kg|grams?|grammes?|gam|gr|g|milligrams?|mg|millilit(?:er|re)s?|ml|lit(?:er|re)s?|lít|litre|liter|cc|ounces?|oz|pounds?|lbs?|cốc|chén|bát|ly|quả|trái|củ|cây|nhánh|tép|lát|miếng|bó|gói|bịch|hộp|chai|túi|lon|con|cái|viên|ổ|tờ|nắm|nhúm|ít|phần|chiếc|cups?)`;

/** Integer, decimal, range, fraction, mixed fraction, or common fraction glyph. */
const INGREDIENT_QUANTITY_PATTERN = String.raw`(?:\d+\s+\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?(?:\s*(?:-|–|—|đến)\s*\d+(?:[.,]\d+)?)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?|[¼½¾⅓⅔⅛⅜⅝⅞])`;

/**
 * Remove recipe quantities and measurement units from an ingredient name,
 * while keeping the ingredient keywords used for retailer and Maps searches.
 * Examples:
 *   "Bột mì 250g"          -> "Bột mì"
 *   "250 g bột mì"         -> "bột mì"
 *   "2 quả trứng gà"       -> "trứng gà"
 *   "1/2 muỗng cà phê muối" -> "muối"
 */
export function getIngredientKeyword(ingredient: string): string {
  const unit = `${INGREDIENT_UNIT_PATTERN}(?=$|\\s|[,;:.)])`;
  const quantity = INGREDIENT_QUANTITY_PATTERN;
  let keyword = ingredient.normalize("NFC").trim();

  // Remove parenthetical quantity notes such as "(250g)" or "(2 quả)".
  const parentheticalQuantity = new RegExp(
    String.raw`\([^)]*${quantity}\s*${unit}[^)]*\)`,
    "gi",
  );
  keyword = keyword.replace(parentheticalQuantity, " ");

  // Remove a quantity/unit prefix, e.g. "250 g bột mì" or "2 quả trứng".
  const prefixQuantity = new RegExp(
    String.raw`^\s*(?:(?:khoảng|tầm|chừng|about|approximately)\s*)?${quantity}\s*(?:${unit})?\s*`,
    "i",
  );
  keyword = keyword.replace(prefixQuantity, "");

  // Remove a quantity/unit suffix, e.g. "Bột mì 250g" or "Muối: 1/2 thìa cà phê".
  const suffixQuantity = new RegExp(
    String.raw`\s*(?:[:=,;\-–—]\s*)?(?:(?:khoảng|tầm|chừng|about|approximately)\s*)?${quantity}\s*${unit}\s*$`,
    "i",
  );
  keyword = keyword.replace(suffixQuantity, "");

  // Tidy punctuation left by removing quantities and measurements.
  keyword = keyword
    .replace(/\s+([,;:])/g, "$1")
    .replace(/^[\s,;:–—-]+|[\s,;:–—-]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Avoid producing an empty search if the input is an unusual ingredient.
  return keyword || ingredient.trim();
}

/**
 * Search for only the ingredient keywords within a specific retailer's website.
 * Example: "Bột mì site:bachhoaxanh.com", not "Bột mì 250g ...".
 */
export function getIngredientSearchUrl(ingredient: string, domain: string): string {
  const keyword = getIngredientKeyword(ingredient);
  const query = `${keyword} site:${domain}`;

  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Search Google Maps for nearby branches of a particular retailer.
 * Google Maps can show branch addresses and directions.
 */
export function getStoreAddressUrl(storeName: string): string {
  const query = `${storeName} gần tôi`;

  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(query)
  );
}

/**
 * Search Google Maps for traditional markets near the user.
 */
export function getMarketAddressUrl(ingredient?: string): string {
  const keyword = ingredient ? getIngredientKeyword(ingredient) : "";
  const query = keyword
    ? `chợ thực phẩm bán ${keyword} gần tôi`
    : "chợ thực phẩm gần tôi";

  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(query)
  );
}
