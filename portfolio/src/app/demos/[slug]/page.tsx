import type { Metadata } from "next";
import { demos, getDemoBySlug } from "@/lib/demos";
import { DemoPageClient } from "./DemoPageClient";
import { canonicalUrl, SITE_CONFIG } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { DemoSchema } from "@/components/seo/DemoSchema";

export function generateStaticParams() {
  return demos.map((demo) => ({
    slug: demo.slug,
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const demo = getDemoBySlug(slug);

  if (!demo) {
    return { title: "Demo Not Found" };
  }

  const title = `${demo.title} — ${demo.subtitle}`;
  const description = demo.description;
  const url = canonicalUrl(`/demos/${demo.slug}`);

  return {
    title,
    description,
    keywords: [...demo.tech, "interactive demo", "web experiment", SITE_CONFIG.name],
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${SITE_CONFIG.name}`,
      description,
      url,
      type: "article",
      images: [
        {
          url: `/og/demos/${demo.slug}.png`,
          width: 1200,
          height: 630,
          alt: `${demo.title} Demo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_CONFIG.name}`,
      description,
      images: [`/og/demos/${demo.slug}.png`],
    },
  };
}

export default async function DemoPage({ params }: PageProps) {
  const { slug } = await params;
  const demo = getDemoBySlug(slug);

  return (
    <>
      {demo && (
        <>
          <BreadcrumbSchema
            items={[
              { name: "Demos", href: "/demos/" },
              { name: demo.title, href: `/demos/${demo.slug}/` },
            ]}
          />
          <DemoSchema demo={demo} />
        </>
      )}
      <DemoPageClient demo={demo} />
    </>
  );
}
