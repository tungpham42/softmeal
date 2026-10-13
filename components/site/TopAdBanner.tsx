"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT_ID, ADSENSE_TOP_SLOT } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Full-width, 300px-tall AdSense block rendered above the site header.
 * The adsbygoogle.js loader itself is added once in app/layout.tsx.
 */
export default function TopAdBanner() {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const el = adRef.current;
    // Guard against double-push (React StrictMode / re-mounts):
    // AdSense marks a filled slot with data-adsbygoogle-status.
    if (!el || el.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers or script load failures must never break the page.
    }
  }, []);

  return (
    <div
      className="h-[250px] w-full overflow-hidden"
      aria-label="Quảng cáo"
      role="complementary"
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "250px" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={ADSENSE_TOP_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
