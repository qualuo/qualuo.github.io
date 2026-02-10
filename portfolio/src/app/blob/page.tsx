import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import BlobClient from "./BlobClient";

export const metadata: Metadata = {
  title: "Iridescent",
  description:
    "Iridescent: a morphing 3D form rendered with custom GLSL shaders, Perlin noise displacement, and Fresnel-based iridescence by Quang Luong.",
  alternates: { canonical: canonicalUrl("/blob") },
  openGraph: {
    title: "Iridescent | Quang Luong",
    description:
      "A morphing 3D form with custom GLSL shaders, Perlin noise, and Fresnel-based iridescence.",
    url: canonicalUrl("/blob"),
    images: [{ url: "/og/blob.png", width: 1200, height: 630, alt: "Iridescent — Morphing GLSL Blob" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Iridescent | Quang Luong",
    description: "A morphing 3D form with custom GLSL shaders and Fresnel iridescence.",
    images: ["/og/blob.png"],
  },
};

export default function BlobPage() {
  return <BlobClient />;
}
