import { SITE_NAME } from "@/lib/seo";

/**
 * Contact details shown on /lien-he.
 * Every field is optional: empty values are simply not rendered.
 * Configure via .env (see .env.example).
 */
const clean = (value?: string) => value?.trim() || "";

export const CONTACT = {
  name: SITE_NAME,
  email:
    clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL) ||
    clean(process.env.NEXT_PUBLIC_ADMIN_EMAIL),
  phone: clean(process.env.NEXT_PUBLIC_CONTACT_PHONE),
  address: clean(process.env.NEXT_PUBLIC_CONTACT_ADDRESS),
  hours:
    clean(process.env.NEXT_PUBLIC_CONTACT_HOURS) ||
    "Thứ Hai – Thứ Bảy, 08:00 – 18:00",
  facebook: clean(process.env.NEXT_PUBLIC_CONTACT_FACEBOOK),
  youtube: clean(process.env.NEXT_PUBLIC_CONTACT_YOUTUBE),
  website: "https://soft.io.vn",
};

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d]/g, "")}`;
}
