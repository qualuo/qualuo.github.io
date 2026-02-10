import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import PointsPageClient from "./PointsPageClient";

export const metadata: Metadata = {
  title: "Points of View",
  description:
    "Frameworks and perspectives for building systems that scale — papers and presentations on AI architecture, system landscape strategy, TOGAF, and enterprise design patterns.",
  alternates: { canonical: canonicalUrl("/points") },
  openGraph: {
    title: "Points of View | Quang Luong",
    description:
      "Papers and presentations on AI architecture, system landscape strategy, and enterprise design patterns.",
    url: canonicalUrl("/points"),
    images: [{ url: "/og/points.png", width: 1200, height: 630, alt: "Points of View" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Points of View | Quang Luong",
    description:
      "Papers and presentations on AI architecture, system landscape strategy, and enterprise design patterns.",
    images: ["/og/points.png"],
  },
};

export default function PointsPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Points of View", href: "/points/" }]} />
      <PointsPageClient />
    </>
  );
}
