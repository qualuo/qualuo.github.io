import { JsonLd } from "./JsonLd";
import { SITE_CONFIG } from "@/lib/seo";

export function PersonSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${SITE_CONFIG.url}/#person`,
        name: SITE_CONFIG.author.name,
        url: SITE_CONFIG.url,
        jobTitle: SITE_CONFIG.author.jobTitle,
        knowsAbout: SITE_CONFIG.author.knowsAbout,
        sameAs: [SITE_CONFIG.github],
        email: `mailto:${SITE_CONFIG.email}`,
        image: `${SITE_CONFIG.url}/og/home.png`,
      }}
    />
  );
}
