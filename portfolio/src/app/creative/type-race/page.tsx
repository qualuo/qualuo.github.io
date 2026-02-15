import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import TypeRaceClient from "./TypeRaceClient";

export const metadata: Metadata = {
  title: "Type Race",
  description:
    "A beautiful typing speed game. Race through flower-themed passages and track your WPM and accuracy.",
  alternates: { canonical: canonicalUrl("/creative/type-race") },
  openGraph: {
    title: "Type Race | Quang Luong",
    description:
      "A beautiful typing speed game. Test your speed with flower-themed passages.",
    url: canonicalUrl("/creative/type-race"),
    images: [{ url: "/og/creative/type-race.png", width: 1200, height: 630, alt: "Type Race" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Type Race | Quang Luong",
    description: "A beautiful typing speed game. Test your speed with flower-themed passages.",
    images: ["/og/creative/type-race.png"],
  },
};

export default function TypeRacePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Creative", href: "/creative/" },
          { name: "Type Race", href: "/creative/type-race/" },
        ]}
      />
      <TypeRaceClient />
    </>
  );
}
