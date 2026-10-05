import type { MetadataRoute } from "next";

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/quan-tri",
        "/ho-so",
        "/them",
        "/sua-cong-thuc/",
        "/dang-nhap",
        "/dang-ky",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
