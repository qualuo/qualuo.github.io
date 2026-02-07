import { Projects } from "@/components/sections/Projects";
import { Navbar } from "@/components/layout/Navbar";

export default function ProjectsPage() {
  return (
    <main className="relative min-h-screen">
      <Navbar isSubpage hasStars={false} />
      <Projects />
    </main>
  );
}
