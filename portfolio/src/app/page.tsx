import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Contact } from "@/components/sections/Contact";
import { StarsBackgroundLazy as StarsBackground } from "@/components/animations/StarsBackgroundLazy";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/") },
};

export default function Home() {
  return (
    <main id="main-content" className="relative">
      <StarsBackground />
      <Navbar />
      <Hero />

      <Contact />
    </main>
  );
}
