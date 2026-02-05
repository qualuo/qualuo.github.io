import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Contact } from "@/components/sections/Contact";
import { StarsBackground } from "@/components/animations/StarsBackground";

export default function Home() {
  return (
    <main className="relative">
      <StarsBackground />
      <Navbar />
      <Hero />
      <Contact />
    </main>
  );
}
