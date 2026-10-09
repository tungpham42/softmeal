import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "home"
  | "bowl"
  | "calendar"
  | "book"
  | "user"
  | "plus"
  | "settings"
  | "login"
  | "user-plus"
  | "logout"
  | "search"
  | "eye"
  | "refresh"
  | "chevron-up"
  | "chevron-left"
  | "chevron-right"
  | "tag"
  | "share"
  | "trash"
  | "edit"
  | "comment"
  | "comment-off"
  | "lock"
  | "mail"
  | "image"
  | "list"
  | "route"
  | "youtube"
  | "facebook"
  | "x"
  | "pinterest"
  | "linkedin"
  | "check"
  | "copy"
  | "menu"
  | "close"
  | "phone"
  | "map-pin"
  | "send"
  | "heart";

const paths: Record<IconName, ReactNode> = {
  home: <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  bowl: (
    <>
      <path d="M4 9h16a6 6 0 0 1-12 0" />
      <path d="M7 15h10M9 19h6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </>
  ),
  book: (
    <>
      <path d="M4 4a3 3 0 0 1 3-1h12v17H7a3 3 0 0 0-3 1z" />
      <path d="M4 4v17M9 7h7" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  settings: (
    <>
      <path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
  login: (
    <>
      <path d="M10 17l5-5-5-5M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
    </>
  ),
  "user-plus": (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M3 21a6 6 0 0 1 12 0M19 8v6M16 11h6" />
    </>
  ),
  logout: (
    <>
      <path d="M14 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-3" />
      <path d="M10 12h11M18 9l3 3-3 3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14-4L3 10" />
      <path d="M3 5v5h5M4 13a8 8 0 0 0 14 4l3-3" />
      <path d="M21 19v-5h-5" />
    </>
  ),
  "chevron-up": <path d="m18 15-6-6-6 6" />,
  "chevron-left": <path d="m15 18-6-6 6-6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  tag: (
    <>
      <path d="M20 13 13 20 4 11V4h7z" />
      <circle cx="8" cy="8" r="1.2" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.7 6.8-4M8.6 13.3l6.8 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
    </>
  ),
  comment: (
    <>
      <path d="M4 5h16v11H8l-4 4z" />
    </>
  ),
  "comment-off": (
    <>
      <path d="M5 5h15v10H9l-4 4zM3 3l18 18" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="9" r="1.5" />
      <path d="m4 17 5-5 4 4 3-3 5 5" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8.5 18c4 0 1-4 5-4s1-8 4-8" />
    </>
  ),
  youtube: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="4" />
      <path d="m10 9 5 3-5 3z" />
    </>
  ),
  facebook: (
    <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9c0-.7.3-1 1-1z" />
  ),
  x: <path d="M5 4h3l4 5 4-5h3l-5.5 6.5L19 20h-3l-4-5.5L7.5 20h-3l6-7z" />,
  pinterest: (
    <path d="M12 3c-5 0-8 3.4-8 7.8 0 3.3 1.9 5.7 4.6 5.7 1 0 1.3-.7 1.5-1.5l.8-3.1s-.4-.9-.4-1.7c0-1.6.9-2.8 2.1-2.8 1 0 1.7.7 1.7 1.7 0 1-.6 2.5-.9 3.9-.3 1.2.6 2.1 1.8 2.1 2.2 0 3.9-2.3 3.9-5.6 0-2.9-2.1-4.9-5.2-4.9-3.5 0-5.6 2.6-5.6 5.4 0 1.1.4 2.3 1 3.1.1.1.1.2.1.4l-.3 1.3c-.1.4-.3.5-.6.3-1.9-.9-3-3-3-5.4C5.5 7.6 8.5 4 13 4c3.7 0 6.6 2.6 6.6 6.1 0 3.7-2.3 6.6-5.5 6.6-1.1 0-2.2-.6-2.6-1.3l-.7 2.7c-.3 1.1-1 2.5-1.5 3.3.8.2 1.6.3 2.5.3 5 0 9-3.8 9-9S17 3 12 3z" />
  ),
  linkedin: (
    <path d="M5 7H2v14h3V7zm0-4H2v3h3V3zM10 7H7v14h3v-7c0-2 1-4 3.5-4s3.5 2 3.5 4v7h3v-8c0-4-2-6-5.5-6-2 0-3.5 1.1-4 2.2z" />
  ),
  check: <path d="m5 12 4 4L19 6" />,
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6 6 18" />
    </>
  ),
  phone: (
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  ),
  "map-pin": (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  send: <path d="M21 3 3 10l7 3 3 7zM10 13l11-10" />,
  heart: (
    <path d="M12 20s-8-4.6-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.4 12 20 12 20z" />
  ),
};

export default function Icon({
  name,
  size = 18,
  strokeWidth = 1.9,
  className = "",
  ...rest
}: SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
