/** Accept only HTTPS links on YouTube domains. */
export function getYouTubeSourceUrl(url?: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    const isYouTubeDomain =
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtu.be" ||
      hostname.endsWith(".youtu.be");

    if (parsed.protocol !== "https:" || !isYouTubeDomain) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
