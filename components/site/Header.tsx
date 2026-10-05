"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import Icon from "@/components/ui/Icon";

const navItems = [
  ["/", "Trang chủ", "home"],
  ["/goi-y", "Gợi ý theo tuần", "calendar"],
  ["/huong-dan", "Hướng dẫn", "book"],
] as const;

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAdmin, loading } = useAuth();
  const alpine = { "x-data": "{ open: false, account: false }" } as const;
  const closeMobile = { "x-on:click": "open = false" } as const;

  async function logout() {
    await signOut(auth);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-lacquer/15 bg-lacquer text-ivory shadow-[0_6px_24px_rgba(85,31,18,0.16)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" {...alpine}>
        <div className="flex min-h-18 items-center justify-between gap-4 py-3">
          <Link
            href="/"
            className="group flex items-center gap-3 text-ivory"
            aria-label="Bếp nhà Quỳnh - Trang chủ"
          >
            <span className="grid size-11 place-items-center rounded-2xl border border-gold/45 bg-ivory/10 shadow-inner">
              <Icon name="bowl" size={25} />
            </span>
            <span>
              <span className="block font-serif text-xl font-bold tracking-tight sm:text-2xl">
                Bếp nhà Quỳnh
              </span>
              <span className="hidden text-[11px] uppercase tracking-[0.2em] text-gold/90 sm:block">
                Món ăn & ký ức
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Điều hướng chính"
          >
            {navItems.map(([href, label, icon]) => (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  pathname === href
                    ? "bg-ivory text-lacquer"
                    : "text-ivory/90 hover:bg-ivory/10 hover:text-ivory"
                }`}
              >
                <Icon name={icon} size={17} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {loading ? (
              <span className="h-10 w-28 animate-pulse rounded-xl bg-ivory/10" />
            ) : currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  {...({ "x-on:click": "account = !account" } as const)}
                  className="inline-flex items-center gap-2 rounded-xl border border-ivory/20 bg-ivory/10 px-3 py-2 text-sm font-semibold text-ivory hover:bg-ivory/15"
                >
                  <Icon name="user" size={16} />
                  {currentUser.displayName || "Người dùng"}
                  <span className="text-gold">⌄</span>
                </button>
                <div
                  {...({ "x-show": "account", "x-cloak": "" } as const)}
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-cream p-2 text-ink shadow-xl"
                >
                  <Link href="/ho-so" className="menu-link">
                    <Icon name="user" size={16} /> Hồ sơ
                  </Link>
                  <Link href="/them" className="menu-link">
                    <Icon name="plus" size={16} /> Thêm công thức
                  </Link>
                  {isAdmin && (
                    <Link href="/quan-tri" className="menu-link">
                      <Icon name="settings" size={16} /> Quản trị
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="menu-link w-full text-left"
                  >
                    <Icon name="logout" size={16} /> Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/dang-nhap"
                  className="inline-flex items-center gap-2 rounded-xl border border-ivory/25 px-3 py-2 text-sm font-semibold text-ivory hover:bg-ivory/10"
                >
                  <Icon name="login" size={16} /> Đăng nhập
                </Link>
                <Link
                  href="/dang-ky"
                  className="inline-flex items-center gap-2 rounded-xl bg-gold px-3 py-2 text-sm font-extrabold text-lacquer shadow-sm hover:bg-gold-light"
                >
                  <Icon name="user-plus" size={16} /> Đăng ký
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label="Mở menu"
            {...({ "x-on:click": "open = !open" } as const)}
            className="inline-grid size-11 place-items-center rounded-xl border border-ivory/20 bg-ivory/10 text-ivory lg:hidden"
          >
            <span {...({ "x-show": "!open" } as const)}>
              <Icon name="menu" size={22} />
            </span>
            <span {...({ "x-show": "open", "x-cloak": "" } as const)}>
              <Icon name="close" size={22} />
            </span>
          </button>
        </div>

        <div
          {...({ "x-show": "open", "x-cloak": "" } as const)}
          className="border-t border-ivory/10 py-3 lg:hidden"
        >
          <nav className="grid gap-1" aria-label="Điều hướng di động">
            {navItems.map(([href, label, icon]) => (
              <Link
                key={href}
                href={href}
                {...closeMobile}
                className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-ivory/90 hover:bg-ivory/10"
              >
                <Icon name={icon} size={18} /> {label}
              </Link>
            ))}
            {loading ? null : currentUser ? (
              <>
                <Link
                  href="/ho-so"
                  {...closeMobile}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-ivory/90 hover:bg-ivory/10"
                >
                  <Icon name="user" size={18} /> Hồ sơ
                </Link>
                <Link
                  href="/them"
                  {...closeMobile}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-ivory/90 hover:bg-ivory/10"
                >
                  <Icon name="plus" size={18} /> Thêm công thức
                </Link>
                {isAdmin && (
                  <Link
                    href="/quan-tri"
                    {...closeMobile}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-ivory/90 hover:bg-ivory/10"
                  >
                    <Icon name="settings" size={18} /> Quản trị
                  </Link>
                )}
                <button
                  onClick={() => void logout()}
                  {...closeMobile}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-ivory/90 hover:bg-ivory/10"
                >
                  <Icon name="logout" size={18} /> Đăng xuất
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  href="/dang-nhap"
                  {...closeMobile}
                  className="btn-outline-dark"
                >
                  <Icon name="login" size={17} /> Đăng nhập
                </Link>
                <Link href="/dang-ky" {...closeMobile} className="btn-gold">
                  <Icon name="user-plus" size={17} /> Đăng ký
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
