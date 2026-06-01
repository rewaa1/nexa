"use client";

import { gsap, ScrollTrigger, useGsap } from "@/lib/useGsap";

const HEADLINE = [
  ["Your", "next", "chapter"],
  ["starts", "here."],
];

export default function CtaBanner() {
  const { scope, useScopedGsap } = useGsap<HTMLElement>();

  useScopedGsap(() => {
    gsap.from(".cta-word", {
      yPercent: 110,
      opacity: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: {
        trigger: scope.current,
        start: "top 75%",
      },
    });

    gsap.from(".cta-fade", {
      y: 24,
      opacity: 0,
      duration: 0.9,
      stagger: 0.1,
      delay: 0.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: scope.current,
        start: "top 75%",
      },
    });

    ScrollTrigger.refresh();
  });

  return (
    <section
      ref={scope}
      id="contact"
      className="mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-40"
    >
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
        {/* Left: headline */}
        <h2
          className="font-display font-extrabold leading-[1.02]"
          style={{ fontSize: "clamp(34px,4.6vw,44px)", letterSpacing: "-1.5px" }}
        >
          {HEADLINE.map((line, li) => (
            <span key={li} className="block overflow-hidden">
              {line.map((word) => (
                <span key={word} className="cta-word mr-[0.25em] inline-block">
                  <span
                    style={
                      word === "starts"
                        ? { color: "var(--accent)" }
                        : undefined
                    }
                  >
                    {word}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </h2>

        {/* Right: body + CTA */}
        <div className="flex flex-col items-start gap-8">
          <p
            className="cta-fade max-w-[400px] text-[14px] leading-[1.9]"
            style={{ color: "var(--muted)" }}
          >
            Whether you&rsquo;re a founder with a napkin sketch or a brand ready
            for a full redesign — let&rsquo;s figure out what this should feel
            like.
          </p>
          <a
            href="mailto:hello@stud.io"
            data-cursor="link"
            className="cta-fade text-[14px] text-white transition-transform duration-300 hover:scale-[1.03]"
            style={{
              background: "var(--accent)",
              borderRadius: 100,
              padding: "14px 28px",
            }}
          >
            Start a conversation →
          </a>
        </div>
      </div>
    </section>
  );
}
