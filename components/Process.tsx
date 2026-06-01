"use client";

import { gsap, ScrollTrigger, useGsap } from "@/lib/useGsap";

const STEPS = [
  {
    num: "01",
    title: "Discover & Define",
    body: "We dig into your world — users, goals, edge cases — until the problem feels obvious.",
  },
  {
    num: "02",
    title: "Design & Prototype",
    body: "High-fidelity concepts fast. You see and feel the product before a single line of code.",
  },
  {
    num: "03",
    title: "Build & Animate",
    body: "Clean, performant code. Motion that earns its place. Nothing decorative, everything intentional.",
  },
  {
    num: "04",
    title: "Launch & Evolve",
    body: "We ship, then stay. Iteration, analytics, and continuous refinement built into every engagement.",
  },
];

export default function Process() {
  const { scope, useScopedGsap } = useGsap<HTMLElement>();

  useScopedGsap(() => {
    gsap.set(".process-rule", { scaleX: 0, transformOrigin: "left" });
    gsap.to(".process-rule", {
      scaleX: 1,
      duration: 0.9,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".process-grid",
        start: "top 80%",
      },
    });

    gsap.from(".process-card", {
      y: 40,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".process-grid",
        start: "top 82%",
      },
    });

    ScrollTrigger.refresh();
  });

  return (
    <section
      ref={scope}
      id="process"
      className="mx-auto max-w-[1400px] px-6 py-20 md:px-10 md:py-28"
    >
      {/* Intro */}
      <div className="mb-16 max-w-[460px]">
        <p className="eyebrow mb-5" style={{ color: "var(--muted)" }}>
          03 — How we work
        </p>
        <h2
          className="font-display text-[28px] font-bold leading-[1.1]"
          style={{ letterSpacing: "-0.5px" }}
        >
          Four chapters. One finished world.
        </h2>
        <p
          className="mt-5 text-[14px] leading-[1.9]"
          style={{ color: "var(--muted)" }}
        >
          We run lean, move fast, and stay in the room with you. No handoffs to
          juniors, no black-box processes.
        </p>
      </div>

      {/* Grid */}
      <div className="process-grid grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <div key={step.num} className="process-card">
            <div
              className="process-rule mb-6 h-px w-full"
              style={{ background: "var(--accent)" }}
            />
            <div
              className="mb-4 font-display text-[13px] font-bold"
              style={{ color: "var(--muted)" }}
            >
              {step.num}
            </div>
            <h3 className="mb-3 font-display text-[18px] font-bold leading-tight">
              {step.title}
            </h3>
            <p
              className="text-[13px] leading-[1.8]"
              style={{ color: "var(--muted)" }}
            >
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
