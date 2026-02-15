import type { Metadata } from "next";
import { rfcs } from "@/lib/rfcs";
import { getRfcContent, getEnrichedRfc } from "@/lib/rfc-content";
import { RfcPageClient } from "./RfcPageClient";
import { canonicalUrl, SITE_CONFIG } from "@/lib/seo";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { RfcSchema } from "@/components/seo/RfcSchema";

export function generateStaticParams() {
  return rfcs
    .filter((rfc) => rfc.status === "live")
    .map((rfc) => ({ slug: rfc.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const rfc = getEnrichedRfc(slug);

  if (!rfc) {
    return { title: "RFC Not Found" };
  }

  const title = `${rfc.title} — ${rfc.subtitle}`;
  const description = rfc.description;
  const url = canonicalUrl(`/rfcs/${rfc.slug}`);

  return {
    title,
    description,
    keywords: [...rfc.tags, "RFC", "architecture decision", SITE_CONFIG.name],
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${SITE_CONFIG.name}`,
      description,
      url,
      type: "article",
      images: [
        {
          url: `/og/rfcs/${rfc.slug}.png`,
          width: 1200,
          height: 630,
          alt: rfc.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_CONFIG.name}`,
      description,
      images: [`/og/rfcs/${rfc.slug}.png`],
    },
  };
}

export default async function RfcPage({ params }: PageProps) {
  const { slug } = await params;
  const rfc = getEnrichedRfc(slug);

  let content = "";
  if (rfc && rfc.status === "live") {
    content = getRfcContent(slug);
  }

  return (
    <>
      {rfc && (
        <>
          <BreadcrumbSchema
            items={[
              { name: "RFCs", href: "/rfcs/" },
              { name: rfc.title, href: `/rfcs/${rfc.slug}/` },
            ]}
          />
          <RfcSchema rfc={rfc} />
        </>
      )}
      <RfcPageClient rfc={rfc} content={content} />
    </>
  );
}
