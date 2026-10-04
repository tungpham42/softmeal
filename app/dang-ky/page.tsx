import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/AuthForms";
export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Đăng ký để chia sẻ công thức và lưu giữ món ăn Việt.",
  openGraph: {
    title: "Đăng ký",
    description: "Đăng ký để chia sẻ công thức và lưu giữ món ăn Việt.",
    images: [
      {
        url: "/dang-ky.jpg",
        width: 1200,
        height: 630,
        alt: "Đăng ký để chia sẻ công thức và lưu giữ món ăn Việt.",
      },
    ],
  },
};
export default function RegisterPage() {
  return (
    <div className="py-8 sm:py-14">
      <RegisterForm />
    </div>
  );
}
