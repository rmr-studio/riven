import { Hero } from "@/components/sections/hero";
import { PainPoints } from "@/components/sections/pain-points";
import { Features } from "@/components/sections/features";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <PainPoints />
      <Features />
    </main>
  );
}
