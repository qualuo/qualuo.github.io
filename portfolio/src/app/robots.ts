import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/404", "/_next/"],
      },
    ],
    sitemap: "https://qualuo.github.io/sitemap.xml",
  };
}
