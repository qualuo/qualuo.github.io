import { JsonLd } from "./JsonLd";
import { SITE_CONFIG, canonicalUrl } from "@/lib/seo";
import type { Demo } from "@/lib/demos";

export function DemoSchema({ demo }: { demo: Demo }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: demo.title,
        description: demo.description,
        url: canonicalUrl(`/demos/${demo.slug}`),
        applicationCategory: "WebApplication",
        operatingSystem: "Web Browser",
        author: {
          "@id": `${SITE_CONFIG.url}/#person`,
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        keywords: demo.tech.join(", "),
      }}
    />
  );
}
