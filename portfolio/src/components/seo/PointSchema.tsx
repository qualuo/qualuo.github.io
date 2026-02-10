import { JsonLd } from "./JsonLd";
import { SITE_CONFIG, canonicalUrl } from "@/lib/seo";
import type { Point } from "@/lib/points";

export function PointSchema({ point }: { point: Point }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": point.format === "paper" ? "ScholarlyArticle" : "PresentationDigitalDocument",
        name: point.title,
        description: point.description,
        url: canonicalUrl(`/points/${point.slug}`),
        author: {
          "@id": `${SITE_CONFIG.url}/#person`,
        },
        about: point.tags.map((tag) => ({
          "@type": "Thing",
          name: tag,
        })),
        inLanguage: "en-US",
        keywords: point.tags.join(", "),
      }}
    />
  );
}
