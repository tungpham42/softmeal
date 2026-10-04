import Link from "next/link";
import type { IconName } from "@/components/ui/Icon";
import RecipeExplorer from "@/components/recipes/RecipeExplorer";
import Icon from "@/components/ui/Icon";

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
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/goi-y" className="btn-gold">
              <Icon name="calendar" size={17} /> Lên thực đơn tuần
            </Link>
            <Link href="/them" className="btn-outline-dark">
              <Icon name="plus" size={17} /> Chia sẻ món nhà
            </Link>
          </div>
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
            "Bốc thực đơn sáng — trưa — tối — tráng miệng theo sở thích.",
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
