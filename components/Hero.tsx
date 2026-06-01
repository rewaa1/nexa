"use client";

import { gsap, ScrollTrigger, useGsap } from "@/lib/useGsap";

export default function Hero() {
  const { scope, useScopedGsap } = useGsap<HTMLElement>();

  useScopedGsap(() => {
    // ── Entrance timeline (on load, not scroll) ──
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(".hero-word", {
      yPercent: 110,
      opacity: 0,
      duration: 1,
      stagger: 0.12,
    })
      .from(
        ".hero-eyebrow",
        { y: 20, opacity: 0, duration: 0.8 },
        0.3
      )
      .from(
        ".hero-fade",
        { y: 24, opacity: 0, duration: 1, stagger: 0.12 },
        0.9
      );

    // ── Ghost watermark parallax ──
    gsap.to(".hero-ghost", {
      yPercent: -40,
      ease: "none",
      scrollTrigger: {
        trigger: scope.current,
        start: "top top",
        end: "bottom top",
        scrub: 2,
      },
    });

    // ── Scroll indicator line draw ──
    gsap.from(".hero-scroll-line", {
      scaleY: 0,
      transformOrigin: "top",
      duration: 1,
      delay: 1.6,
      ease: "power2.out",
    });

    ScrollTrigger.refresh();
  });

  return (
    <section
      ref={scope}
      id="top"
      className="relative flex min-h-[100svh] w-full items-center overflow-hidden px-6 pt-[68px] md:px-10"
    >
      {/* Ghost / watermark word */}
      <span
        className="hero-ghost pointer-events-none absolute left-1/2 top-1/2 -z-0 -translate-x-1/2 -translate-y-1/2 select-none font-display font-extrabold leading-none"
        style={{
          fontSize: "clamp(120px, 28vw, 360px)",
          color: "rgba(255,255,255,0.018)",
          letterSpacing: "-0.04em",
        }}
        aria-hidden
      >
        BUILD
      </span>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1400px] flex-col justify-center">
        {/* Eyebrow */}
        <div className="hero-eyebrow mb-10 flex items-center gap-3">
          <span
            className="block h-px w-10"
            style={{ background: "var(--accent)" }}
          />
          <span className="eyebrow text-fg/80">Full-spectrum web studio</span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-extrabold leading-[0.95]">
          <span className="block overflow-hidden">
            <span
              className="hero-word inline-block"
              style={{
                fontSize: "clamp(44px, 8vw, 72px)",
                letterSpacing: "-3px",
              }}
            >
              We don&rsquo;t build
            </span>
          </span>
          <span className="block overflow-hidden md:pl-20">
            <span
              className="hero-word inline-block italic"
              style={{
                fontSize: "clamp(44px, 8vw, 72px)",
                letterSpacing: "-3px",
                color: "var(--muted)",
              }}
            >
              websites.
            </span>
          </span>
          <span className="block overflow-hidden">
            <span
              className="hero-word inline-block"
              style={{
                fontSize: "clamp(44px, 8vw, 72px)",
                letterSpacing: "-3px",
              }}
            >
              We build{" "}
              <span style={{ color: "var(--accent)" }}>worlds.</span>
            </span>
          </span>
        </h1>

        {/* Bottom row: subtext (left) + CTAs (right) */}
        <div className="mt-16 flex flex-col gap-10 md:mt-24 md:flex-row md:items-end md:justify-between">
          <p
            className="hero-fade max-w-[300px] text-[14px] leading-[1.85]"
            style={{ color: "var(--muted)" }}
          >
            SaaS products, commerce platforms, campaigns and mobile-first apps
            — designed to make people feel something.
          </p>

          <div className="hero-fade flex flex-wrap items-center gap-3">
            <a
              href="#work"
              data-cursor="link"
              className="rounded-full px-6 py-3 text-[13px] text-white transition-transform duration-300 hover:scale-[1.03]"
              style={{ background: "var(--accent)" }}
            >
              See our work
            </a>
            <a
              href="#process"
              data-cursor="link"
              className="rounded-full px-6 py-3 text-[13px] text-fg transition-colors duration-300 hover:bg-white/5"
              style={{ border: "0.5px solid var(--border)" }}
            >
              How we think
            </a>
          </div>
        </div>
      </div>

      {/* Vertical scroll indicator */}
      <div className="hero-fade absolute bottom-8 right-6 hidden flex-col items-center gap-3 md:right-10 md:flex">
        <span
          className="eyebrow rotate-180 text-fg/50"
          style={{ writingMode: "vertical-rl" }}
        >
          Scroll
        </span>
        <span
          className="hero-scroll-line block h-12 w-px"
          style={{ background: "var(--border)" }}
        />
      </div>
    </section>
  );
}
