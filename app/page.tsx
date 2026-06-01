import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Statement from "@/components/Statement";
import WorkGrid from "@/components/WorkGrid";
import Process from "@/components/Process";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";
import SectionDivider from "@/components/SectionDivider";
import ShaderTransition from "@/components/ShaderTransition";

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
