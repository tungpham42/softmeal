import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/AuthForms";
export const metadata: Metadata = { title: "Đăng nhập" };
export default function LoginPage() { return <div className="py-8 sm:py-14"><LoginForm /></div>; }
