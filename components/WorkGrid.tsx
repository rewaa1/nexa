"use client";

import { gsap, ScrollTrigger, useGsap } from "@/lib/useGsap";

type Project = {
  id: number;
  tag: string;
  title: string;
  year: string;
  gradient: string;
  size: "tall" | "short";
};

const PROJECTS: Project[] = [
  {
    id: 1,
    tag: "SaaS Platform",
    title: "Orion Analytics Dashboard",
    year: "2024",
    gradient: "linear-gradient(160deg,#0D0400,#1F0800)",
    size: "tall",
  },
  {
    id: 2,
    tag: "E-commerce",
    title: "Volta Store",
    year: "2025",
    gradient: "linear-gradient(160deg,#00060F,#001428)",
    size: "short",
  },
  {
    id: 3,
    tag: "Mobile PWA",
    title: "Flux App",
    year: "2025",
    gradient: "linear-gradient(160deg,#050010,#130022)",
    size: "short",
  },
];

function Card({ project }: { project: Project }) {
  const tall = project.size === "tall";
  return (
    <a
      href="#"
      data-cursor="view"
      className="work-card group relative flex flex-col justify-end overflow-hidden rounded-[4px] p-6 transition-transform duration-[400ms] ease-out hover:scale-[1.01]"
      style={{
        background: project.gradient,
        border: "0.5px solid var(--border)",
        minHeight: tall ? 320 : 158,
        height: tall ? "100%" : 158,
      }}
    >
      {/* red hover overlay */}
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[400ms] ease-out group-hover:opacity-100"
        style={{ background: "rgba(255,61,31,0.06)" }}
        aria-hidden
      />

      {/* arrow button top-right */}
      <span
        className="absolute right-5 top-5 flex h-[30px] w-[30px] items-center justify-center rounded-full text-[13px] text-fg transition-transform duration-[400ms] ease-out [transform:rotate(45deg)] group-hover:[transform:rotate(0deg)]"
        style={{ border: "0.5px solid var(--border)" }}
        aria-hidden
      >
        ↗
      </span>

      {/* content pinned bottom-left */}
      <div className="relative z-10">
        <div
          className="mb-2 text-[9px] uppercase"
          style={{ letterSpacing: "2px", color: "rgba(235,232,224,0.35)" }}
        >
          {project.tag}
        </div>
        <h3 className="font-display text-[18px] font-bold leading-tight text-fg">
          {project.title}
        </h3>
        <div className="mt-1 text-[10px]" style={{ color: "var(--muted)" }}>
          {project.year}
        </div>
      </div>
    </a>
  );
}

export default function WorkGrid() {
  const { scope, useScopedGsap } = useGsap<HTMLElement>();

  useScopedGsap(() => {
    gsap.from(".work-card", {
      y: 80,
      opacity: 0,
      duration: 1,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: {
        trigger: scope.current,
        start: "top 80%",
      },
    });
    ScrollTrigger.refresh();
  });

  const [tall, ...rest] = PROJECTS;

  return (
    <section
      ref={scope}
      id="work"
      className="mx-auto max-w-[1400px] px-6 py-20 md:px-10 md:py-28"
    >
      <div className="mb-12 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-4" style={{ color: "var(--muted)" }}>
            02 — Selected work
          </p>
          <h2
            className="font-display font-bold leading-[1.05]"
            style={{ fontSize: "clamp(28px,3.4vw,36px)", letterSpacing: "-1px" }}
          >
            Worlds we&rsquo;ve built.
          </h2>
        </div>
        <a
          href="#"
          data-cursor="link"
          className="hidden text-[12px] tracking-wide text-fg/70 transition-colors hover:text-fg md:block"
        >
          All projects ↗
        </a>
      </div>

      <div className="grid grid-cols-1 gap-[2px] md:grid-cols-[1.4fr_1fr]">
        {/* Left tall card */}
        <Card project={tall} />

        {/* Right stacked cards */}
        <div className="grid grid-rows-2 gap-[2px]">
          {rest.map((p) => (
            <Card key={p.id} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
