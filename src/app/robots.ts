import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = BASE_URL;
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
