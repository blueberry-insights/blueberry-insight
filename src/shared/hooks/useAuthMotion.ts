
"use client";

import { useReducedMotion, type MotionProps } from "framer-motion";

export function useAuthMotionProps(): MotionProps {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return {
      initial: { opacity: 0, y: -10 },
      animate: { opacity: 1, y: 0 },
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      },
    };
  }

  return {
    initial: { opacity: 0, y: -24 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  };
}
