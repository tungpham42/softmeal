import type { Metadata } from "next";
import WeeklySuggestions from "@/components/recipes/WeeklySuggestions";
export const metadata: Metadata = {
  title: "Gợi ý món ăn theo tuần",
  description: "Gợi ý thực đơn món Việt theo từng ngày trong tuần.",
  openGraph: {
    title: "Gợi ý món ăn theo tuần",
    description: "Gợi ý thực đơn món Việt theo từng ngày trong tuần.",
    images: [
      {
        url: "/goi-y.jpg",
        width: 1200,
        height: 630,
        alt: "Gợi ý thực đơn món Việt theo từng ngày trong tuần.",
      },
    ],
  },
};
export default function WeeklyPage() {
  return <WeeklySuggestions />;
}
