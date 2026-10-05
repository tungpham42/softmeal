"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Image from "next/image";
import { youtubeThumbnailCandidates } from "@/lib/youtube";

type Props = {
  imageUrl?: string;
  youtubeUrl?: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Hiển thị khi không có ảnh và cũng không có video YouTube hợp lệ. */
  fallback: ReactNode;
};

function Inner({
  candidates,
  alt,
  sizes,
  priority,
  className,
  fallback,
}: Omit<Props, "imageUrl" | "youtubeUrl"> & { candidates: string[] }) {
  const [index, setIndex] = useState(0);
  const src = candidates[index];
  if (!src) return <>{fallback}</>;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      // Ảnh YouTube đã được tối ưu sẵn, không cần cấu hình remotePatterns
      unoptimized={src.startsWith("https://i.ytimg.com/")}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}

/**
 * Ảnh món ăn: ưu tiên imageUrl; nếu trống hoặc lỗi thì dùng ảnh bìa video YouTube
 * (maxres → hqdefault); cuối cùng mới hiện `fallback`.
 */
export default function RecipeImage({ imageUrl, youtubeUrl, ...rest }: Props) {
  const candidates = [
    ...(imageUrl?.trim() ? [imageUrl.trim()] : []),
    ...youtubeThumbnailCandidates(youtubeUrl),
  ].filter((src, i, all) => all.indexOf(src) === i);
  return <Inner key={candidates.join("|")} candidates={candidates} {...rest} />;
}
