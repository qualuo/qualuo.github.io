import { JsonLd } from "./JsonLd";
import { SITE_CONFIG, canonicalUrl } from "@/lib/seo";
import type { EnrichedRfc } from "@/lib/rfcs";

export function RfcSchema({ rfc }: { rfc: EnrichedRfc }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "TechArticle",
        name: rfc.title,
        headline: `${rfc.title} — ${rfc.subtitle}`,
        description: rfc.description,
        url: canonicalUrl(`/rfcs/${rfc.slug}`),
        datePublished: rfc.date,
        author: {
          "@id": `${SITE_CONFIG.url}/#person`,
        },
        about: rfc.tags.map((tag) => ({
          "@type": "Thing",
          name: tag,
        })),
        inLanguage: "en-US",
        keywords: rfc.tags.join(", "),
        articleSection: "RFC",
      }}
    />
  );
}
