import type { Metadata } from "next";
import AdminPanel from "@/components/recipes/AdminPanel";
export const metadata: Metadata = { title: "Quản trị" };
export default function AdminRoute() { return <AdminPanel />; }
