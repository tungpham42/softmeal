"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Về đầu trang"
      className="fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-2xl bg-lacquer text-ivory shadow-lg transition hover:-translate-y-1 hover:bg-lacquer-dark"
    >
      <Icon name="chevron-up" size={21} />
    </button>
  );
}
