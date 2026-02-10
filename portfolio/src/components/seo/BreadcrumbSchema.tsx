import { JsonLd } from "./JsonLd";
import { SITE_CONFIG } from "@/lib/seo";

interface BreadcrumbItem {
  name: string;
  href: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${SITE_CONFIG.url}/`,
          },
          ...items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 2,
            name: item.name,
            item: `${SITE_CONFIG.url}${item.href}`,
          })),
        ],
      }}
    />
  );
}
