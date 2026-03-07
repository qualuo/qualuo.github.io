import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import FlyClient from "./FlyClient";

export const metadata: Metadata = {
  title: "Celestial Glider",
  description:
    "Guide a glowing spirit bird through procedurally generated skies. Collect light orbs, drift past floating islands, and watch the sky shift from dawn to midnight.",
  alternates: { canonical: canonicalUrl("/creative/fly") },
  openGraph: {
    title: "Celestial Glider | Quang Luong",
    description:
      "A chill, ambient flying experience through procedural skies with floating islands, light orbs, and a day-to-night color cycle.",
    url: canonicalUrl("/creative/fly"),
    images: [{ url: "/og/creative/fly.png", width: 1200, height: 630, alt: "Celestial Glider" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Celestial Glider | Quang Luong",
    description:
      "A chill, ambient flying experience through procedural skies with floating islands, light orbs, and a day-to-night color cycle.",
    images: ["/og/creative/fly.png"],
  },
};

export default function FlyPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Creative", href: "/creative/" },
          { name: "Celestial Glider", href: "/creative/fly/" },
        ]}
      />
      <FlyClient />
    </>
  );
}
