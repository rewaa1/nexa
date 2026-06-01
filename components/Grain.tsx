"use client";

import { useEffect, useRef } from "react";

/**
 * Animated film-grain overlay. A small 200×200 noise tile is regenerated a few
 * times per second and tiled across the viewport on a full-screen canvas. Very
 * low alpha keeps it tactile but unobtrusive. Disabled under reduced-motion.
 */
export default function Grain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Offscreen tile we fill with noise.
    const TILE = 200;
    const noise = document.createElement("canvas");
    noise.width = TILE;
    noise.height = TILE;
    const nctx = noise.getContext("2d");
    if (!nctx) return;
    const imageData = nctx.createImageData(TILE, TILE);
    const buffer = imageData.data;

    const generateNoise = () => {
      for (let i = 0; i < buffer.length; i += 4) {
        const value = Math.random() * 255;
        buffer[i] = value; // R
        buffer[i + 1] = value; // G
        buffer[i + 2] = value; // B
        buffer[i + 3] = 18; // A — ~7% opacity
      }
      nctx.putImageData(imageData, 0, 0);
    };

    let width = 0;
    let height = 0;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      // Cap device pixel ratio so we don't paint a huge surface every frame.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const drawTiled = () => {
      ctx.clearRect(0, 0, width, height);
      for (let x = 0; x < width; x += TILE) {
        for (let y = 0; y < height; y += TILE) {
          ctx.drawImage(noise, x, y);
        }
      }
    };

    // Throttle the noise refresh to ~12fps (every 80ms) via rAF.
    let animId = 0;
    let last = 0;
    const REFRESH = 80;
    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      if (time - last < REFRESH) return;
      last = time;
      generateNoise();
      drawTiled();
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, width, height);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 9998,
        pointerEvents: "none",
        opacity: 0.4,
      }}
    />
  );
}
