import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://truebid.com.au";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/verify-identity/",
          "/listings/create/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
