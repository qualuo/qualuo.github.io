import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import DemosPageClient from "./DemosPageClient";

export const metadata: Metadata = {
  title: "Demo Laboratory",
  description:
    "Interactive browser experiments by Quang Luong: local AI chat, voice interfaces, document Q&A, music generation, particle physics, and 3D sandboxes.",
  alternates: { canonical: canonicalUrl("/demos") },
  openGraph: {
    title: "Demo Laboratory | Quang Luong",
    description:
      "Interactive browser experiments: local AI chat, voice interfaces, document RAG, music generation, particle physics, and more.",
    url: canonicalUrl("/demos"),
    images: [{ url: "/og/demos.png", width: 1200, height: 630, alt: "Demo Laboratory" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Demo Laboratory | Quang Luong",
    description: "Interactive browser experiments pushing web technology boundaries.",
    images: ["/og/demos.png"],
  },
};

export default function DemosPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Demos", href: "/demos/" }]} />
      <DemosPageClient />
    </>
  );
}
