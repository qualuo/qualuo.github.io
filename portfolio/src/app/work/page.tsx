import type { Metadata } from "next";
import { Projects } from "@/components/sections/Projects";
import { Navbar } from "@/components/layout/Navbar";
import { canonicalUrl } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected projects by Quang Luong spanning enterprise AI platforms, automation frameworks, data engineering, 3D visualization, and safety-critical systems.",
  alternates: { canonical: canonicalUrl("/work") },
  openGraph: {
    title: "Selected Work | Quang Luong",
    description:
      "From generative AI solutions to railway signalling systems — enterprise-grade projects built for impact.",
    url: canonicalUrl("/work"),
    images: [{ url: "/og/work.png", width: 1200, height: 630, alt: "Quang Luong - Selected Work" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Selected Work | Quang Luong",
    description: "From generative AI solutions to railway signalling systems.",
    images: ["/og/work.png"],
  },
};

export default function ProjectsPage() {
  return (
    <main id="main-content" className="relative min-h-screen">
      <BreadcrumbSchema items={[{ name: "Work", href: "/work/" }]} />
      <h1 className="sr-only">Selected Work by Quang Luong</h1>
      <Navbar isSubpage hasStars={false} />
      <Projects />
    </main>
  );
}
