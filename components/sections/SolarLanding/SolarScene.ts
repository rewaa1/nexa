import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

import { POSITION_VERT, STAR_CORE_FRAG, STAR_CORONA_FRAG } from "./solarShaders";
import type { SolarPlanet } from "./solarConfig";
import {
  AMBIENT,
  BLOOM,
  CAM_DIR,
  CAMERA_FOV,
  ENV_MAP_INTENSITY,
  FOG_DENSITY,
  HERO_DISTANCE,
  HERO_TARGET,
  LOOK_AHEAD,
  ORBIT_RING_OPACITY,
  restDistance,
  STAR,
  STARS,
  TEXTURE_PATH,
  TILT,
  TONE_EXPOSURE,
} from "./solarConfig";

/**
 * Owns the entire WebGL scene: a glowing blue star (key light) with textured PBR
 * planets arranged linearly along the X axis. Image-based lighting, starfield,
 * and bloom post-processing. Framework-agnostic — React drives it via `focus()`.
 *
 * The camera flies forward along the planet line. Look-ahead offsets shift the
 * active planet left of center so the next planet peeks on the right.
 */
export class SolarScene {
  /** World position of each planet (camera targets). */
  readonly planetPositions: THREE.Vector3[] = [];

  /**
   * Camera look-at targets with look-ahead offset toward the next planet.
   * For planet i (not last): lerp(pos[i], pos[i+1], LOOK_AHEAD).
   * For the last planet: its own position (no peek).
   */
  readonly lookAtTargets: THREE.Vector3[] = [];

  /** Camera rest distance per planet. */
  readonly restDistances: number[];

  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly composer: EffectComposer;
  private readonly direction: THREE.Vector3;
  private readonly tempVector = new THREE.Vector3();
  private readonly isMobile = window.innerWidth < 768;

  private readonly starMesh: THREE.Mesh;
  private readonly starMaterial: THREE.ShaderMaterial;
  private readonly planets: THREE.Mesh[] = [];
  private readonly starField: THREE.Points;
  private readonly textures: THREE.Texture[] = [];
  private readonly pmremGenerator: THREE.PMREMGenerator;
  private readonly environmentRenderTarget: THREE.WebGLRenderTarget;
  private animationFrameId = 0;

  constructor(canvas: HTMLCanvasElement, private readonly planetData: SolarPlanet[]) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    this.direction = new THREE.Vector3(...CAM_DIR).normalize();
    this.restDistances = planetData.map((planet) => restDistance(planet.radius));

    // --- renderer ---
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(viewportWidth, viewportHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = TONE_EXPOSURE;

    // --- scene basics ---
    this.scene.background = new THREE.Color(0x060606);
    this.scene.fog = new THREE.FogExp2(0x060606, FOG_DENSITY);
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, viewportWidth / viewportHeight, 0.1, 400);

    // --- image-based lighting → soft fill so dark sides are never pure black ---
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.environmentRenderTarget = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.environmentRenderTarget.texture;

    // --- blue star light ---
    this.scene.add(new THREE.PointLight(STAR.lightColor, STAR.lightIntensity, 0, 2));
    this.scene.add(new THREE.AmbientLight(AMBIENT.color, AMBIENT.intensity));

    // --- star core + corona ---
    this.starMaterial = new THREE.ShaderMaterial({
      vertexShader: POSITION_VERT,
      fragmentShader: STAR_CORE_FRAG,
      uniforms: { uTime: { value: 0 } },
    });
    this.starMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(STAR.radius, 5),
      this.starMaterial
    );
    this.scene.add(this.starMesh);

    // corona shell — back-facing, additive-blended glow around the core
    this.scene.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(STAR.radius * 1.4, 48, 48),
        new THREE.ShaderMaterial({
          vertexShader: POSITION_VERT,
          fragmentShader: STAR_CORONA_FRAG,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        })
      )
    );

    this.buildPlanets();
    this.starField = this.buildStarField();
    this.composer = this.buildComposer(viewportWidth, viewportHeight);

    // Start the camera at the hero overview position
    this.focus(HERO_TARGET[0], HERO_TARGET[1], HERO_TARGET[2], HERO_DISTANCE);
  }

  /* ─────────────────────────────────────────── */
  /*  Build                                      */
  /* ─────────────────────────────────────────── */

  private buildPlanets() {
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = TILT;
    this.scene.add(orbitGroup);

    const textureLoader = new THREE.TextureLoader();
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

    this.planetData.forEach((planet) => {
      // Orbit ring — faint torus for context
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(planet.orbit, 0.012, 3, 240),
        new THREE.MeshBasicMaterial({ color: 0xebe8e0, transparent: true, opacity: ORBIT_RING_OPACITY })
      );
      ring.rotation.x = Math.PI / 2;
      orbitGroup.add(ring);

      // Planet group positioned on the orbit
      const planetGroup = new THREE.Group();
      planetGroup.position.set(
        Math.cos(planet.angle) * planet.orbit,
        0,
        Math.sin(planet.angle) * planet.orbit
      );
      orbitGroup.add(planetGroup);

      // Textured PBR sphere
      const texture = textureLoader.load(TEXTURE_PATH + planet.texture);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = maxAnisotropy;
      this.textures.push(texture);

      const segmentsLatitude = this.isMobile ? 48 : 96;
      const segmentsLongitude = this.isMobile ? 32 : 64;

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(planet.radius, segmentsLatitude, segmentsLongitude),
        new THREE.MeshStandardMaterial({
          map: texture,
          bumpMap: texture,
          bumpScale: 0.03,
          color: new THREE.Color(planet.tint),
          roughness: 0.92,
          metalness: 0,
          envMapIntensity: ENV_MAP_INTENSITY,
        })
      );
      mesh.rotation.y = Math.random() * Math.PI;
      planetGroup.add(mesh);
      this.planets.push(mesh);
    });

    // Resolve world positions after the matrix hierarchy is fully built
    this.scene.updateMatrixWorld(true);
    this.planets.forEach((planet) =>
      this.planetPositions.push(planet.getWorldPosition(new THREE.Vector3()))
    );

    // Precompute look-at targets with look-ahead offset toward the next planet
    for (let index = 0; index < this.planetPositions.length; index++) {
      if (index < this.planetPositions.length - 1) {
        const target = new THREE.Vector3().lerpVectors(
          this.planetPositions[index],
          this.planetPositions[index + 1],
          LOOK_AHEAD
        );
        this.lookAtTargets.push(target);
      } else {
        // Last planet — no peek, look at it directly
        this.lookAtTargets.push(this.planetPositions[index].clone());
      }
    }
  }

  private buildStarField() {
    const particleCount = this.isMobile ? STARS.mobile : STARS.desktop;
    const positions = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index++) {
      const radius = 60 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[index * 3 + 2] = radius * Math.cos(phi);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const starField = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xebe8e0,
        size: 0.07,
        transparent: true,
        opacity: 0.6,
      })
    );
    this.scene.add(starField);
    return starField;
  }

  private buildComposer(width: number, height: number) {
    const composer = new EffectComposer(this.renderer);
    composer.addPass(new RenderPass(this.scene, this.camera));
    composer.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(width, height),
        this.isMobile ? BLOOM.mobileStrength : BLOOM.strength,
        BLOOM.radius,
        BLOOM.threshold
      )
    );
    composer.addPass(new OutputPass());
    return composer;
  }

  /* ─────────────────────────────────────────── */
  /*  Public API                                 */
  /* ─────────────────────────────────────────── */

  /** Point the camera at a focus position from the fixed viewing direction. */
  focus(targetX: number, targetY: number, targetZ: number, distance: number) {
    this.tempVector.set(targetX, targetY, targetZ);
    this.camera.position.copy(this.tempVector).addScaledVector(this.direction, distance);
    this.camera.lookAt(this.tempVector);
  }

  start() {
    const renderLoop = () => {
      this.animationFrameId = requestAnimationFrame(renderLoop);
      this.starMaterial.uniforms.uTime.value += 0.016;
      this.starMesh.rotation.y += 0.0008;
      // Planets spin in place; orbital positions stay fixed for scroll control
      this.planets.forEach((planet) => (planet.rotation.y += 0.0012));
      this.starField.rotation.y += 0.0002;
      this.composer.render();
    };
    this.animationFrameId = requestAnimationFrame(renderLoop);
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  dispose() {
    cancelAnimationFrame(this.animationFrameId);
    this.textures.forEach((texture) => texture.dispose());
    this.environmentRenderTarget.dispose();
    this.pmremGenerator.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
        object.geometry.dispose();
        const material = object.material;
        if (Array.isArray(material)) material.forEach((mat) => mat.dispose());
        else material.dispose();
      }
    });
    this.composer.dispose();
    this.renderer.dispose();
  }
}
