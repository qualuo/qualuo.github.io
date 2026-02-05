import { demos, getDemoBySlug } from "@/lib/demos";
import { DemoPageClient } from "./DemoPageClient";

// Generate static params for static export
export function generateStaticParams() {
  return demos.map((demo) => ({
    slug: demo.slug,
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DemoPage({ params }: PageProps) {
  const { slug } = await params;
  const demo = getDemoBySlug(slug);

  return <DemoPageClient demo={demo} />;
}
