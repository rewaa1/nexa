import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { HERO_DISTANCE, HERO_TARGET, HOLD, TRANSITION } from "./solarConfig";
import type { SolarScene } from "./SolarScene";

gsap.registerPlugin(ScrollTrigger);

export interface SolarJourney {
  scrollTrigger: ScrollTrigger;
  timeline: gsap.core.Timeline;
  /** Normalised scroll positions (0–1) where each section rests. */
  restPoints: number[];
}

interface SolarJourneyOptions {
  scene: SolarScene;
  trigger: HTMLElement;
  heroPanel: HTMLElement;
  planetPanels: HTMLElement[];
  onActive: (index: number) => void;
}

/**
 * Builds the scroll-scrubbed journey through the solar system.
 *
 * The camera flies forward along the planet line — no zoom-out/zoom-in dips.
 * Each transition is a single smooth forward movement from one planet to the next.
 *
 * 1. Hero overview → smooth zoom forward into the first planet
 * 2. For each subsequent planet: smooth forward travel while panels crossfade
 *
 * Camera targets use the scene's lookAtTargets (with look-ahead offset) so
 * the active planet sits left of center and the next planet peeks on the right.
 *
 * A gentle snap settles on each rest point. Returns handles for cleanup.
 */
export function buildSolarJourney({
  scene,
  trigger,
  heroPanel,
  planetPanels,
  onActive,
}: SolarJourneyOptions): SolarJourney {
  const lookAt = scene.lookAtTargets;
  const rest = scene.restDistances;
  const planetCount = lookAt.length;

  /** Animated camera state — GSAP tweens these values, onUpdate pushes them to the scene. */
  const camera = {
    targetX: HERO_TARGET[0],
    targetY: HERO_TARGET[1],
    targetZ: HERO_TARGET[2],
    distance: HERO_DISTANCE,
  };

  const timeline = gsap.timeline({
    onUpdate: () =>
      scene.focus(camera.targetX, camera.targetY, camera.targetZ, camera.distance),
  });

  // Set initial panel visibility — only hero is visible at start
  gsap.set(heroPanel, { autoAlpha: 1 });
  planetPanels.forEach((panel) => gsap.set(panel, { autoAlpha: 0, y: 24 }));

  const restCenters: number[] = [];

  // ─── Phase 1: Hero hold ───────────────────────────────────────────────
  // Camera stays at the overview distance, hero content visible
  timeline.to({}, { duration: HOLD });
  restCenters.push(HOLD / 2);

  // ─── Phase 2: Hero → Planet 0 (smooth forward zoom) ──────────────────
  // Camera flies forward from the overview into the first planet
  const heroTransitionStart = HOLD;

  timeline.to(
    camera,
    {
      targetX: lookAt[0].x,
      targetY: lookAt[0].y,
      targetZ: lookAt[0].z,
      distance: rest[0],
      duration: TRANSITION,
      ease: "power2.inOut",
    },
    heroTransitionStart
  );

  // Hero fades out as zoom begins
  timeline.to(
    heroPanel,
    { autoAlpha: 0, y: -20, duration: 0.3, ease: "power2.in" },
    heroTransitionStart
  );

  // First planet panel fades in near the end of the zoom
  timeline.fromTo(
    planetPanels[0],
    { autoAlpha: 0, y: 24 },
    { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
    heroTransitionStart + TRANSITION * 0.7
  );

  // Rest center for planet 0
  restCenters.push(heroTransitionStart + TRANSITION + HOLD / 2);

  // Reserve hold time after planet 0 arrives
  timeline.to({}, { duration: HOLD }, heroTransitionStart + TRANSITION);

  // ─── Phase 3: Planet-to-planet forward travel ─────────────────────────
  // Smooth forward movement — no dip. Camera glides directly to the next planet.
  for (let index = 1; index < planetCount; index++) {
    const transitionStart =
      HOLD + TRANSITION + HOLD + (index - 1) * (TRANSITION + HOLD);

    // Single smooth forward tween — camera travels directly to the next lookAt
    timeline.to(
      camera,
      {
        targetX: lookAt[index].x,
        targetY: lookAt[index].y,
        targetZ: lookAt[index].z,
        distance: rest[index],
        duration: TRANSITION,
        ease: "power2.inOut",
      },
      transitionStart
    );

    // Previous panel fades out, new panel fades in
    timeline.to(
      planetPanels[index - 1],
      { autoAlpha: 0, y: -20, duration: 0.3, ease: "power2.in" },
      transitionStart
    );

    timeline.fromTo(
      planetPanels[index],
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
      transitionStart + TRANSITION * 0.7
    );

    // Rest center for this planet
    restCenters.push(transitionStart + TRANSITION + HOLD / 2);

    // Reserve hold time
    timeline.to({}, { duration: HOLD }, transitionStart + TRANSITION);
  }

  // ─── ScrollTrigger binding ────────────────────────────────────────────
  const totalDuration = timeline.duration();
  const restPoints = restCenters.map((center) => center / totalDuration);
  const stepCount = restPoints.length - 1;

  const scrollTrigger = ScrollTrigger.create({
    trigger,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    animation: timeline,
    snap: {
      snapTo: restPoints,
      duration: { min: 0.2, max: 0.6 },
      ease: "power1.inOut",
      delay: 0.05,
    },
    onUpdate: (self) => {
      // -1 = hero, 0+ = planet index
      const rawIndex = Math.round(self.progress * stepCount);
      onActive(rawIndex - 1);
    },
  });

  return { scrollTrigger, timeline, restPoints };
}
