"use client";
import { useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";

export default function SmoothScrollProvider({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isTouchPointer = window.matchMedia("(pointer: coarse)");
    if (prefersReduce.matches || isTouchPointer.matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      easing: t => 1 - Math.pow(1 - t, 3),
      smoothWheel: true
    });
    window.lenis = lenis;
    lenisRef.current = lenis;
    let rafId;
    const raf = time => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      if (window.lenis === lenis) delete window.lenis;
    };
  }, []);

  return children;
}
