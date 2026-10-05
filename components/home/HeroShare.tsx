"use client";

import { useSyncExternalStore } from "react";

type BrandName = "facebook" | "x" | "linkedin";

function BrandMark({ name }: { name: BrandName }) {
  if (name === "facebook") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-4 fill-current"
      >
        <path d="M13.7 21v-7.2h2.4l.4-2.8h-2.8V9.2c0-.8.2-1.4 1.4-1.4h1.5V5.3c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8.2v2.8h2.5V21h3Z" />
      </svg>
    );
  }

  if (name === "linkedin") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-4 fill-current"
      >
        <path d="M6.2 8.1A1.9 1.9 0 1 0 6.2 4.3a1.9 1.9 0 0 0 0 3.8ZM4.5 19.7h3.4V9.8H4.5v9.9ZM9.8 9.8v9.9h3.4v-5.1c0-1.3.2-2.6 1.9-2.6 1.7 0 1.7 1.5 1.7 2.7v5h3.4v-5.7c0-2.8-.6-5-4-5-1.6 0-2.7.9-3.2 1.7h-.1V9.8H9.8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M18.7 4h2.5l-5.5 6.3 6.5 9.7h-5.1l-4-5.9-5.1 5.9H5.5l5.9-6.7L5.2 4h5.2l3.6 5.3L18.7 4Zm-.9 14.3h1.4L9.8 5.6H8.3l9.5 12.7Z" />
    </svg>
  );
}

const shareLinkClass =
  "group inline-flex items-center gap-2 rounded-full border border-ivory/15 bg-ivory/10 px-3.5 py-2 text-xs font-extrabold text-ivory transition duration-200 hover:-translate-y-0.5 hover:border-gold/55 hover:bg-ivory/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light/70";

const shareOptions: Array<{
  name: BrandName;
  displayName: string;
  label: string;
  accent: string;
}> = [
  {
    name: "facebook",
    displayName: "Facebook",
    label: "Rủ hội bạn",
    accent: "😋",
  },
  {
    name: "x",
    displayName: "X",
    label: "Kể chuyện món này",
    accent: "✦",
  },
  {
    name: "linkedin",
    displayName: "LinkedIn",
    label: "Lan tỏa cảm hứng",
    accent: "↗",
  },
];

const shareMessages: Record<BrandName, string> = {
  facebook:
    "🔥 TÌNH CỜ LƯỚT THẤY MÀ THẤY ĐÓI NGANG 😋\\n\\nCó những món ăn không chỉ ngon — mà còn kéo cả ký ức gia đình quay về. ❤️\\n\\nMình vừa tìm thấy một món rất đáng để lưu lại cho mâm cơm tuần này. Ai mê món Việt, tag người hay rủ bạn vào bếp cùng! 👇",
  x: "🔥 Không biết tối nay ăn gì? Đây là tín hiệu bạn đang tìm một món Việt thật cuốn 😋\\n\\nNgon, dễ làm, đậm vị nhà — kiểu món nhìn một lần là muốn vào bếp ngay. 👇",
  linkedin:
    "🍲 Có những món ăn không chỉ tạo nên một bữa cơm, mà còn tạo nên những câu chuyện để nhớ.\\n\\nMình vừa khám phá một công thức mang đúng tinh thần đó: gần gũi, dễ áp dụng và đậm chất Việt. Một chút cảm hứng cho căn bếp và cho những bữa cơm có ý nghĩa. ✨\\n\\nRất đáng để lưu lại và chia sẻ cùng những người cũng yêu ẩm thực Việt.",
};

export default function HeroShare() {
  const shareUrl = useSyncExternalStore(
    (callback) => {
      window.addEventListener("popstate", callback);
      window.addEventListener("hashchange", callback);
      return () => {
        window.removeEventListener("popstate", callback);
        window.removeEventListener("hashchange", callback);
      };
    },
    () => window.location.href,
    () => "",
  );

  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = {
    facebook: shareUrl
      ? `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
      : "#",
    x: shareUrl
      ? `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(
          `${shareMessages.x}\\n\\n${shareUrl}`,
        )}`
      : "#",
    linkedin: shareUrl
      ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
      : "#",
  };

  return (
    <div className="mt-7">
      <p className="text-sm font-extrabold text-gold-light sm:text-base">
        🔥 Thấy ngon? Đừng giữ một mình!
      </p>
      <p className="mt-1 text-xs leading-5 text-ivory/65 sm:text-sm">
        Một cú chạm để món nhà lên sóng — rủ bạn bè vào bếp và lan tỏa cảm hứng.
      </p>

      <div className="mt-3 flex flex-wrap gap-2" aria-label="Chia sẻ trang này">
        {shareOptions.map(({ name, displayName, label, accent }) => (
          <a
            key={name}
            href={shareLinks[name]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} trên ${displayName}`}
            data-share-message={shareMessages[name]}
            onClick={(event) => {
              if (!shareUrl) event.preventDefault();
            }}
            className={shareLinkClass}
          >
            <span aria-hidden="true" className="text-sm">
              {accent}
            </span>
            <BrandMark name={name} />
            <span>{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
