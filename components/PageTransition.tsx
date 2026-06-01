"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Full-screen black overlay that slides up to reveal the page on first load.
 * Fires once fonts are ready so the reveal never flashes unstyled text.
 * Skipped entirely under prefers-reduced-motion (CSS hides it too).
 */
export default function PageTransition() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduced) {
      el.style.display = "none";
      return;
    }

    const reveal = () => {
      gsap.to(el, {
        yPercent: -100,
        duration: 1,
        ease: "expo.inOut",
        onComplete: () => {
          el.style.display = "none";
        },
      });
    };

    // Wait for fonts so the page underneath is fully painted before reveal.
    if (document.fonts?.ready) {
      let done = false;
      const run = () => {
        if (done) return;
        done = true;
        reveal();
      };
      document.fonts.ready.then(run);
      // Safety fallback in case fonts.ready never resolves.
      const t = setTimeout(run, 1200);
      return () => clearTimeout(t);
    }

    reveal();
  }, []);

  return <div ref={ref} className="page-transition" aria-hidden />;
}
