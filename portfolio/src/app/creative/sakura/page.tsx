import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import SakuraClient from "./SakuraClient";

export const metadata: Metadata = {
  title: "Sakura",
  description:
    "A cherry blossom tree simulation. Watch petals fall in the wind, and feel the transient beauty of spring.",
  alternates: { canonical: canonicalUrl("/creative/sakura") },
  openGraph: {
    title: "Sakura | Quang Luong",
    description:
      "A cherry blossom tree simulation. Petals fall, wind whispers, spring blooms.",
    url: canonicalUrl("/creative/sakura"),
    images: [{ url: "/og/creative/sakura.png", width: 1200, height: 630, alt: "Sakura" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sakura | Quang Luong",
    description: "A cherry blossom tree simulation. Petals fall, wind whispers, spring blooms.",
    images: ["/og/creative/sakura.png"],
  },
};

export default function SakuraPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Creative", href: "/creative/" }, { name: "Sakura", href: "/creative/sakura/" }]} />
      <SakuraClient />
    </>
  );
}
