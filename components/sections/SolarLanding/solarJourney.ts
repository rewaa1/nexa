import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { HOLD, SWAY_AMPLITUDE, TRANSITION } from "./solarConfig";
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
 * Camera choreography:
 * 1. Hero overview — bird's-eye view from above looking down at the star
 * 2. Crane-down — camera sweeps from overhead to eye-level at planet 1
 * 3. Planet sections — eye-level first-person "in-orbit" view
 * 4. Planet-to-planet — smooth forward travel with right→left→center sway
 *
 * The camera is controlled via 6 animated values (posX/Y/Z + lookX/Y/Z) plus
 * a sway offset layered on top of posZ.
 */
export function buildSolarJourney({
  scene,
  trigger,
  heroPanel,
  planetPanels,
  onActive,
}: SolarJourneyOptions): SolarJourney {
  const heroState = scene.heroState;
  const planetStates = scene.planetStates;
  const planetCount = planetStates.length;

  /**
   * Animated camera state — GSAP tweens these values, onUpdate pushes them
   * to the scene. `swayZ` is added to `posZ` for the lateral sway effect.
   */
  const camera = {
    posX: heroState.posX,
    posY: heroState.posY,
    posZ: heroState.posZ,
    lookX: heroState.lookX,
    lookY: heroState.lookY,
    lookZ: heroState.lookZ,
    swayZ: 0,
  };

  const timeline = gsap.timeline({
    onUpdate: () =>
      scene.setCameraState(
        camera.posX,
        camera.posY,
        camera.posZ + camera.swayZ,
        camera.lookX,
        camera.lookY,
        camera.lookZ
      ),
  });

  // Set initial panel visibility — only hero is visible at start
  gsap.set(heroPanel, { autoAlpha: 1 });
  planetPanels.forEach((panel) => gsap.set(panel, { autoAlpha: 0, y: 24 }));

  const restCenters: number[] = [];

  // ─── Phase 1: Hero hold ───────────────────────────────────────────────
  timeline.to({}, { duration: HOLD });
  restCenters.push(HOLD / 2);

  // ─── Phase 2: Hero → Planet 0 (crane-down) ────────────────────────────
  // Camera sweeps from bird's-eye (Y=80, looking down) to eye-level
  // (Y≈1.5, looking forward). All 6 values interpolate simultaneously.
  const heroTransitionStart = HOLD;
  const planet0 = planetStates[0];

  timeline.to(
    camera,
    {
      posX: planet0.posX,
      posY: planet0.posY,
      posZ: planet0.posZ,
      lookX: planet0.lookX,
      lookY: planet0.lookY,
      lookZ: planet0.lookZ,
      duration: TRANSITION,
      ease: "power2.inOut",
    },
    heroTransitionStart
  );

  // Hero fades out as the crane begins
  timeline.to(
    heroPanel,
    { autoAlpha: 0, y: -20, duration: 0.3, ease: "power2.in" },
    heroTransitionStart
  );

  // First planet panel fades in as the camera arrives at eye-level
  timeline.fromTo(
    planetPanels[0],
    { autoAlpha: 0, y: 24 },
    { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
    heroTransitionStart + TRANSITION * 0.7
  );

  // Rest center for planet 0
  restCenters.push(heroTransitionStart + TRANSITION + HOLD / 2);
  timeline.to({}, { duration: HOLD }, heroTransitionStart + TRANSITION);

  // ─── Phase 3: Planet-to-planet forward travel with sway ───────────────
  for (let index = 1; index < planetCount; index++) {
    const transitionStart =
      HOLD + TRANSITION + HOLD + (index - 1) * (TRANSITION + HOLD);
    const nextState = planetStates[index];

    // Smooth forward travel — all 6 camera values interpolate
    timeline.to(
      camera,
      {
        posX: nextState.posX,
        posY: nextState.posY,
        posZ: nextState.posZ,
        lookX: nextState.lookX,
        lookY: nextState.lookY,
        lookZ: nextState.lookZ,
        duration: TRANSITION,
        ease: "power2.inOut",
      },
      transitionStart
    );

    // Sway: right → left → center (three sequential tweens on swayZ)
    const swaySegment = TRANSITION / 3;

    // 0 → +A (sway right, slow start)
    timeline.to(
      camera,
      {
        swayZ: SWAY_AMPLITUDE,
        duration: swaySegment,
        ease: "power2.out",
      },
      transitionStart
    );

    // +A → -A (swing through center to left, fast middle)
    timeline.to(
      camera,
      {
        swayZ: -SWAY_AMPLITUDE,
        duration: swaySegment,
        ease: "power1.inOut",
      },
      transitionStart + swaySegment
    );

    // -A → 0 (settle at center, slow stop)
    timeline.to(
      camera,
      {
        swayZ: 0,
        duration: swaySegment,
        ease: "power2.in",
      },
      transitionStart + swaySegment * 2
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
