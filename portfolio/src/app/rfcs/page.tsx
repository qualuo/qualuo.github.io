import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import RfcListPageClient from "./RfcListPageClient";

export const metadata: Metadata = {
  title: "RFCs",
  description:
    "Requests for Comments — structured proposals for architectural decisions, custom solutions, and enterprise technology strategy.",
  alternates: { canonical: canonicalUrl("/rfcs") },
  openGraph: {
    title: "RFCs | Quang Luong",
    description:
      "Structured proposals for architectural decisions and enterprise technology strategy.",
    url: canonicalUrl("/rfcs"),
    images: [{ url: "/og/rfcs.png", width: 1200, height: 630, alt: "RFCs" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RFCs | Quang Luong",
    description:
      "Structured proposals for architectural decisions and enterprise technology strategy.",
    images: ["/og/rfcs.png"],
  },
};

export default function RfcListPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "RFCs", href: "/rfcs/" }]} />
      <RfcListPageClient />
    </>
  );
}
