"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TILT = 1.0;
const RING_R = [3.5, 5, 6.5, 8, 9.5]; // one orbit per section
const DIST_IN = 3.0; // camera distance when reading a section
const DIST_MID = 7.5; // "fly" pull-back during travel
const DIST_OUT = 20; // "zoom" full-overview pull-back
const T = 1; // transition length (timeline units)
const H = 0.5; // rest/hold length

type Node = {
  nav: string;
  kicker: string;
  title: string;
  kind: "about" | "work" | "process" | "services" | "contact";
};

const NODES: Node[] = [
  { nav: "About", kicker: "Orbit 01 — About", title: "We build worlds", kind: "about" },
  { nav: "Work", kicker: "Orbit 02 — Work", title: "Selected transmissions", kind: "work" },
  { nav: "Process", kicker: "Orbit 03 — Process", title: "How we navigate", kind: "process" },
  { nav: "Services", kicker: "Orbit 04 — Services", title: "What we do", kind: "services" },
  { nav: "Contact", kicker: "Orbit 05 — Landing", title: "Make contact", kind: "contact" },
];

const WORK = [
  { t: "Nova Finance", c: "SaaS platform", y: "2026" },
  { t: "Atlas Commerce", c: "E-commerce", y: "2025" },
  { t: "Solace", c: "Brand & site", y: "2025" },
  { t: "Pulse", c: "Campaign", y: "2024" },
];
const PROCESS = [
  { n: "01", t: "Plot", d: "Strategy, story and the map of the whole journey." },
  { n: "02", t: "Build", d: "Design and engineering in one tight, motion-led loop." },
  { n: "03", t: "Launch", d: "Ship to live orbit — fast, polished, measured." },
];
const SERVICES = ["Strategy", "Design", "Web Development", "Motion & 3D", "Brand systems"];

const PLANET_VERT = /* glsl */ `
  varying vec3 vN; varying vec3 vView; varying vec3 vPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - wp.xyz);
    vPos = position;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const PLANET_FRAG = /* glsl */ `
  uniform vec3 uBase; uniform vec3 uAccent; uniform vec3 uLight;
  varying vec3 vN; varying vec3 vView; varying vec3 vPos;
  float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9,78.2,37.7)))*43758.5); }
  void main(){
    float fres = pow(1.0 - max(dot(vN, vView), 0.0), 3.0);
    float light = clamp(dot(vN, normalize(uLight)), 0.0, 1.0);
    float n = hash(floor(vPos*6.0))*0.03;
    vec3 surf = uBase*(0.35 + 0.65*light) + n;
    gl_FragColor = vec4(mix(surf, uAccent, fres*0.85), 1.0);
  }
`;
const ATMO_FRAG = /* glsl */ `
  uniform vec3 uAccent; uniform float uIntensity;
  varying vec3 vN; varying vec3 vView; varying vec3 vPos;
  void main(){
    float fres = pow(1.0 - max(dot(vN, vView), 0.0), 2.0);
    gl_FragColor = vec4(uAccent, fres * uIntensity);
  }
`;

export default function OrbitMap3D() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<"fly" | "zoom">("fly");
  const [reduced, setReduced] = useState(false);
  const stRef = useRef<ScrollTrigger | null>(null);
  const restRef = useRef<number[]>([]);

  const jumpTo = (i: number) => {
    const st = stRef.current;
    const rest = restRef.current[i];
    if (!st || rest == null) return;
    window.scrollTo({ top: st.start + rest * (st.end - st.start), behavior: "smooth" });
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }
    const wrapEl = wrap.current;
    const canvas = canvasRef.current;
    if (!wrapEl || !canvas) return;

    const camMode =
      new URLSearchParams(window.location.search).get("cam") === "zoom" ? "zoom" : "fly";
    setMode(camMode);

    const dpr = Math.min(window.devicePixelRatio, 2);
    const isMobile = window.innerWidth < 768;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    const accent = new THREE.Color(0xff3d1f);

    // planet + atmosphere
    const planetMat = new THREE.ShaderMaterial({
      vertexShader: PLANET_VERT,
      fragmentShader: PLANET_FRAG,
      uniforms: {
        uBase: { value: new THREE.Color(0x14110f) },
        uAccent: { value: accent },
        uLight: { value: new THREE.Vector3(0.6, 0.5, 0.8) },
      },
    });
    const planet = new THREE.Mesh(new THREE.IcosahedronGeometry(2, isMobile ? 3 : 5), planetMat);
    scene.add(planet);

    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: PLANET_VERT,
      fragmentShader: ATMO_FRAG,
      uniforms: { uAccent: { value: accent }, uIntensity: { value: 0.7 } },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(2.2, 48, 48), atmoMat);
    scene.add(atmo);

    // tilted ring system + section node markers
    const system = new THREE.Group();
    system.rotation.x = TILT;
    scene.add(system);

    const markers: THREE.Mesh[] = [];
    RING_R.forEach((r, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.02, 3, 220),
        new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.18 })
      );
      ring.rotation.x = Math.PI / 2; // lay flat in the system's XZ plane
      system.add(ring);

      const a = -Math.PI / 2 + i * 2.2;
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 18, 18),
        new THREE.MeshBasicMaterial({ color: accent })
      );
      marker.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      system.add(marker);
      markers.push(marker);
    });

    // world positions of each node (for the camera to target)
    scene.updateMatrixWorld(true);
    const nodePos = markers.map((m) => m.getWorldPosition(new THREE.Vector3()));

    // starfield
    const starCount = isMobile ? 500 : 1500;
    const sp = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 24 + Math.random() * 30;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      sp[i * 3] = r * Math.sin(ph) * Math.cos(th);
      sp[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      sp[i * 3 + 2] = r * Math.cos(ph);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xebe8e0, size: 0.06, transparent: true, opacity: 0.5 })
    );
    scene.add(stars);

    const setActiveNode = (idx: number) => {
      markers.forEach((m, i) => {
        gsap.to(m.scale, { x: i === idx ? 1.8 : 1, y: i === idx ? 1.8 : 1, z: i === idx ? 1.8 : 1, duration: 0.5, overwrite: true });
      });
    };
    setActiveNode(0);

    // ── camera rig: look at a target point, sit `dist` away along a fixed dir ──
    const dir = new THREE.Vector3(0, 0.5, 1).normalize();
    const cam = { tx: nodePos[0].x, ty: nodePos[0].y, tz: nodePos[0].z, dist: DIST_IN };
    const tmp = new THREE.Vector3();
    const applyCam = () => {
      tmp.set(cam.tx, cam.ty, cam.tz);
      camera.position.copy(tmp).addScaledVector(dir, cam.dist);
      camera.lookAt(tmp);
    };
    applyCam();

    const ctx = gsap.context(() => {
      const dip = camMode === "zoom" ? DIST_OUT : DIST_MID;
      const N = NODES.length;

      const tl = gsap.timeline({ onUpdate: applyCam });
      const restCenters: number[] = [H / 2];
      tl.to({}, { duration: H });

      for (let i = 1; i < N; i++) {
        const at = H + (i - 1) * (T + H);
        // ease back → travel to the next orbit → zoom in
        tl.to(cam, { dist: dip, duration: 0.45, ease: "power2.in" }, at);
        tl.to(
          cam,
          { tx: nodePos[i].x, ty: nodePos[i].y, tz: nodePos[i].z, duration: 0.9, ease: "power2.inOut" },
          at + 0.1
        );
        tl.to(cam, { dist: DIST_IN, duration: 0.45, ease: "power2.out" }, at + 0.55);
        tl.to(`.om-panel-${i - 1}`, { autoAlpha: 0, y: -20, duration: 0.3, ease: "power2.in" }, at);
        tl.fromTo(
          `.om-panel-${i}`,
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
          at + 0.7
        );
        restCenters.push(at + T + H / 2);
      }

      const total = tl.duration();
      const restPoints = restCenters.map((t) => t / total);
      restRef.current = restPoints;
      const steps = restPoints.length - 1;

      stRef.current = ScrollTrigger.create({
        trigger: wrapEl,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        animation: tl,
        snap: { snapTo: restPoints, duration: { min: 0.2, max: 0.6 }, ease: "power1.inOut", delay: 0.05 },
        onUpdate: (self) => {
          const idx = Math.round(self.progress * steps);
          setActive((cur) => {
            if (cur !== idx) setActiveNode(idx);
            return cur === idx ? cur : idx;
          });
        },
      });

      ScrollTrigger.refresh();
    }, wrap);

    // render loop — scene stays alive between scroll updates
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      planet.rotation.y += 0.0012;
      system.rotation.z += 0.0004;
      stars.rotation.y += 0.0002;
      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(animate);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      ctx.revert();
      planet.geometry.dispose();
      planetMat.dispose();
      atmo.geometry.dispose();
      atmoMat.dispose();
      system.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      starGeo.dispose();
      (stars.material as THREE.Material).dispose();
      renderer.dispose();
    };
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── reduced-motion: plain, readable stacked sections ──
  if (reduced) {
    return (
      <div style={{ background: "var(--bg)", color: "var(--fg)" }}>
        {NODES.map((n, i) => (
          <section key={i} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "6vh 8vw" }}>
            <div style={{ maxWidth: 720, width: "100%" }}>{renderPanelBody(n, true)}</div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div ref={wrap} style={{ position: "relative", height: `${NODES.length * 120}vh`, background: "var(--bg)" }}>
      <canvas ref={canvasRef} aria-hidden style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }} />

      {/* content panels (crisp overlay; crossfade on arrival) */}
      {NODES.map((n, i) => (
        <div
          key={i}
          className={`om-panel-${i}`}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 8vw",
            color: "var(--fg)",
            opacity: i === 0 ? 1 : 0,
            pointerEvents: i === active ? "auto" : "none",
          }}
        >
          <div style={{ maxWidth: 760, width: "100%", textAlign: n.kind === "about" || n.kind === "contact" ? "center" : "left" }}>
            {renderPanelBody(n, false)}
          </div>
        </div>
      ))}

      {/* nav rail */}
      <div style={{ position: "fixed", right: "clamp(1.2rem,3vw,2.4rem)", top: "50%", transform: "translateY(-50%)", zIndex: 2, display: "flex", flexDirection: "column", gap: "0.9rem", alignItems: "flex-end" }}>
        {NODES.map((n, i) => (
          <button key={i} onClick={() => jumpTo(i)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "none", border: "none", cursor: "pointer", color: i === active ? "var(--fg)" : "var(--muted)", padding: 0 }}>
            <span className="eyebrow" style={{ opacity: i === active ? 1 : 0, transition: "opacity 0.3s" }}>{n.nav}</span>
            <span style={{ width: i === active ? 26 : 14, height: 2, background: i === active ? "var(--accent)" : "var(--border)", transition: "all 0.35s" }} />
          </button>
        ))}
      </div>

      {/* mode hint */}
      <div className="eyebrow" style={{ position: "fixed", left: "clamp(1.2rem,3vw,2.4rem)", bottom: "clamp(1.2rem,3vw,2.4rem)", zIndex: 2, color: "var(--muted)" }}>
        Camera: {mode === "zoom" ? "full zoom-out" : "fly along route"}
        {mode === "fly" ? " · ?cam=zoom" : " · ?cam=fly"} · ?view=2d
      </div>
    </div>
  );
}

/** Per-section content. `flat` adds a kicker (used in the reduced-motion stack). */
function renderPanelBody(n: Node, flat: boolean) {
  const kicker = (
    <span className="eyebrow" style={{ color: "var(--accent)" }}>{n.kicker}</span>
  );
  const title = (
    <h2 className="font-display" style={{ fontWeight: 800, fontSize: "clamp(2.2rem, 6vw, 4.6rem)", lineHeight: 1.02, margin: "0.6rem 0 1.4rem", letterSpacing: "-0.01em" }}>
      {n.title}
    </h2>
  );

  return (
    <>
      {kicker}
      {title}

      {n.kind === "about" && (
        <>
          <p style={{ color: "var(--muted)", fontSize: "1.1rem", maxWidth: 520, margin: "0 auto 2rem" }}>
            A small, fiercely focused studio crafting cinematic, story-driven web experiences — SaaS,
            commerce, campaigns and mobile-first apps.
          </p>
          <div style={{ display: "flex", gap: "2.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            {[["Est.", "2026"], ["Missions", "40+"], ["Awards", "12"]].map(([k, v]) => (
              <div key={k}>
                <div className="font-display" style={{ fontWeight: 800, fontSize: "2rem" }}>{v}</div>
                <div className="eyebrow" style={{ color: "var(--muted)" }}>{k}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {n.kind === "work" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {WORK.map((w) => (
            <div key={w.t} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "1.3rem", background: "var(--card)" }}>
              <div className="font-display" style={{ fontWeight: 700, fontSize: "1.25rem" }}>{w.t}</div>
              <div style={{ color: "var(--muted)", marginTop: "0.4rem" }}>{w.c}</div>
              <div className="eyebrow" style={{ color: "var(--accent)", marginTop: "0.8rem" }}>{w.y}</div>
            </div>
          ))}
        </div>
      )}

      {n.kind === "process" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem" }}>
          {PROCESS.map((p) => (
            <div key={p.n}>
              <div className="font-display" style={{ color: "var(--accent)", fontWeight: 800, fontSize: "1.6rem" }}>{p.n}</div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: "1.2rem", margin: "0.3rem 0 0.5rem" }}>{p.t}</div>
              <p style={{ color: "var(--muted)" }}>{p.d}</p>
            </div>
          ))}
        </div>
      )}

      {n.kind === "services" && (
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {SERVICES.map((s, i) => (
            <li key={s} className="font-display" style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", padding: "0.7rem 0", fontWeight: 600, fontSize: "1.4rem" }}>
              <span>{s}</span>
              <span className="eyebrow" style={{ color: "var(--muted)" }}>{String(i + 1).padStart(2, "0")}</span>
            </li>
          ))}
        </ul>
      )}

      {n.kind === "contact" && (
        <>
          <p style={{ color: "var(--muted)", fontSize: "1.1rem", maxWidth: 460, margin: "0 auto 1.6rem" }}>
            You’ve reached the core. Enter orbit with us.
          </p>
          <a href="mailto:hello@orbix.studio" style={{ display: "inline-block", padding: "0.9rem 2rem", border: "1px solid var(--accent)", borderRadius: 999, color: "var(--fg)", textDecoration: "none", letterSpacing: "0.04em" }}>
            hello@orbix.studio →
          </a>
        </>
      )}
    </>
  );
}
