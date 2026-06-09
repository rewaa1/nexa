import Navbar from "@/components/layout/Navbar/Navbar";
import Hero from "@/components/sections/Hero/Hero";
import Marquee from "@/components/sections/Marquee/Marquee";
import Statement from "@/components/sections/Statement/Statement";
import WorkGrid from "@/components/sections/WorkGrid/WorkGrid";
import Process from "@/components/sections/Process/Process";
import CtaBanner from "@/components/sections/CtaBanner/CtaBanner";
import Footer from "@/components/layout/Footer/Footer";
import SectionDivider from "@/components/ui/SectionDivider/SectionDivider";
import ShaderTransition from "@/components/effects/ShaderTransition/ShaderTransition";

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
