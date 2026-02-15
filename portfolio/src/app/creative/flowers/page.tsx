import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import FlowersClient from "./FlowersClient";

export const metadata: Metadata = {
  title: "Flower Garden",
  description:
    "An interactive flower garden simulation. Plant seeds, watch them bloom, and grow your own garden of digital flowers.",
  alternates: { canonical: canonicalUrl("/creative/flowers") },
  openGraph: {
    title: "Flower Garden | Quang Luong",
    description:
      "An interactive flower garden simulation. Plant seeds and watch them bloom.",
    url: canonicalUrl("/creative/flowers"),
  },
};

export default function FlowersPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Creative", href: "/creative/" }, { name: "Flower Garden", href: "/creative/flowers/" }]} />
      <FlowersClient />
    </>
  );
}
