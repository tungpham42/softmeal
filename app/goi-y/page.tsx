import type { Metadata } from "next";
import WeeklySuggestions from "@/components/recipes/WeeklySuggestions";
export const metadata: Metadata = { title: "Gợi ý theo tuần", description: "Gợi ý thực đơn món Việt theo từng ngày trong tuần." };
export default function WeeklyPage() { return <WeeklySuggestions />; }
