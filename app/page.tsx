import type { Metadata } from "next";
import Link from "next/link";
import type { IconName } from "@/components/ui/Icon";
import RecipeExplorer from "@/components/recipes/RecipeExplorer";
import Icon from "@/components/ui/Icon";
import HeroShare from "@/components/home/HeroShare";
import { getCategoryMeta, SITE_NAME } from "@/lib/seo";

type HomeProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  searchParams,
}: HomeProps): Promise<Metadata> {
  const { category } = await searchParams;
  const value = Array.isArray(category) ? category[0] : category;
  const meta = getCategoryMeta(value);
  if (meta.isDefault) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    title: { absolute: meta.fullTitle },
    description: meta.description,
    alternates: { canonical: `/?category=${value}` },
    openGraph: {
      title: meta.fullTitle,
      description: meta.ogDescription,
      type: "website",
      url: `${siteUrl}/?category=${value}`,
      siteName: SITE_NAME,
      images: [
        { url: meta.ogImage, width: 1200, height: 630, alt: meta.fullTitle },
      ],
    },
  };
}

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="hero-paper relative overflow-hidden rounded-[2rem] px-6 py-12 text-ivory shadow-[0_22px_65px_rgba(125,36,24,0.18)] sm:px-10 sm:py-16">
        <div className="absolute -right-20 -top-20 size-72 rounded-full border border-gold/20 bg-gold/5" />
        <div className="absolute -bottom-20 -left-16 size-64 rounded-full border border-ivory/10 bg-ivory/5" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-ivory/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-gold-light">
            <Icon name="bowl" size={15} /> Hương vị Việt
          </span>
          <h1 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-6xl">
            Mỗi món ăn là một câu chuyện của gia đình.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-ivory/80 sm:text-lg">
            Khám phá công thức, tìm ý tưởng cho mâm cơm trong tuần và chia sẻ
            những món ngon đã gắn với căn bếp của bạn.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Button 1: Gold / Weekly Menu — Warm Golden Shimmer */}
            <Link
              href="/goi-y"
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-b from-gold-light via-gold to-gold py-3.5 pl-7 pr-3.5 text-base font-extrabold text-lacquer shadow-[0_0_0_1px_rgba(255,255,255,0.35)_inset,0_10px_30px_-6px_rgba(240,190,80,0.65)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.5)_inset,0_16px_40px_-6px_rgba(240,190,80,0.85)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-light/60 active:translate-y-0 active:scale-[0.98]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/4 w-1/4 skew-x-6 bg-amber-100/60 blur-md motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:translate-x-[450%]"
              />
              <span className="relative">Lên thực đơn tuần</span>
              <span className="relative grid size-9 place-items-center rounded-full bg-lacquer text-gold-light transition duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Icon name="calendar" size={18} />
              </span>
            </Link>

            {/* Button 2: Ivory / Share Recipe — Soft Pearl Shimmer */}
            <Link
              href="/them"
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full border-2 border-ivory/60 bg-ivory/10 py-3.5 pl-7 pr-3.5 text-base font-extrabold text-ivory shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-ivory hover:bg-ivory hover:text-lacquer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ivory/50 active:translate-y-0 active:scale-[0.98]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -right-1/4 w-1/4 -skew-x-6 bg-white/70 blur-md motion-safe:transition-transform motion-safe:duration-850 motion-safe:group-hover:translate-x-[-450%]"
              />
              <span>Chia sẻ món nhà</span>
              <span className="grid size-9 place-items-center rounded-full bg-gold text-lacquer transition duration-300 group-hover:rotate-90 group-hover:bg-lacquer group-hover:text-gold-light">
                <Icon name="plus" size={18} />
              </span>
            </Link>
          </div>
          <HeroShare />
        </div>
      </section>
      <RecipeExplorer />
      <section className="grid gap-4 md:grid-cols-3">
        {[
          [
            "Bếp gia đình",
            "Món quen mỗi ngày, nguyên liệu dễ tìm và cách làm dễ theo.",
            "bowl",
          ],
          [
            "Gợi ý cả tuần",
            "Bốc thực đơn sáng — trưa — tối — tráng miệng - món chay - món dưỡng sinh theo sở thích.",
            "calendar",
          ],
          [
            "Chia sẻ & lưu giữ",
            "Đăng công thức và để lại câu chuyện phía sau món ăn.",
            "book",
          ],
        ].map(([title, text, icon]) => (
          <div
            key={title}
            className="rounded-3xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-gold/15 text-lacquer">
              <Icon name={icon as IconName} size={22} />
            </div>
            <h2 className="font-serif text-xl font-bold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
