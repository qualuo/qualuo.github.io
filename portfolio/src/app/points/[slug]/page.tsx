import type { Metadata } from "next";
import { points, getPointBySlug } from "@/lib/points";
import { PointPageClient } from "./PointPageClient";
import { canonicalUrl, SITE_CONFIG } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { PointSchema } from "@/components/seo/PointSchema";

export function generateStaticParams() {
  return points.map((point) => ({
    slug: point.slug,
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const point = getPointBySlug(slug);

  if (!point) {
    return { title: "Point of View Not Found" };
  }

  const title = `${point.title} — ${point.subtitle}`;
  const description = point.description;
  const url = canonicalUrl(`/points/${point.slug}`);

  return {
    title,
    description,
    keywords: [...point.tags, "enterprise architecture", SITE_CONFIG.name],
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${SITE_CONFIG.name}`,
      description,
      url,
      type: "article",
      images: [
        {
          url: `/og/points/${point.slug}.png`,
          width: 1200,
          height: 630,
          alt: point.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_CONFIG.name}`,
      description,
      images: [`/og/points/${point.slug}.png`],
    },
  };
}

export default async function PointPage({ params }: PageProps) {
  const { slug } = await params;
  const point = getPointBySlug(slug);

  return (
    <>
      {point && (
        <>
          <BreadcrumbSchema
            items={[
              { name: "Points of View", href: "/points/" },
              { name: point.title, href: `/points/${point.slug}/` },
            ]}
          />
          <PointSchema point={point} />
        </>
      )}
      <PointPageClient point={point} />
    </>
  );
}
