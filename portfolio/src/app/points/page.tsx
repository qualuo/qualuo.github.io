import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import PointsPageClient from "./PointsPageClient";

export const metadata: Metadata = {
  title: "Points of View",
  description:
    "Enterprise architecture presentations by Quang Luong covering TOGAF, system landscapes, AI architecture, API strategy, and cloud migration patterns.",
  alternates: { canonical: canonicalUrl("/points") },
  openGraph: {
    title: "Points of View | Quang Luong",
    description:
      "Enterprise architecture presentations on TOGAF, system landscapes, and AI architecture.",
    url: canonicalUrl("/points"),
    images: [{ url: "/og/points.png", width: 1200, height: 630, alt: "Points of View" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Points of View | Quang Luong",
    description: "Enterprise architecture presentations and strategic thinking.",
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
