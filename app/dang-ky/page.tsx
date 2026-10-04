import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/AuthForms";
export const metadata: Metadata = { title: "Đăng ký" };
export default function RegisterPage() {
  return (
    <div className="py-8 sm:py-14">
      <RegisterForm />
    </div>
  );
}
