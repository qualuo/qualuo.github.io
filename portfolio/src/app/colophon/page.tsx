import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import ColophonClient from "./ColophonClient";

export const metadata: Metadata = {
  title: "The Night Sky — 60°N",
  description:
    "An interactive starfield simulating a Swedish winter night at 60 degrees north latitude, featuring realistic stellar physics and atmospheric effects.",
  alternates: { canonical: canonicalUrl("/colophon") },
  openGraph: {
    title: "The Night Sky — 60°N | Quang Luong",
    description:
      "A procedural starfield with spectral classification, atmospheric scintillation, and aurora borealis.",
    url: canonicalUrl("/colophon"),
    images: [{ url: "/og/colophon.png", width: 1200, height: 630, alt: "The Night Sky at 60°N" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Night Sky — 60°N | Quang Luong",
    description: "An interactive starfield simulating a Swedish winter night.",
    images: ["/og/colophon.png"],
  },
};

export default function ColophonPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "60°N", href: "/colophon/" }]} />
      <ColophonClient />
    </>
  );
}
