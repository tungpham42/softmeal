/**
 * Client-safe helpers for Facebook video / Reel links.
 * Place this file at src/lib/facebook.ts (next to src/lib/youtube.ts).
 */

/** True for facebook.com (any subdomain such as www., m., web.) and fb.watch. */
export function isFacebookHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "facebook.com" ||
    host.endsWith(".facebook.com") ||
    host === "fb.watch"
  );
}

/**
 * Validates a Facebook video / Reel link and returns a normalized https URL,
 * or null when the input is not a recognizable Facebook video link.
 *
 * Accepted shapes:
 *  - facebook.com/reel/<id>
 *  - facebook.com/share/r/<code>, /share/v/<code>, /share/reel/<code>
 *  - facebook.com/watch/?v=<id>, facebook.com/video.php?v=<id>
 *  - facebook.com/<page>/videos/<id>
 *  - fb.watch/<code>
 */
export function extractFacebookVideoUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!isFacebookHost(url.hostname)) return null;

  const path = url.pathname.replace(/\/+$/, "");

  if (url.hostname.toLowerCase() === "fb.watch") {
    return /^\/[\w-]+$/.test(path) ? `https://fb.watch${path}` : null;
  }

  if (path === "/watch" || path === "/video.php") {
    const id = url.searchParams.get("v");
    return id && /^\d+$/.test(id)
      ? `https://www.facebook.com/watch/?v=${id}`
      : null;
  }

  if (
    /^\/reel\/[\w-]+$/.test(path) ||
    /^\/share\/(?:r|v|reel)\/[\w-]+$/.test(path) ||
    /^\/[^/]+\/videos\/(?:[^/]+\/)?\d+$/.test(path)
  ) {
    return `https://www.facebook.com${path}`;
  }

  return null;
}

/** Facebook's official video plugin iframe URL, or null when the link isn't a Facebook video. */
export function facebookEmbedUrl(input?: string | null): string | null {
  if (!input) return null;
  const normalized = extractFacebookVideoUrl(input);
  if (!normalized || normalized.startsWith("https://fb.watch")) return null;
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(normalized)}&show_text=false&width=380`;
}

/** Link to the original Facebook video for the "Reference source" box, or null. */
export function facebookSourceUrl(input?: string | null): string | null {
  return input ? extractFacebookVideoUrl(input) : null;
}
