import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import CreativeClient from "./CreativeClient";

export const metadata: Metadata = {
  title: "Creative Works",
  description:
    "Creative experiments in generative art, interactive environments, kinetic typography, and audio visualization by Quang Luong.",
  alternates: { canonical: canonicalUrl("/creative") },
  openGraph: {
    title: "Creative Works | Quang Luong",
    description:
      "Experiments in connection, expression, and craft — generative art, interactive environments, and more.",
    url: canonicalUrl("/creative"),
    images: [{ url: "/og/creative.png", width: 1200, height: 630, alt: "Creative Works" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Creative Works | Quang Luong",
    description: "Experiments in connection, expression, and craft.",
    images: ["/og/creative.png"],
  },
};

export default function CreativePage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Creative", href: "/creative/" }]} />
      <CreativeClient />
    </>
  );
}
