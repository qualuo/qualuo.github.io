import { JsonLd } from "./JsonLd";
import { SITE_CONFIG } from "@/lib/seo";

export function WebSiteSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${SITE_CONFIG.url}/#website`,
        url: SITE_CONFIG.url,
        name: SITE_CONFIG.name,
        description: SITE_CONFIG.description,
        publisher: {
          "@id": `${SITE_CONFIG.url}/#person`,
        },
        inLanguage: "en-US",
      }}
    />
  );
}
