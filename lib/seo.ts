import { categoryLabel, isRecipeCategory } from "@/lib/category";

export const SITE_NAME = "Bếp nhà Quỳnh";
export const DEFAULT_TITLE = "Bếp nhà Quỳnh — Món ăn & ký ức";
export const DEFAULT_DESCRIPTION =
  "Nền tảng chia sẻ công thức và gợi ý món ăn mang hương vị truyền thống Việt Nam.";
export const DEFAULT_OG_DESCRIPTION =
  "Lưu giữ những món ngon và câu chuyện quanh mâm cơm Việt.";

export function getCategoryMeta(category?: string) {
  if (!isRecipeCategory(category)) {
    return {
      isDefault: true as const,
      fullTitle: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      ogDescription: DEFAULT_OG_DESCRIPTION,
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
  };
}
