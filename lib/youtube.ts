const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;
const THUMB_HOST = "https://i.ytimg.com/vi";

/** Lấy video ID từ các dạng link YouTube phổ biến (watch, youtu.be, embed, shorts, live). */
export function extractYouTubeId(rawUrl?: string | null): string | null {
  const value = rawUrl?.trim();
  if (!value) return null;
  try {
    const url = new URL(
      /^https?:\/\//i.test(value) ? value : `https://${value}`,
    );
    const host = url.hostname.replace(/^(www|m|music)\./, "");
    let id: string | null = null;
    if (host === "youtu.be") {
      id = url.pathname.split("/")[1] ?? null;
    } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else {
        const [, kind, videoId] = url.pathname.split("/");
        if (["embed", "shorts", "live", "v"].includes(kind))
          id = videoId ?? null;
      }
    }
    return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function youtubeEmbedUrl(rawUrl?: string | null): string | null {
  const id = extractYouTubeId(rawUrl);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

/** Ảnh bìa chất lượng cao nhất (có thể 404 với một số video) và ảnh dự phòng luôn tồn tại. */
export function youtubeThumbnailCandidates(rawUrl?: string | null): string[] {
  const id = extractYouTubeId(rawUrl);
  return id
    ? [`${THUMB_HOST}/${id}/maxresdefault.jpg`, `${THUMB_HOST}/${id}/hqdefault.jpg`]
    : [];
}

/** Dùng trong form: kiểm tra trước xem video có maxres không, nếu không thì dùng hqdefault. */
export function resolveYouTubeThumbnail(videoId: string): Promise<string> {
  const base = `${THUMB_HOST}/${videoId}`;
  const fallback = `${base}/hqdefault.jpg`;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () =>
      // YouTube trả ảnh placeholder 120x90 khi không có maxres
      resolve(img.naturalWidth > 120 ? `${base}/maxresdefault.jpg` : fallback);
    img.onerror = () => resolve(fallback);
    img.src = `${base}/maxresdefault.jpg`;
  });
}
