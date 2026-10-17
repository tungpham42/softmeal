import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Vollkorn, Lexend_Deca } from "next/font/google";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import "./globals.css";
import "@/styles/themed-select.css";
import TopAdBanner from "@/components/site/TopAdBanner";
import { ADSENSE_CLIENT_ID } from "@/lib/adsense";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import BackToTop from "@/components/site/BackToTop";
import AlpineProvider from "@/components/site/AlpineProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SITE_NAME } from "@/lib/seo";

const vollkorn = Vollkorn({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-vollkorn",
});

const lexendDeca = Lexend_Deca({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-lexend-deca",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Công thức nấu ăn & Món ngon mỗi ngày`,
    template: `%s | ${SITE_NAME}`,
  },
  description: `Nền tảng chia sẻ công thức và gợi ý món ăn mang hương vị truyền thống Việt Nam.`,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  openGraph: {
    title: {
      default: `${SITE_NAME} — Công thức nấu ăn & Món ngon mỗi ngày`,
      template: `%s | ${SITE_NAME}`,
    },
    description: "Lưu giữ những món ngon và câu chuyện quanh mâm cơm Việt.",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: SITE_NAME,
    images: [
      {
        url: "/1200x630.jpg",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Công thức nấu ăn & Món ngon mỗi ngày`,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="vi"
      className={`${vollkorn.variable} ${lexendDeca.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Script
          id="adsense-script"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        />
        <AuthProvider>
          <AlpineProvider />
          <TopAdBanner />
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
