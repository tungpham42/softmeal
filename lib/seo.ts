import { categoryLabel, isRecipeCategory } from "@/lib/category";

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Bếp nhà Quỳnh";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const DEFAULT_TITLE = `${SITE_NAME} — Món ăn & ký ức`;
export const DEFAULT_DESCRIPTION =
  "Nền tảng chia sẻ công thức và gợi ý món ăn mang hương vị truyền thống Việt Nam.";
export const DEFAULT_OG_DESCRIPTION =
  "Lưu giữ những món ngon và câu chuyện quanh mâm cơm Việt.";

export const RECIPE_PATH = "/cong-thuc";

export const DEFAULT_OG_IMAGE = "/1200x630.jpg";
const CATEGORY_OG_EXT = "jpg"; // đổi thành "jpg" nếu ảnh trong public/category là .jpg

export function getCategoryOgImage(category: string) {
  return `/category/${category.toLowerCase()}.${CATEGORY_OG_EXT}`;
}

export function getCategoryMeta(category?: string) {
  if (!isRecipeCategory(category)) {
    return {
      isDefault: true as const,
      fullTitle: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      ogDescription: DEFAULT_OG_DESCRIPTION,
      ogImage: DEFAULT_OG_IMAGE,
    };
  }
  const label = categoryLabel(category);
  const description = `Khám phá các công thức ${label.toLowerCase()} mang hương vị truyền thống Việt Nam tại ${SITE_NAME}.`;
  return {
    isDefault: false as const,
    pageTitle: `Công thức ${label}`, // goes through the layout title template
    fullTitle: `Công thức ${label} | ${SITE_NAME}`,
    description,
    ogDescription: description,
    ogImage: getCategoryOgImage(category),
  };
}
