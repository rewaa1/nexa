import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import Statement from "@/components/sections/Statement";
import WorkGrid from "@/components/sections/WorkGrid";
import Process from "@/components/sections/Process";
import CtaBanner from "@/components/sections/CtaBanner";
import Footer from "@/components/layout/Footer";
import SectionDivider from "@/components/ui/SectionDivider";
import ShaderTransition from "@/components/effects/ShaderTransition";

export default function Home() {
  return (
    <main>
      <ShaderTransition />
      <Navbar />
      <Hero />
      <SectionDivider />
      <Marquee />
      <SectionDivider />
      <Statement />
      <SectionDivider />
      <WorkGrid />
      <SectionDivider />
      <Process />
      <SectionDivider />
      <CtaBanner />
      <SectionDivider />
      <Footer />
    </main>
  );
}
