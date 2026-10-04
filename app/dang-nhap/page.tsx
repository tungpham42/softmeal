import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/AuthForms";
export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập để chia sẻ công thức và lưu giữ món ăn Việt.",
  openGraph: {
    title: "Đăng nhập",
    description: "Đăng nhập để chia sẻ công thức và lưu giữ món ăn Việt.",
    images: [
      {
        url: "/tai-khoan.jpg",
        width: 1200,
        height: 630,
        alt: "Đăng nhập để chia sẻ công thức và lưu giữ món ăn Việt.",
      },
    ],
  },
};
export default function LoginPage() {
  return (
    <div className="py-8 sm:py-14">
      <LoginForm />
    </div>
  );
}
