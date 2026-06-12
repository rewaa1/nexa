/** Tunable constants for the solar-system landing page. */

/**
 * Tilt of the orbit plane — zero for a linear arrangement along the X axis.
 * The camera flies forward through the planet line, not around a tilted ring.
 */
export const TILT = 0;

/** Scroll timeline units: length of a transition vs. the rest/hold on a section. */
export const TRANSITION = 1;
export const HOLD = 0.5;

/**
 * How far ahead the camera looks toward the next planet (0–1 blend).
 * Shifts the active planet to the left of frame and reveals the next planet on the right.
 */
export const LOOK_AHEAD = 0.15;

/** Scroll height per section (vh). Total scroll = (planets + 1 for hero) × this. */
export const SCROLL_VH_PER_SECTION = 120;

/**
 * Camera viewing direction (offset from the focus point, normalised in the scene).
 * Mostly looking forward along -X (toward increasing planet positions),
 * with a slight Y lift and Z offset so the camera sits behind and to the right
 * of the planet — giving the cinematic first-person "in-orbit" framing.
 */
export const CAM_DIR: [number, number, number] = [-1, 0.2, 0.5];

/** Camera field of view — slightly narrower for a cinematic first-person feel. */
export const CAMERA_FOV = 55;

/** Where the planet textures live under /public. */
export const TEXTURE_PATH = "/textures/planets/";

/** Renderer / grade. */
export const TONE_EXPOSURE = 1.1;

/** Lower fog density so distant planets remain visible across the wide gaps. */
export const FOG_DENSITY = 0.003;

/** Bloom (UnrealBloomPass). */
export const BLOOM = {
  strength: 0.85,
  mobileStrength: 0.55,
  radius: 0.5,
  threshold: 0.6,
};

/** Blue star core + key light. */
export const STAR = {
  radius: 2.2,
  lightColor: 0x4d8bff,
  lightIntensity: 320,
};

/** Soft fill so dark sides are never pure black. */
export const ENV_MAP_INTENSITY = 0.55;
export const AMBIENT = { color: 0x1a2a44, intensity: 0.3 };

/** Star field particle counts. */
export const STARS = { desktop: 2400, mobile: 800 };

/**
 * Camera rest distance from a planet of radius r.
 * Close enough that the planet fills the left side of the viewport
 * and extends beyond the edge — the "in-orbit first-person" feel.
 */
export const restDistance = (radius: number) => radius * 2.2 + 0.3;

/**
 * Camera distance for the hero overview — far enough to frame the whole system.
 * Camera sits far behind looking forward down the planet line.
 */
export const HERO_DISTANCE = 40;

/** Hero camera target — centered along the planet line so the whole system is framed. */
export const HERO_TARGET: [number, number, number] = [20, 0, 0];

/** Opacity of the orbit ring torus — very subtle for the linear layout. */
export const ORBIT_RING_OPACITY = 0.03;

/* ─────────────────────────────────────────────── */
/*  Planet data                                    */
/* ─────────────────────────────────────────────── */

export interface SolarPlanet {
  /** Display name. */
  name: string;
  /** Kicker label above the title. */
  kicker: string;
  /** Section heading. */
  title: string;
  /** Section body text. */
  description: string;
  /** Planet mesh radius — larger for an imposing first-person feel. */
  radius: number;
  /** Distance from the star along the X axis. Wide spacing so the next planet appears small. */
  orbit: number;
  /** Angle on the orbit (radians). Zero → planet sits on the positive X axis. */
  angle: number;
  /** Texture file under TEXTURE_PATH. */
  texture: string;
  /** Tint multiplied over the (grey) texture → palette. */
  tint: number;
}

/**
 * Five fictional planets arranged linearly along the X axis.
 * Wide spacing means the "next planet" appears small and distant on the right
 * while the active planet fills the left side of the viewport.
 */
export const PLANETS: SolarPlanet[] = [
  {
    name: "Aethon",
    kicker: "Orbit 01 — Aethon",
    title: "The Awakening",
    description:
      "Where ideas ignite. Every journey starts with a single spark — the moment raw curiosity meets unbounded ambition.",
    radius: 1.4,
    orbit: 5.0,
    angle: 0,
    texture: "2k_eris_fictional.jpg",
    tint: 0x8fa6c8,
  },
  {
    name: "Veylith",
    kicker: "Orbit 02 — Veylith",
    title: "The Forge",
    description:
      "Tempered by iteration. We shape concepts through relentless craft until they crystallize into something extraordinary.",
    radius: 1.7,
    orbit: 14.0,
    angle: 0,
    texture: "2k_ceres_fictional.jpg",
    tint: 0xc89372,
  },
  {
    name: "Thalara",
    kicker: "Orbit 03 — Thalara",
    title: "The Current",
    description:
      "Design in motion. Systems that breathe, adapt, and flow — alive with purpose at every scale.",
    radius: 1.2,
    orbit: 24.0,
    angle: 0,
    texture: "2k_haumea_fictional.jpg",
    tint: 0x7fc4b6,
  },
  {
    name: "Novaryn",
    kicker: "Orbit 04 — Novaryn",
    title: "The Expanse",
    description:
      "Scaling outward. From a single point of light to a constellation — building systems that endure.",
    radius: 1.6,
    orbit: 35.0,
    angle: 0,
    texture: "2k_makemake_fictional.jpg",
    tint: 0xa890c8,
  },
  {
    name: "Pyralis",
    kicker: "Orbit 05 — Pyralis",
    title: "The Arrival",
    description:
      "You've reached the edge of the map. What we build next is uncharted. Let's make contact.",
    radius: 1.5,
    orbit: 48.0,
    angle: 0,
    texture: "2k_moon.jpg",
    tint: 0xc88a66,
  },
];
