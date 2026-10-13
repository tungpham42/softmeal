const RECENT_COMMENT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export function formatCommentDate(createdAt: unknown) {
  if (!createdAt) return "";

  let date: Date;

  if (createdAt instanceof Date) {
    date = createdAt;
  } else if (
    typeof createdAt === "object" &&
    createdAt !== null &&
    "toDate" in createdAt &&
    typeof createdAt.toDate === "function"
  ) {
    date = createdAt.toDate();
  } else if (
    typeof createdAt === "object" &&
    createdAt !== null &&
    "seconds" in createdAt
  ) {
    const seconds = Number(createdAt.seconds);
    const nanoseconds =
      "nanoseconds" in createdAt ? Number(createdAt.nanoseconds) : 0;

    date = new Date(seconds * 1000 + nanoseconds / 1_000_000);
  } else {
    date = new Date(createdAt as string | number);
  }

  if (Number.isNaN(date.getTime())) return "";

  const elapsedMs = Date.now() - date.getTime();

  if (elapsedMs >= 0 && elapsedMs < RECENT_COMMENT_THRESHOLD_MS) {
    const elapsedMinutes = Math.floor(elapsedMs / 60_000);

    if (elapsedMinutes < 1) {
      return "vừa xong";
    }

    if (elapsedMinutes < 60) {
      return `${elapsedMinutes} phút trước`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);

    if (elapsedHours < 24) {
      return `${elapsedHours} giờ trước`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);

    return `${elapsedDays} ngày trước`;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
