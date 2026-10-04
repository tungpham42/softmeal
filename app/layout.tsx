import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import "./globals.css";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import BackToTop from "@/components/site/BackToTop";
import AlpineProvider from "@/components/site/AlpineProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: { default: "Bếp Việt — Món ăn & ký ức", template: "%s | Bếp Việt" },
  description:
    "Nền tảng chia sẻ công thức và gợi ý món ăn mang hương vị truyền thống Việt Nam.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  openGraph: {
    title: "Bếp Việt — Món ăn & ký ức",
    description: "Lưu giữ những món ngon và câu chuyện quanh mâm cơm Việt.",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "Bếp Việt",
    images: [
      {
        url: "/1200x630.jpg",
        width: 1200,
        height: 630,
        alt: "Bếp Việt — Món ăn & ký ức",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <AlpineProvider />
          <Header />
          <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
          <BackToTop />
        </AuthProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        )}
      </body>
    </html>
  );
}
