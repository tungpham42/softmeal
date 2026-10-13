"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT_ID, ADSENSE_TOP_SLOT } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AD_HEIGHT = 250;

/**
 * Full-width AdSense band rendered above the site header, with the ad
 * centered horizontally and vertically inside it.
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
      className="flex w-full items-center justify-center overflow-hidden text-center"
      style={{ height: AD_HEIGHT }}
      aria-label="Quảng cáo"
      role="complementary"
    >
      {/* text-center on the <ins> also centers ads that render narrower
          than the container (e.g. fixed-size units). */}
      <ins
        ref={adRef}
        className="adsbygoogle mx-auto text-center"
        style={{ display: "block", width: "100%", height: AD_HEIGHT }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={ADSENSE_TOP_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
