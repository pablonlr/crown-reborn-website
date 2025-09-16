"use client";
import { useEffect, useState } from "react";

export function useSectionProgress(ref) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let id = 0;
    const loop = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const h = window.innerHeight;
        const total = rect.height - h;
        const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
        const p = total > 0 ? scrolled / total : 0;
        setProgress(p);
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [ref]);
  return progress;
}
