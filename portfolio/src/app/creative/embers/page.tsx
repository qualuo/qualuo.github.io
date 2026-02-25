import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import EmbersClient from "./EmbersClient";

export const metadata: Metadata = {
  title: "Embers",
  description:
    "A sword rests in a pile of burning embers. Watch the fire breathe, sparks spiral, and soul wisps orbit the blade.",
  alternates: { canonical: canonicalUrl("/creative/embers") },
  openGraph: {
    title: "Embers | Quang Luong",
    description:
      "A sword thrust into glowing embers. Fire breathes, sparks spiral upward, warmth in the dark.",
    url: canonicalUrl("/creative/embers"),
    images: [{ url: "/og/creative/embers.png", width: 1200, height: 630, alt: "Embers" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Embers | Quang Luong",
    description: "A sword thrust into glowing embers. Fire breathes, sparks spiral upward, warmth in the dark.",
    images: ["/og/creative/embers.png"],
  },
};

export default function EmbersPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Creative", href: "/creative/" }, { name: "Embers", href: "/creative/embers/" }]} />
      <EmbersClient />
    </>
  );
}
