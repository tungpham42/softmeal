"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Icon from "@/components/ui/Icon";
import { isMobileOrTablet } from "@/lib/device";

// The device type never changes during a session, so there is nothing to subscribe to.
const subscribeNoop = () => () => {};

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  // false on the server and during hydration, then the real value on the client
  const isMobile = useSyncExternalStore(
    subscribeNoop,
    isMobileOrTablet,
    () => false,
  );

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
      className="fixed right-5 z-40 grid size-12 place-items-center rounded-2xl bg-lacquer text-ivory shadow-lg transition hover:-translate-y-1 hover:bg-lacquer-dark"
      style={{
        // On mobile/tablet, sit above the fixed bottom search bar (~5rem tall)
        bottom: isMobile
          ? "calc(5.5rem + env(safe-area-inset-bottom, 0px))"
          : "1.25rem",
      }}
    >
      <Icon name="chevron-up" size={21} />
    </button>
  );
}
