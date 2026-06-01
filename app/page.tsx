import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Statement from "@/components/Statement";
import WorkGrid from "@/components/WorkGrid";
import Process from "@/components/Process";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Marquee />
      <Statement />
      <WorkGrid />
      <Process />
      <CtaBanner />
      <Footer />
    </main>
  );
}
