"use client";
export function useLenisScrollTo() {
  return (target, options) => {
    const lenis = typeof window !== "undefined" ? window.lenis : undefined;
    if (lenis) lenis.scrollTo(target, options);
    else if (typeof target === "string") document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  };
}
