"use client";

import { gsap, ScrollTrigger, useGsap } from "@/lib/useGsap";

const STATS = [
  { value: 80, suffix: "+", label: "Projects launched" },
  { value: 6, suffix: " yr", label: "In the craft" },
  { value: 4.9, suffix: "★", label: "Client rating", decimals: 1 },
];

export default function Statement() {
  const { scope, useScopedGsap } = useGsap<HTMLElement>();

  useScopedGsap(() => {
    const trigger = {
      trigger: scope.current,
      start: "top 75%",
      end: "top 30%",
    };

    gsap.from(".stmt-word", {
      x: -40,
      opacity: 0,
      stagger: 0.1,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: trigger,
    });

    gsap.from(".stmt-line", {
      y: 30,
      opacity: 0,
      stagger: 0.08,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: trigger,
    });

    // Counter-up: tween a proxy object and write formatted values to the DOM.
    STATS.forEach((stat, i) => {
      const el = scope.current?.querySelector<HTMLElement>(
        `[data-stat="${i}"]`
      );
      if (!el) return;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: stat.value,
        duration: 1.6,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
        onUpdate: () => {
          el.textContent = stat.decimals
            ? obj.v.toFixed(stat.decimals)
            : Math.round(obj.v).toString();
        },
      });
    });

    ScrollTrigger.refresh();
  });

  return (
    <section
      ref={scope}
      id="studio"
      className="mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-40"
    >
      <div className="grid grid-cols-1 items-end gap-12 md:grid-cols-2 md:gap-20">
        {/* Left column */}
        <div>
          <p className="eyebrow mb-8" style={{ color: "var(--muted)" }}>
            <span className="stmt-word inline-block">01 — Who we are</span>
          </p>
          <h2
            className="font-display font-bold leading-[1.05]"
            style={{ fontSize: "clamp(30px,4vw,40px)", letterSpacing: "-1px" }}
          >
            <span className="stmt-word block">Not a vendor.</span>
            <span
              className="stmt-word block font-normal italic"
              style={{ color: "var(--muted)" }}
            >
              A creative partner
            </span>
            <span className="stmt-word block">with an obsession.</span>
          </h2>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <p
            className="stmt-line text-[14px] leading-[1.9]"
            style={{ color: "var(--muted)" }}
          >
            We&rsquo;re a small, fiercely focused studio that believes the web
            is still the{" "}
            <span style={{ color: "var(--fg)", fontWeight: 500 }}>
              most powerful storytelling medium
            </span>{" "}
            ever built. Most agencies forgot that. We didn&rsquo;t.
          </p>
          <p
            className="stmt-line text-[14px] leading-[1.9]"
            style={{ color: "var(--muted)" }}
          >
            Every project starts with one question:{" "}
            <span style={{ color: "var(--fg)", fontWeight: 500 }}>
              what should this feel like?
            </span>{" "}
            Then we build backwards from that feeling — through design, code,
            motion, and language — until the screen delivers it.
          </p>

          {/* Stats */}
          <div
            className="stmt-line mt-6 grid grid-cols-3 gap-4 pt-6"
            style={{ borderTop: "0.5px solid var(--border)" }}
          >
            {STATS.map((stat, i) => (
              <div key={stat.label}>
                <div className="flex items-baseline font-display font-bold">
                  <span className="text-[28px]" data-stat={i}>
                    0
                  </span>
                  <span className="text-[28px]">{stat.suffix}</span>
                </div>
                <div
                  className="mt-1 text-[10px] uppercase"
                  style={{ letterSpacing: "1.5px", color: "var(--muted)" }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
