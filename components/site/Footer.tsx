import Link from "next/link";
import Icon from "@/components/ui/Icon";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-[#f3e7d3]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <div className="flex items-center gap-2 font-serif text-lg font-bold text-ink">
            <Icon name="bowl" size={20} /> Bếp nhà Tùng
          </div>
          <p className="mt-1">
            Lưu giữ những món ngon, câu chuyện và ký ức quanh mâm cơm Việt.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://tungpham42.github.io"
            target="_blank"
            rel="noreferrer"
            className="hover:text-lacquer"
          >
            Phạm Tùng
          </a>
          <span className="text-border">•</span>
          <Link href="/privacy-policy" className="hover:text-lacquer">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
