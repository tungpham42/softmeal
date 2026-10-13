"use client";

import { useSyncExternalStore } from "react";
import Icon from "@/components/ui/Icon";
import { isMobileOrTablet } from "@/lib/device";

function subscribeToLocation() {
  return () => {};
}

function getLocationHref() {
  return window.location.href;
}

type ShareTarget = {
  key: "facebook" | "threads" | "x" | "linkedin";
  label: string;
  /** Builds the web share-intent URL for this network. */
  href: (encodedUrl: string, encodedTitle: string) => string;
};

/** Order here is the order the buttons are rendered in. */
const SHARE_TARGETS: readonly ShareTarget[] = [
  {
    key: "facebook",
    label: "Facebook",
    href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`,
  },
  {
    key: "threads",
    label: "Threads",
    href: (u, t) => `https://www.threads.net/intent/post?text=${t}&url=${u}`,
  },
  {
    key: "x",
    label: "X",
    href: (u, t) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
  },
];

export default function ShareLinks({ title }: { title: string }) {
  const url = useSyncExternalStore(
    subscribeToLocation,
    getLocationHref,
    () => "",
  );

  if (!url) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  /**
   * On phones/tablets, try the native share sheet first (it covers Facebook,
   * Threads, etc.); otherwise open the network's web share page.
   */
  async function handleNativeShare(webShareUrl: string) {
    const shareData: ShareData = {
      title,
      text: title,
      url,
    };

    if (
      isMobileOrTablet() &&
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        if (
          typeof navigator.canShare !== "function" ||
          navigator.canShare(shareData)
        ) {
          await navigator.share(shareData);
          return;
        }
      } catch (error) {
        // User cancelled the native share sheet.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Web Share API failed:", error);
      }
    }

    // PC / Laptop or unsupported Web Share API.
    window.open(webShareUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {SHARE_TARGETS.map((target) => {
        const href = target.href(encodedUrl, encodedTitle);
        const label = `Chia sẻ ${target.label}`;

        // Facebook keeps the native share sheet on mobile/tablet.
        if (target.key === "facebook") {
          return (
            <button
              key={target.key}
              type="button"
              className={`share ${target.key}`}
              onClick={() => handleNativeShare(href)}
              aria-label={label}
            >
              <Icon name={target.key} />
            </button>
          );
        }

        return (
          <a
            key={target.key}
            className={`share ${target.key}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
          >
            <Icon name={target.key} />
          </a>
        );
      })}
    </div>
  );
}
