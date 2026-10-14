"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Image from "next/image";
import { videoThumbnailCandidates } from "@/lib/video";

type Props = {
  imageUrl?: string;
  videoUrl?: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Displayed when there is no image and no supported video thumbnail. */
  fallback: ReactNode;
};

function Inner({
  candidates,
  alt,
  sizes,
  priority,
  className,
  fallback,
}: Omit<Props, "imageUrl" | "videoUrl"> & { candidates: string[] }) {
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
      // YouTube thumbnails are already optimized; no remotePatterns are needed.
      unoptimized={src.startsWith("https://i.ytimg.com/")}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}

/**
 * Recipe image priority: imageUrl first, then any supported source-video
 * thumbnail candidates, then the fallback. Facebook preview images are saved
 * to imageUrl when available; YouTube thumbnails are derived from videoUrl.
 */
export default function RecipeImage({ imageUrl, videoUrl, ...rest }: Props) {
  const candidates = [
    ...(imageUrl?.trim() ? [imageUrl.trim()] : []),
    ...videoThumbnailCandidates(videoUrl),
  ].filter((src, i, all) => all.indexOf(src) === i);
  return <Inner key={candidates.join("|")} candidates={candidates} {...rest} />;
}
