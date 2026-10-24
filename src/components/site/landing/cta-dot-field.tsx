"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

const GAP = 26;
const RIPPLE_MS = 7000;
const PAUSE_MS = 1400;
const BAND_BEHIND = 140;
const BAND_AHEAD = 30;
const SPOT_RADIUS = 210;

export function CtaDotField() {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const host = wrap?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !host || !ctx) return;

    let w = 0;
    let h = 0;
    const color = "#fff";
    let maxAlpha = 0.5;
    let raf = 0;
    let running = false;
    let visible = true;
    let frameCount = 0;
    let dirty = false;
    let hostRectDirty = true;

    // Cached host bounding rect coordinates (updated lazily, never inside scroll events)
    let hostLeft = 0;
    let hostTop = 0;

    // Cursor state (smooth follow with zero layout queries per frame)
    let pointerX = 0;
    let pointerY = 0;
    let curX = 0;
    let curY = 0;
    let spot = 0;
    let spotTarget = 0;

    // Reusable alpha batch queues to completely eliminate heap allocation during animation
    const b0: number[] = [];
    const b1: number[] = [];
    const b2: number[] = [];
    const b3: number[] = [];

    const readTheme = () => {
      maxAlpha = document.documentElement.classList.contains("dark") ? 0.5 : 0.35;
    };

    const updateHostRectNow = () => {
      const r = host.getBoundingClientRect();
      hostLeft = r.left;
      hostTop = r.top;
      hostRectDirty = false;
    };

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      updateHostRectNow();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (++frameCount % 120 === 0) readTheme();

      // Lazy update of host rect if dirty, ONLY when cursor spotlight is active (zero reflows while scrolling)
      if (hostRectDirty && (spotTarget > 0 || spot > 1)) {
        updateHostRectNow();
      }

      // Center-radiating radar pulse wave
      const phase = t % (RIPPLE_MS + PAUSE_MS);
      const rippleOn = phase < RIPPLE_MS;
      let ring = -9999;
      let rMin = 0;
      let rMax = 0;
      let rMin2 = 0;
      let rMax2 = 0;

      if (rippleOn) {
        const k = phase / RIPPLE_MS;
        const eased = -(Math.cos(Math.PI * k) - 1) / 2;
        ring = -20 + eased * 1200;
        rMin = Math.max(0, ring - BAND_BEHIND);
        rMax = ring + BAND_AHEAD;
        rMin2 = rMin * rMin;
        rMax2 = rMax * rMax;
      }

      // Cursor spotlight
      if (spotTarget > 0 || spot > 1) {
        const tx = pointerX - hostLeft;
        const ty = pointerY - hostTop;
        if (spot < 1) {
          curX = tx;
          curY = ty;
        }
        curX += (tx - curX) * 0.14;
        curY += (ty - curY) * 0.14;
      }
      spot += (spotTarget - spot) * 0.12;
      if (spot < 1) spot = spotTarget === 0 ? 0 : spot;

      const spotOn = spot > 1;
      const spot2 = spot * spot;

      if (!rippleOn && !spotOn) {
        if (dirty) {
          ctx.clearRect(0, 0, w, h);
          dirty = false;
        }
        return;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      dirty = true;

      const ox = w / 2;
      const oy = h / 2;
      const cols = Math.ceil(w / GAP) + 1;
      const rows = Math.ceil(h / (GAP / 2)) + 1;

      // Reset reusable arrays without allocating new heap memory
      b0.length = 0;
      b1.length = 0;
      b2.length = 0;
      b3.length = 0;

      for (let j = 0; j < rows; j++) {
        const y = j * (GAP / 2) + 1;
        const dyCenter = y - oy;
        const dyCenter2 = dyCenter * dyCenter;
        const xOffset = (j % 2 === 1) ? GAP / 2 : 0;

        for (let i = 0; i < cols; i++) {
          const x = i * GAP + xOffset + 1;
          let a = 0;

          if (rippleOn) {
            const dxCenter = x - ox;
            const d2 = dxCenter * dxCenter + dyCenter2;
            if (d2 >= rMin2 && d2 <= rMax2) {
              const d = Math.sqrt(d2);
              a =
                d < ring
                  ? (d - (ring - BAND_BEHIND)) / BAND_BEHIND
                  : 1 - (d - ring) / BAND_AHEAD;
            }
          }

          if (spotOn) {
            const dx = x - curX;
            const dy = y - curY;
            const dist2 = dx * dx + dy * dy;
            if (dist2 < spot2) {
              const s = 1 - Math.sqrt(dist2) / spot;
              if (s > a) a = s;
            }
          }

          if (a > 0.05) {
            if (a < 0.28) {
              b0.push(x - 1, y - 1);
            } else if (a < 0.55) {
              b1.push(x - 1, y - 1);
            } else if (a < 0.8) {
              b2.push(x - 1, y - 1);
            } else {
              b3.push(x - 1, y - 1);
            }
          }
        }
      }

      // Fast batched 4-pass GPU draw calls
      if (b0.length > 0) {
        ctx.globalAlpha = 0.2 * maxAlpha;
        ctx.beginPath();
        for (let k = 0; k < b0.length; k += 2) ctx.rect(b0[k], b0[k + 1], 2, 2);
        ctx.fill();
      }
      if (b1.length > 0) {
        ctx.globalAlpha = 0.45 * maxAlpha;
        ctx.beginPath();
        for (let k = 0; k < b1.length; k += 2) ctx.rect(b1[k], b1[k + 1], 2, 2);
        ctx.fill();
      }
      if (b2.length > 0) {
        ctx.globalAlpha = 0.7 * maxAlpha;
        ctx.beginPath();
        for (let k = 0; k < b2.length; k += 2) ctx.rect(b2[k], b2[k + 1], 2, 2);
        ctx.fill();
      }
      if (b3.length > 0) {
        ctx.globalAlpha = 0.95 * maxAlpha;
        ctx.beginPath();
        for (let k = 0; k < b3.length; k += 2) ctx.rect(b3[k], b3[k + 1], 2, 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const start = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      hostRectDirty = true;
      pointerX = e.clientX;
      pointerY = e.clientY;
      spotTarget = SPOT_RADIUS;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointerX = e.clientX;
      pointerY = e.clientY;
      spotTarget = SPOT_RADIUS;
    };
    const onLeave = () => {
      spotTarget = 0;
    };

    // Fast scroll handler: does NOT call getBoundingClientRect (zero layout reflow)
    const onScroll = () => {
      if (spotTarget > 0 || spot > 1) {
        hostRectDirty = true;
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible ? start() : stop();
    });
    const onVisibility = () => (document.hidden ? stop() : start());

    const ro = new ResizeObserver(resize);
    const mo = new MutationObserver(readTheme);

    readTheme();
    resize();
    ro.observe(wrap);
    io.observe(wrap);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("scroll", onScroll, { passive: true });
    host.addEventListener("pointerenter", onEnter, { passive: true });
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave, { passive: true });
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none transform-gpu absolute inset-0 text-white"
    >
      {/* Static base staggered dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.07]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, var(--color-foreground) 1px, transparent 0),
            radial-gradient(circle at 14px 14px, var(--color-foreground) 1.2px, transparent 0)
          `,
          backgroundSize: `${GAP}px ${GAP}px`,
        }}
      />
      {!reduced && <canvas ref={canvasRef} className="absolute inset-0 size-full" />}
    </div>
  );
}
