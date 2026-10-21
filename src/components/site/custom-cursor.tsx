"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

type CursorVariant =
  | "default"
  | "pointer"
  | "text"
  | "grab"
  | "grabbing"
  | "wait"
  | "not-allowed"
  | "crosshair"
  | "move"
  | "resize-horizontal"
  | "resize-vertical"
  | "resize-diagonal"
  | "zoom-in"
  | "zoom-out"
  | "help"
  | "hidden"
  | "native";

const cursorAliases: Record<string, CursorVariant> = {
  alias: "pointer",
  "all-scroll": "move",
  cell: "crosshair",
  "col-resize": "resize-horizontal",
  "context-menu": "default",
  copy: "pointer",
  "e-resize": "resize-horizontal",
  ewResize: "resize-horizontal",
  "ew-resize": "resize-horizontal",
  grab: "grab",
  grabbing: "grabbing",
  help: "help",
  move: "move",
  "n-resize": "resize-vertical",
  "ne-resize": "resize-diagonal",
  "nesw-resize": "resize-diagonal",
  "no-drop": "not-allowed",
  "not-allowed": "not-allowed",
  "nw-resize": "resize-diagonal",
  "nwse-resize": "resize-diagonal",
  none: "hidden",
  "ns-resize": "resize-vertical",
  "row-resize": "resize-vertical",
  "s-resize": "resize-vertical",
  "se-resize": "resize-diagonal",
  "sw-resize": "resize-diagonal",
  text: "text",
  "vertical-text": "text",
  wait: "wait",
  "w-resize": "resize-horizontal",
  "zoom-in": "zoom-in",
  "zoom-out": "zoom-out",
  pointer: "pointer",
  progress: "wait",
  crosshair: "crosshair",
  default: "default",
  auto: "default",
  native: "native",
  interactive: "pointer",
};

const editableSelector = [
  "input:not([type='button']):not([type='submit']):not([type='checkbox']):not([type='radio']):not([type='reset'])",
  "textarea",
  "[contenteditable='true']",
].join(",");

const interactiveSelector = [
  "a[href]",
  "button",
  "input[type='button']",
  "input[type='submit']",
  "input[type='reset']",
  "input[type='checkbox']",
  "input[type='radio']",
  "select",
  "summary",
  "label[for]",
  "[role='button']",
  "[role='link']",
].join(",");

function resolveCursor(target: EventTarget | null): CursorVariant {
  if (!(target instanceof Element)) return "default";

  const explicitCursor = target.closest("[data-cursor]")?.getAttribute("data-cursor");
  if (explicitCursor && cursorAliases[explicitCursor]) {
    return cursorAliases[explicitCursor];
  }

  if (target.closest(":disabled, [aria-disabled='true']")) return "not-allowed";

  for (let element: Element | null = target; element; element = element.parentElement) {
    const cursorClass = [...element.classList].find(
      (name) => !name.includes(":") && name.startsWith("cursor-"),
    );

    if (cursorClass) {
      const variant = cursorAliases[cursorClass.slice("cursor-".length)];
      if (variant) return variant;
    }
  }

  if (target.closest(editableSelector)) return "text";
  if (target.closest("[draggable='true']")) return "grab";
  if (target.closest(interactiveSelector)) return "pointer";

  return "default";
}

function CursorGlyph({ variant }: { variant: CursorVariant }) {
  const iconProps = {
    "aria-hidden": true as const,
    className: "absolute left-0 top-0 overflow-visible drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.35)]",
    fill: "none",
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.85 },
    transition: { duration: 0.1 },
  };

  switch (variant) {
    case "pointer":
    case "grab":
    case "grabbing":
      return (
        <motion.svg
          key={variant}
          width="22"
          height="23.5"
          viewBox="0 0 30 32"
          style={{ x: -6, y: -1.5 }}
          {...iconProps}
          animate={{
            opacity: 1,
            scale: variant === "grabbing" ? 0.94 : 1,
            rotate: variant === "grabbing" ? -5 : 0,
          }}
        >
          {variant === "pointer" ? (
            <path
              d="M9.5 3.5a2 2 0 0 1 4 0v7.1l.9-.8a2 2 0 0 1 2.8.1l.5.5a2 2 0 0 1 2.7.5l.3.4a2 2 0 0 1 2.8 1.7v3.6c0 4-2.8 6.8-6.7 6.8h-2.1c-1.6 0-3.1-.7-4.2-1.8l-5.1-5.5a2.1 2.1 0 0 1 3.1-2.9l2 2.1V3.5Z"
              fill="#111113"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          ) : variant === "grab" ? (
            <path
              d="M8 10V6.5a2 2 0 0 1 4 0V10 5a2 2 0 0 1 4 0v5-3a2 2 0 0 1 4 0v4-1a2 2 0 0 1 4 0v5.5c0 4.5-3 7.5-7 7.5h-2c-2 0-3.5-.8-4.8-2.3l-4.5-5.3a2.1 2.1 0 0 1 3-2.9L8 14V10Z"
              fill="#111113"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M9 8V5a2 2 0 0 1 4 0v7-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v7-4a2 2 0 0 1 4 0v7c0 4.5-3 7.5-7 7.5h-2c-2 0-3.5-.8-4.8-2.3l-4.5-5.3a2.1 2.1 0 0 1 3-2.9L9 12V8Z"
              fill="#111113"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          )}
        </motion.svg>
      );

    case "text":
      return (
        <motion.svg key={variant} width="12" height="20" viewBox="0 0 18 28" style={{ x: -6, y: -10 }} {...iconProps}>
          <path d="M9 2v24M5 2h8M5 26h8" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M9 2v24M5 2h8M5 26h8" stroke="#111113" strokeWidth="2" strokeLinecap="round" />
        </motion.svg>
      );

    case "wait":
      return (
        <motion.svg
          key={variant}
          width="18"
          height="18"
          viewBox="0 0 25 25"
          style={{ x: -9, y: -9 }}
          {...iconProps}
          animate={{ opacity: 1, scale: 1, rotate: 360 }}
          transition={{ rotate: { duration: 0.85, ease: "linear", repeat: Infinity }, default: { duration: 0.1 } }}
        >
          <circle cx="12.5" cy="12.5" r="9" stroke="white" strokeWidth="5" />
          <path d="M12.5 3.5a9 9 0 0 1 9 9" stroke="#111113" strokeWidth="3" strokeLinecap="round" />
          <circle cx="12.5" cy="12.5" r="2" fill="#111113" />
        </motion.svg>
      );

    case "not-allowed":
      return (
        <motion.svg key={variant} width="18" height="18" viewBox="0 0 26 26" style={{ x: -9, y: -9 }} {...iconProps}>
          <circle cx="13" cy="13" r="10" fill="#111113" stroke="white" strokeWidth="2.5" />
          <path d="m6 6 14 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </motion.svg>
      );

    case "crosshair":
      return (
        <motion.svg key={variant} width="20" height="20" viewBox="0 0 28 28" style={{ x: -10, y: -10 }} {...iconProps}>
          <circle cx="14" cy="14" r="6" fill="#111113" stroke="white" strokeWidth="2" />
          <path d="M14 1v7m0 12v7M1 14h7m12 0h7" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <path d="M14 1v7m0 12v7M1 14h7m12 0h7" stroke="#111113" strokeWidth="1.5" strokeLinecap="round" />
        </motion.svg>
      );

    case "move":
    case "resize-horizontal":
    case "resize-vertical":
    case "resize-diagonal": {
      const path =
        variant === "resize-horizontal"
          ? "M2 15h26M2 15l6-6m-6 6 6 6M28 15l-6-6m6 6-6 6"
          : variant === "resize-vertical"
            ? "M15 2v26m0-26-6 6m6-6 6 6m-6 20-6-6m6 6 6-6"
            : variant === "resize-diagonal"
              ? "m5 25 20-20M5 25v-8m0 8h8M25 5h-8m8 0v8"
              : "M15 1v28m0-28-5 5m5-5 5 5m-5 22-5-5m5 5 5-5M1 15h28m-28 0 5-5m-5 5 5 5m22-5-5-5m5 5-5 5";

      return (
        <motion.svg key={variant} width="21" height="21" viewBox="0 0 30 30" style={{ x: -10.5, y: -10.5 }} {...iconProps}>
          <path
            d={path}
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path}
            fill="none"
            stroke="#111113"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      );
    }

    case "zoom-in":
    case "zoom-out":
      return (
        <motion.svg key={variant} width="20" height="20" viewBox="0 0 28 28" style={{ x: -8, y: -8 }} {...iconProps}>
          <circle cx="10.5" cy="10.5" r="7.5" fill="white" stroke="#111113" strokeWidth="2.5" />
          <path d="M16 16 26 26" stroke="white" strokeWidth="5" strokeLinecap="round" />
          <path d="M16 16 26 26" stroke="#111113" strokeWidth="2.5" strokeLinecap="round" />
          <path d={variant === "zoom-in" ? "M7 10.5h7m-3.5-3.5v7" : "M7 10.5h7"} stroke="#111113" strokeWidth="1.8" strokeLinecap="round" />
        </motion.svg>
      );

    case "help":
      return (
        <motion.svg key={variant} width="17" height="21" viewBox="0 0 24 30" style={{ x: -1.5, y: -1.5 }} {...iconProps}>
          <path d="M3 2v23l5-5 4 8 4-2-4-8 8-.5L3 2Z" fill="#111113" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="18" cy="7" r="6" fill="#111113" stroke="white" strokeWidth="1.5" />
          <path d="M16.7 5.5a1.4 1.4 0 1 1 2.3 1.1c-.8.6-1 1-1 1.8m0 2.1v.1" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        </motion.svg>
      );

    default:
      return (
        <motion.svg key={variant} width="17" height="24" viewBox="0 0 17 24" style={{ x: -1, y: -1 }} {...iconProps}>
          <path
            d="M1.5 1.5v17.5l4.2-4.1 2.8 6.6 3-1.3-2.8-6.4h6.1L1.5 1.5Z"
            fill="#111113"
            stroke="white"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </motion.svg>
      );
  }
}

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<CursorVariant>("default");
  const [pressed, setPressed] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 900, damping: 65, mass: 0.12 });
  const springY = useSpring(y, { stiffness: 900, damping: 65, mass: 0.12 });

  useEffect(() => {
    const pointerQuery = window.matchMedia("(pointer: fine) and (hover: hover)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePointerSupport = () => {
      setEnabled(pointerQuery.matches && !reducedMotionQuery.matches);
    };

    updatePointerSupport();
    pointerQuery.addEventListener("change", updatePointerSupport);
    reducedMotionQuery.addEventListener("change", updatePointerSupport);
    return () => {
      pointerQuery.removeEventListener("change", updatePointerSupport);
      reducedMotionQuery.removeEventListener("change", updatePointerSupport);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove("custom-cursor-enabled");
      return;
    }

    document.documentElement.classList.add("custom-cursor-enabled");

    const updateCursor = (target: EventTarget | null) => {
      const nextVariant = resolveCursor(target);
      setVariant((current) => (current === nextVariant ? current : nextVariant));
      setVisible(nextVariant !== "hidden" && nextVariant !== "native");
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x.set(event.clientX);
      y.set(event.clientY);
      updateCursor(event.target);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      setPressed(true);
      updateCursor(event.target);
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      setPressed(false);
      updateCursor(event.target);
    };
    const hideCursor = () => {
      setVisible(false);
      setPressed(false);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });
    window.addEventListener("blur", hideCursor);
    document.documentElement.addEventListener("pointerleave", hideCursor);

    return () => {
      document.documentElement.classList.remove("custom-cursor-enabled");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("blur", hideCursor);
      document.documentElement.removeEventListener("pointerleave", hideCursor);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const visualVariant = pressed && variant === "grab" ? "grabbing" : variant;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100]"
      style={{ x: springX, y: springY, opacity: visible ? 1 : 0 }}
      animate={{ scale: pressed ? 0.9 : 1 }}
      transition={{ scale: { type: "spring", stiffness: 600, damping: 30 }, opacity: { duration: 0.12 } }}
    >
      <div className="origin-top-left">
        <motion.span
          className="absolute -left-[9px] -top-[9px] size-[18px] rounded-full bg-white/20 backdrop-blur-[2px]"
          animate={{
            opacity: visualVariant === "pointer" ? 1 : 0,
            scale: visualVariant === "pointer" ? 1 : 0.7,
          }}
          transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.45 }}
        />
        <AnimatePresence initial={false} mode="wait">
          <CursorGlyph key={visualVariant} variant={visualVariant} />
        </AnimatePresence>
      </div>
    </motion.div>
  );
}