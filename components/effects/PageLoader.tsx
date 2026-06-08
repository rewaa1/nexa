"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Full-screen black overlay that covers the page on first load and slides
 * upward to reveal the site. Sets display:none on complete so it never blocks
 * interaction. Skipped under prefers-reduced-motion.
 */
export default function PageLoader() {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      loader.style.display = "none";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(loader, {
        yPercent: -100,
        duration: 1.2,
        ease: "expo.inOut",
        delay: 0.2,
        onComplete: () => {
          loader.style.display = "none";
        },
      });
    }, loaderRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={loaderRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        background: "#060606",
        zIndex: 9999,
        transformOrigin: "top",
      }}
    />
  );
}
