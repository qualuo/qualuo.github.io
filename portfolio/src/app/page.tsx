import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Contact } from "@/components/sections/Contact";
import { StarsBackground } from "@/components/animations/StarsBackground";
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
