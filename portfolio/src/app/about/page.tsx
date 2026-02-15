import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About",
  description:
    "Quang Luong — Systems Architect & Creative Technologist. Designing AI solutions, enterprise automation, and interactive digital experiences.",
  alternates: { canonical: canonicalUrl("/about") },
  openGraph: {
    title: "About | Quang Luong",
    description:
      "Systems Architect & Creative Technologist crafting AI solutions and interactive experiences.",
    url: canonicalUrl("/about"),
    images: [{ url: "/og/about.png", width: 1200, height: 630, alt: "About Quang Luong" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About | Quang Luong",
    description:
      "Systems Architect & Creative Technologist crafting AI solutions and interactive experiences.",
    images: ["/og/about.png"],
  },
};

export default function AboutPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "About", href: "/about/" }]} />
      <AboutClient />
    </>
  );
}
