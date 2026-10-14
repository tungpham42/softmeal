import {
  extractYouTubeId,
  youtubeEmbedUrl,
  youtubeThumbnailCandidates,
} from "@/lib/youtube";
import {
  extractFacebookVideoUrl,
  facebookEmbedUrl,
} from "@/lib/facebook";

export type VideoPlatform = "youtube" | "facebook";

/** Identifies supported YouTube videos and Facebook videos/Reels. */
export function getVideoPlatform(
  input?: string | null,
): VideoPlatform | null {
  const value = input?.trim();
  if (!value) return null;
  if (extractYouTubeId(value)) return "youtube";
  if (extractFacebookVideoUrl(value)) return "facebook";
  return null;
}

/**
 * Returns a canonical source URL for either platform. YouTube URLs are stored
 * as watch URLs; Facebook URLs use the normalized URL supported by facebook.ts.
 */
export function normalizeVideoUrl(input?: string | null): string | null {
  const value = input?.trim();
  const platform = getVideoPlatform(value);
  if (!value || !platform) return null;

  if (platform === "youtube") {
    const id = extractYouTubeId(value);
    return id ? `https://www.youtube.com/watch?v=${id}` : null;
  }

  return extractFacebookVideoUrl(value);
}

/** Returns an embeddable player URL, or null when the platform cannot embed it. */
export function videoEmbedUrl(input?: string | null): string | null {
  const normalized = normalizeVideoUrl(input);
  if (!normalized) return null;

  return getVideoPlatform(normalized) === "youtube"
    ? youtubeEmbedUrl(normalized)
    : facebookEmbedUrl(normalized);
}

/** Candidate cover images supported by the source URL (currently YouTube). */
export function videoThumbnailCandidates(input?: string | null): string[] {
  return youtubeThumbnailCandidates(input);
}
