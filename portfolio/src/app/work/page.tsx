import { Projects } from "@/components/sections/Projects";
import { StarsBackground } from "@/components/animations/StarsBackground";
import { Navbar } from "@/components/layout/Navbar";

export default function ProjectsPage() {
  return (
    <main className="relative min-h-screen">
      <StarsBackground />
      <Navbar isSubpage />
      <Projects />
    </main>
  );
}
