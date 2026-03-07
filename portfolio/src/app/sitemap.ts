import type { MetadataRoute } from "next";
import { demos } from "@/lib/demos";
import { points } from "@/lib/points";
import { rfcs } from "@/lib/rfcs";
import { SITE_CONFIG } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.url;

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "monthly", priority: 1.0 },
    { url: `${baseUrl}/about/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/work/`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/demos/`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/points/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/rfcs/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/creative/`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/creative/flowers/`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/creative/type-race/`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/creative/sakura/`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/colophon/`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/blob/`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy/`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/creative/fly/`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const demoPages: MetadataRoute.Sitemap = demos
    .filter((d) => d.status === "live")
    .map((demo) => ({
      url: `${baseUrl}/demos/${demo.slug}/`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  const pointPages: MetadataRoute.Sitemap = points
    .filter((p) => p.status === "live")
    .map((point) => ({
      url: `${baseUrl}/points/${point.slug}/`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  const rfcPages: MetadataRoute.Sitemap = rfcs
    .filter((r) => r.status === "live")
    .map((rfc) => ({
      url: `${baseUrl}/rfcs/${rfc.slug}/`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [...staticPages, ...demoPages, ...pointPages, ...rfcPages];
}
