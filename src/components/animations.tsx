"use client";

import { motion, HTMLMotionProps, Variants } from "motion/react";
import React from "react";
import { cn } from "@/lib/utils";

interface FadeInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
  duration?: number;
  blur?: boolean;
}

const customEase: [number, number, number, number] = [0.16, 1, 0.3, 1]; // Modern, crisp SaaS easing

export function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className,
  duration = 0.8,
  blur = true,
  ...props
}: FadeInProps) {
  const directions = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
    none: { x: 0, y: 0 },
  };

  const initialFilter = blur ? "blur(12px)" : "blur(0px)";
  const animateFilter = "blur(0px)";

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: 0.96, 
        filter: initialFilter,
        ...directions[direction] 
      }}
      whileInView={{ 
        opacity: 1, 
        scale: 1, 
        x: 0, 
        y: 0,
        filter: animateFilter
      }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration, delay, ease: customEase }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className,
  delayChildren = 0.1,
  staggerChildren = 0.08,
  ...props
}: HTMLMotionProps<"div"> & { delayChildren?: number; staggerChildren?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren,
            delayChildren,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInItem({ children, className, direction = "up", blur = true, ...props }: FadeInProps) {
  const directions = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
    none: { x: 0, y: 0 },
  };

  const initialFilter = blur ? "blur(12px)" : "blur(0px)";
  const animateFilter = "blur(0px)";

  const variants: Variants = {
    hidden: { 
      opacity: 0, 
      scale: 0.96,
      filter: initialFilter,
      ...directions[direction] 
    },
    show: { 
      opacity: 1, 
      scale: 1,
      x: 0, 
      y: 0, 
      filter: animateFilter,
      transition: { duration: 0.8, ease: customEase } 
    },
  };

  return (
    <motion.div
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
