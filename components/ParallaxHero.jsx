"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import { useSectionProgress } from "./useSectionProgress";
import clsx from "clsx";

function clamp01(v) { return Math.min(1, Math.max(0, v)); }
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const easeIn = (t) => t * t * t;
function applyEase(t, name) {
  switch (name) {
    case "in": return easeIn(t);
    case "out": return easeOut(t);
    case "inOut": return easeInOut(t);
    case "linear":
    default: return t;
  }
}
function lerp(a, b, t) { return a + (b - a) * t; }
function resolveMark(val, marks) { return typeof val === "string" ? (marks?.[val] ?? 0) : (val ?? 0); }
function getViewportVariant(width) {
  if (width < 600) return "mobile";
  if (width < 1500) return "tablet";
  return "desktop";
}
function segmentProp(seg, prop, variant) {
  if (!variant) return seg?.[prop];
  const variantOverrides = seg?.variants?.[variant] ?? seg?.[variant];
  if (variantOverrides && variantOverrides[prop] !== undefined) return variantOverrides[prop];
  return seg?.[prop];
}
function segStart(seg, vh, variant) {
  const startVh = segmentProp(seg, "startVh", variant);
  if (startVh !== undefined) return startVh * vh;
  const start = segmentProp(seg, "start", variant);
  return start ?? 0;
}
function segEnd(seg, vh, variant) {
  const endVh = segmentProp(seg, "endVh", variant);
  if (endVh !== undefined) return endVh * vh;
  const end = segmentProp(seg, "end", variant);
  return end ?? 0;
}
function trackValue(track, p, vh, marks, variant) {
  if (!track || track.length === 0) return 0;
  const segs = track.map(s => ({
    from: resolveMark(segmentProp(s, "from", variant), marks),
    to: resolveMark(segmentProp(s, "to", variant), marks),
    ease: segmentProp(s, "ease", variant) || s.ease || "inOut",
    start: (vh) => segStart(s, vh, variant),
    end: (vh) => segEnd(s, vh, variant)
  }));
  if (p <= segs[0].from) return segs[0].start(vh);
  const last = segs[segs.length - 1];
  if (p >= last.to) return last.end(vh);
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (p >= s.from && p <= s.to) {
      const t = s.to > s.from ? (p - s.from) / (s.to - s.from) : 1;
      const te = applyEase(clamp01(t), s.ease);
      return lerp(s.start(vh), s.end(vh), te);
    }
  }
  for (let i = segs.length - 1; i >= 0; i--) {
    if (p > segs[i].to) return segs[i].end(vh);
  }
  return segs[0].start(vh);
}

const HERO_CFG = {
  sceneSvH: 640,
  marks: {
    preStart: 0.0,
    preEnd: 0.52,
    introStart: 0.52,
    introEnd: 0.75,
    foreStart: 0.75,
    fgShowEnd: 0.95,
    end: 1
  },
  title: { fadeMult: 1.1 },
  text: {
    title: {
      opacity: [
        { from: "preStart", to: "introStart", ease: "out", start: 0, end: 1 },
        { from: "introStart", to: "end", ease: "linear", start: 1, end: 0.60 },

      ],
      y: [
        { from: "preStart", to: "introStart", ease: "out", start: 24, end: 0, tablet: { start: 28, end: 2 }, mobile: { start: 32, end: 4 } },
        { from: "introStart", to: "foreStart", ease: "linear", start: 0, end: -5, tablet: { end: -6 }, mobile: { end: -8 }},
        { from: "foreStart", to: "end", ease: "inOut", start: -5, end: -45, tablet: { start: -6, end: -42 }, mobile: { start: -8, end: -38 } },

      ],
      blur: [
        { from: "foreStart", to: "fgShowEnd", ease: "inOut", start: 0, end: 3 },
        { from: "fgShowEnd", to: "end",      ease: "inOut", start: 3, end: 6 }
      ]
    },
    subtitle: {
      opacity: [
        { from: 0.08, to: "introStart", ease: "out", start: 0, end: 1 },
        { from: "introStart", to: "foreStart", ease: "linear", start: 1, end: 1 },
        { from: "foreStart", to: "fgShowEnd", ease: "inOut", start: 1, end: 0 }
      ],
      y: [
        { from: 0.08, to: "introStart", ease: "out", start: 20, end: 0, tablet: { start: 24, end: 2 }, mobile: { start: 26, end: 4 } },
        { from: "introStart", to: "foreStart", ease: "linear", start: 0, end: 0 },
        { from: "foreStart", to: "fgShowEnd", ease: "inOut", start: 0, end: -10, tablet: { end: -8 }, mobile: { end: -6 } }
      ]
    },
    claim: {
      opacity: [
        { from: 0.16, to: "introStart", ease: "out", start: 0, end: 1 },
        { from: "introStart", to: "foreStart", ease: "linear", start: 1, end: 1 },
        { from: "foreStart", to: "fgShowEnd", ease: "inOut", start: 1, end: 0 }
      ],
      y: [
        { from: 0.16, to: "introStart", ease: "out", start: 20, end: 0, tablet: { start: 22, end: 1 }, mobile: { start: 24, end: 2 } },
        { from: "introStart", to: "foreStart", ease: "linear", start: 0, end: 0 },
        { from: "foreStart", to: "fgShowEnd", ease: "inOut", start: 0, end: -10, tablet: { end: -8 }, mobile: { end: -6 } }
      ]
    }
  },
  finalText: {
    h: {
      opacity: [
        { from: "fgShowEnd", to: "end",      ease: "linear", start: 0, end: 1 }
      ],
      y: [
        { from: "fgShowEnd", to: "end",      ease: "linear", start: 20, end: -60, tablet: { start: 18, end: -54 }, mobile: { start: 16, end: -48 } }
      ]
    },
    p: {
      opacity: [
        { from: "fgShowEnd", to: "end", ease: "linear", start: 0, end: 1 }
      ],
      y: [
        { from: "fgShowEnd", to: "end", ease: "linear", start: 20, end: -70, tablet: { start: 18, end: -64 }, mobile: { start: 16, end: -60 } }
      ]
    },
    claim: {
      opacity: [
        { from: "fgShowEnd", to: "end", ease: "linear", start: 0, end: 1 }
      ],
      y: [
        { from: "fgShowEnd", to: "end", ease: "out", start: 50, end: -25, tablet: { start: 44, end: -22 }, mobile: { start: 40, end: -20 } }
      ]
    },
    cta: {
      opacity: [
        { from: "fgShowEnd", to: "end", ease: "linear", start: 0, end: 1 }
      ],
      y: [
        { from: "fgShowEnd", to: "end", ease: "out", start: 50, end: -25, tablet: { start: 42, end: -22 }, mobile: { start: 38, end: -20 } }
      ]
    }
  },
  monty: {
    opacity: [
      { from: 0.90, to: "end", ease: "out", start: 0, end: 1 }
    ],
    y: [
      { from: 0.90, to: "end", ease: "inOut", start: 30, end: 0, tablet: { start: 34, end: 0 }, mobile: { start: 40, end: 0 } }
    ],
    widthVw: 10
  },
  migration: {
    opacity: [
      { from: "fgShowEnd", to: "end", ease: "linear", start: 0, end: 1 }
    ],
    y: [
      { from: "fgShowEnd", to: "end", ease: "out", start: 40, end: 0, tablet: { start: 36, end: 0 }, mobile: { start: 32, end: 0 } }
    ]
  },
  layers: {
    b1: {
      scale: [
        { from: "preStart", to: "preEnd", ease: "out", start: 1.00, end: 1.05 },
        { from: "introStart", to: "introEnd", ease: "linear", start: 1.05, end: 1.0 }
        
      ],
      y: [
       { from: "introStart", to: "introEnd", ease: "out", startVh: 0, endVh: -0.15, tablet: { startVh: -0.02, endVh: -0.14 }, mobile: { startVh: -0.05, endVh: -0.12 } },
        { from: "foreStart", to: "end", ease: "inOut", startVh: -0.15, endVh: -0.25, tablet: { startVh: -0.14, endVh: -0.22 }, mobile: { startVh: -0.12, endVh: -0.20 } }
      ]
    },
    b2: {
      y: [
        { from: "preStart", to: "preEnd", ease: "out", startVh: 0.02, endVh: -0.05, tablet: { startVh: 0.03, endVh: -0.05 }, mobile: { startVh: 0.04, endVh: -0.04 } },
        { from: "introStart", to: "introEnd", ease: "out", startVh: -0.05, endVh: -0.15, tablet: { startVh: -0.05, endVh: -0.14 }, mobile: { startVh: -0.04, endVh: -0.12 } },
        { from: "foreStart", to: "end", ease: "inOut", startVh: -0.15, endVh: -0.15, tablet: { startVh: -0.14, endVh: -0.14 }, mobile: { startVh: -0.12, endVh: -0.12 } }
      ]
    },
    b3: {
      y: [
        { from: "preStart", to: "preEnd", ease: "out", startVh: 0.65, endVh: 0.47, tablet: { startVh: 0.64, endVh: 0.46 }, mobile: { startVh: 0.62, endVh: 0.48 } },
        { from: "introStart", to: "introEnd", ease: "out", startVh: 0.47, endVh: 0.31, tablet: { startVh: 0.46, endVh: 0.30 }, mobile: { startVh: 0.48, endVh: 0.33 } },
        { from: "foreStart", to: "end", ease: "inOut", startVh: 0.31, endVh: 0.25, tablet: { startVh: 0.30, endVh: 0.26}, mobile: { startVh: 0.33, endVh: 0.28}}
      ]
    },
    b4: {
      y: [
        { from: "foreStart", to: "fgShowEnd", ease: "inOut", startVh: 0.60, endVh: 0.20, tablet: { startVh: 0.55, endVh: 0.18 }, mobile: { startVh: 0.52, endVh: 0.18 } },
        { from: "fgShowEnd", to: "end",      ease: "inOut", startVh: 0.20, endVh: 0.3, tablet: { startVh: 0.18, endVh: 0.28 }, mobile: { startVh: 0.18, endVh: 0.26 } }
      ],
      widthVw: 120,
      opacity: []
    },
    b5: {
      y: [
        { from: "foreStart", to: "fgShowEnd", ease: "inOut", startVh: 0.60, endVh: 0.20, tablet: { startVh: 0.55, endVh: 0.18 }, mobile: { startVh: 0.52, endVh: 0.18 } },
        { from: "fgShowEnd", to: "end",      ease: "inOut", startVh: 0.20, endVh: 0.3, tablet: { startVh: 0.18, endVh: 0.28 }, mobile: { startVh: 0.18, endVh: 0.26 } }
      ],
      widthVw: 130,
      opacity: []
    }
  }
};

const HERO_ASSETS = [
  "/hero/B1.svg",
  "/hero/B2.svg",
  "/hero/B3.svg",
  "/hero/B4.svg",
  "/hero/B5.svg",
  "/hero/monty.svg",
  "/hero/monty_wise.png"
];

const HERO_LAYOUT = {
  desktop: {
    sceneSvH: HERO_CFG.sceneSvH,
    background: {
      left: "0",
      right: "0",
      translateX: "0",
      widths: {
        b1: "100%",
        b2: "100%",
        b3: "100%"
      }
    },
    foreground: {
      translateX: "-50%",
      widthB4: `${HERO_CFG.layers.b4.widthVw}vw`,
      widthB5: `${HERO_CFG.layers.b5.widthVw}vw`
    },
    migration: {
      left: "3rem",
      translateX: "0",
      width: undefined
    },
    montyWidth: `${HERO_CFG.monty.widthVw}vw`
  },
  tablet: {
    sceneSvH: 520,
    background: {
      left: "45%",
      right: "auto",
      translateX: "-50%",
      widths: {
        b1: "calc(100vw * 2.2)",
        b2: "calc(100vw * 2.2)",
        b3: "calc(100vw * 2.2)"
      }
    },
    foreground: {
      translateX: "-50%",
      widthB4: "calc(100vw * 2.4)",
      widthB5: "calc(100vw * 2.6)"
    },
    migration: {
      left: "20%",
      translateX: "-50%",
      width: "min(85vw, 420px)"
    },
    montyWidth: "14vw"
  },
  mobile: {
    sceneSvH: 800,
    background: {
      left: "35%",
      right: "auto",
      translateX: "-50%",
      widths: {
        b1: "calc(100vw * 4.6)",
        b2: "calc(100vw * 4.6)",
        b3: "calc(100vw * 4.6)"
      }
    },
    foreground: {
      translateX: "-50%",
      widthB4: "calc(100vw * 5.4)",
      widthB5: "calc(100vw * 5.6)"
    },
    migration: {
      left: "20%",
      translateX: "-20%",
      translateY: "-80%",
      width: "min(90vw, 360px)"
    },
    montyWidth: "40vw"
  }
};


export default function ParallaxHero() {
  const containerRef = useRef(null);
  const pRaw = useSectionProgress(containerRef);

  const [vh, setVh] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [viewportVariant, setViewportVariant] = useState("desktop");
  const [heroReady, setHeroReady] = useState(false);
  useEffect(() => {
    const updateVh = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight ?? 0;
      setVh(height);
    };

    const onResize = () => {
      const width = window.innerWidth || 0;
      setViewportVariant(getViewportVariant(width));
      updateVh();
    };
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMQ = () => setReduced(mq.matches);
    onResize(); onMQ();
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", updateVh);
    visualViewport?.addEventListener("scroll", updateVh);
    window.addEventListener("resize", onResize);
    mq.addEventListener("change", onMQ);
    return () => {
      visualViewport?.removeEventListener("resize", updateVh);
      visualViewport?.removeEventListener("scroll", updateVh);
      window.removeEventListener("resize", onResize);
      mq.removeEventListener("change", onMQ);
    };
  }, []);

  useEffect(() => {
    if (!HERO_ASSETS.length) {
      setHeroReady(true);
      return;
    }

    if (typeof window === "undefined" || typeof window.Image === "undefined") {
      setHeroReady(true);
      return;
    }

    let isMounted = true;
    let loaded = 0;
    const ImageCtor = window.Image;

    const entries = HERO_ASSETS.map((src) => {
      const img = new ImageCtor();
      const onDone = () => {
        img.removeEventListener("load", onDone);
        img.removeEventListener("error", onDone);
        loaded += 1;
        if (loaded >= HERO_ASSETS.length && isMounted) {
          setHeroReady(true);
        }
      };

      img.addEventListener("load", onDone);
      img.addEventListener("error", onDone);
      img.src = src;

      if (img.complete) {
        onDone();
      }

      return { img, onDone };
    });

    return () => {
      isMounted = false;
      entries.forEach(({ img, onDone }) => {
        img.removeEventListener("load", onDone);
        img.removeEventListener("error", onDone);
      });
    };
  }, []);

  const p = useMemo(() => reduced ? 0 : clamp01(easeOut(pRaw)), [pRaw, reduced]);

  const layout = HERO_LAYOUT[viewportVariant] ?? HERO_LAYOUT.desktop;
  const trackVariant = viewportVariant === "desktop" ? undefined : viewportVariant;

  const M = HERO_CFG.marks;
  const b1Scale = trackValue(HERO_CFG.layers.b1.scale, p, vh, M, trackVariant) || 1;
  const b1Y = trackValue(HERO_CFG.layers.b1.y, p, vh, M, trackVariant);
  const b2Y = trackValue(HERO_CFG.layers.b2.y, p, vh, M, trackVariant);
  const b3Y = trackValue(HERO_CFG.layers.b3.y, p, vh, M, trackVariant);
  const b4Y = trackValue(HERO_CFG.layers.b4.y, p, vh, M, trackVariant);
  const b5Y = trackValue(HERO_CFG.layers.b5.y, p, vh, M, trackVariant);
  const b4Opacity = (HERO_CFG.layers.b4.opacity?.length ? trackValue(HERO_CFG.layers.b4.opacity, p, vh, M, trackVariant) : 1);
  const b5Opacity = (HERO_CFG.layers.b5.opacity?.length ? trackValue(HERO_CFG.layers.b5.opacity, p, vh, M, trackVariant) : 1);
  const showFg = p >= (M.foreStart ?? 1); // oculta B4/B5 hasta foreStart

  // Text tracks (aparecen de preStart a introStart)
  const titleOpacity = trackValue(HERO_CFG.text.title.opacity, p, vh, M, trackVariant);
  const titleTY = trackValue(HERO_CFG.text.title.y, p, vh, M, trackVariant);
  const titleBlur = trackValue(HERO_CFG.text.title.blur, p, vh, M, trackVariant);
  const subtitleOpacity = trackValue(HERO_CFG.text.subtitle.opacity, p, vh, M, trackVariant);
  const subtitleTY = trackValue(HERO_CFG.text.subtitle.y, p, vh, M, trackVariant);
  const claimOpacity = trackValue(HERO_CFG.text.claim.opacity, p, vh, M, trackVariant);
  const claimTY = trackValue(HERO_CFG.text.claim.y, p, vh, M, trackVariant);

  // Final text + CTA
  const fHOpacity = trackValue(HERO_CFG.finalText.h.opacity, p, vh, M, trackVariant);
  const fHTY = trackValue(HERO_CFG.finalText.h.y, p, vh, M, trackVariant);
  const fPOpacity = trackValue(HERO_CFG.finalText.p.opacity, p, vh, M, trackVariant);
  const fPTY = trackValue(HERO_CFG.finalText.p.y, p, vh, M, trackVariant);
  const fCOpacity = trackValue(HERO_CFG.finalText.claim.opacity, p, vh, M, trackVariant);
  const fCTY = trackValue(HERO_CFG.finalText.claim.y, p, vh, M, trackVariant);
  const ctaOpacity = trackValue(HERO_CFG.finalText.cta.opacity, p, vh, M, trackVariant);
  const ctaTY = trackValue(HERO_CFG.finalText.cta.y, p, vh, M, trackVariant);

  // Monty
  const montyOpacity = trackValue(HERO_CFG.monty.opacity, p, vh, M, trackVariant);
  const montyTY = trackValue(HERO_CFG.monty.y, p, vh, M, trackVariant);
  const migrationOpacity = trackValue(HERO_CFG.migration.opacity, p, vh, M, trackVariant);
  const migrationTY = trackValue(HERO_CFG.migration.y, p, vh, M, trackVariant);
  const migrationPointerEvents = migrationOpacity > 0.05 ? "auto" : "none";
  const s1 = clamp01((p - 0.25) / 0.18);
  const s2 = clamp01((p - 0.52) / 0.18);
  const s3 = clamp01((p - 0.78) / 0.18);

  return (
    <section
      ref={containerRef}
      className="relative bg-black"
      style={{ height: `${layout.sceneSvH}svh` }}
      aria-busy={!heroReady}
    >
      <div
        className={clsx(
          "h-full transition-opacity duration-700",
          heroReady ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className="sticky top-0 h-[100svh] overflow-hidden"
          style={{ height: vh > 0 ? `${vh}px` : undefined }}
        >
          <div
            className="absolute top-0"
            style={{
              left: layout.background.left,
              right: layout.background.right,
              width: layout.background.widths.b1,
              transform: `translate3d(${layout.background.translateX}, ${b1Y}px, 0) scale(${b1Scale})`,
              willChange: "transform"
            }}
          >
            <img src="/hero/B1.svg" alt="" className="w-full h-full object-cover pointer-events-none select-none" draggable="false" />
          </div>

          <div
            className="absolute top-0"
            style={{
              left: layout.background.left,
              right: layout.background.right,
              width: layout.background.widths.b2,
              transform: `translate3d(${layout.background.translateX}, ${b2Y}px, 0)`,
              willChange: "transform"
            }}
          >
            <img src="/hero/B2.svg" alt="" className="w-full pointer-events-none select-none" draggable="false" />
          </div>

          <div
            className="absolute top-0"
            style={{
              left: layout.background.left,
              right: layout.background.right,
              width: layout.background.widths.b3,
              transform: `translate3d(${layout.background.translateX}, ${b3Y}px, 0)`,
              willChange: "transform"
            }}
          >
            <img src="/hero/B3.svg" alt="" className="w-full pointer-events-none select-none" draggable="false" />
          </div>

          <div
            className="absolute bottom-0 z-30"
            style={{
              left: "50%",
              transform: `translate3d(${layout.foreground.translateX}, ${b4Y}px, 0)`,
              opacity: b4Opacity,
              visibility: showFg ? "visible" : "hidden",
              willChange: "transform, opacity"
            }}
          >
            <img
              src="/hero/B4.svg"
              alt=""
              className="max-w-none h-auto pointer-events-none select-none"
              style={{ width: layout.foreground.widthB4 }}
              draggable="false"
            />
          </div>

          <div
            className="absolute bottom-0 z-40"
            style={{
              left: "50%",
              transform: `translate3d(${layout.foreground.translateX}, ${b5Y}px, 0)`,
              opacity: b5Opacity,
              visibility: showFg ? "visible" : "hidden",
              willChange: "transform, opacity"
            }}
          >
            <img
              src="/hero/B5.svg"
              alt=""
              className="max-w-none h-auto pointer-events-none select-none"
              style={{ width: layout.foreground.widthB5 }}
              draggable="false"
            />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5 pt-28 md:px-0 md:pt-36">
            <h1 className="text-7xl sm:text-7xl md:text-[11.2rem] font-black tracking-tight font-medieval text-white" style={{ opacity: titleOpacity, transform: `translate3d(0, ${titleTY}px, 0)` }}>
              CROWNCOIN
            </h1>
            <div className="relative mt-4 w-full flex justify-center" style={{ height: "9.5rem" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-start text-center">
                <p className="text-lg md:text-2xl text-white font-display font-medium" style={{ opacity: subtitleOpacity, transform: `translate3d(0, ${subtitleTY}px, 0)` }}>
                  The memecoin that never forgot.
                </p>
                <p className="text-base sm:text-lg md:text-2xl font-display font-black uppercase tracking-wide text-[#FFCB99] drop-shadow" style={{ opacity: claimOpacity, transform: `translate3d(0, ${claimTY}px, 0)` }}>
                  Forged in forums. Reborn on Ethereum.
                </p>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-start text-center gap-4 md:gap-3">
                <div style={{ opacity: fHOpacity, transform: `translate3d(0, ${fHTY}px, 0)` }}>
                  <h2 className="text-xl sm:text-2xl md:text-[1.75rem] font-extrabold text-white font-display">21 Crowns, 21 Crypto Moments.</h2>
                </div>
                <div style={{ opacity: fPOpacity, transform: `translate3d(0, ${fPTY}px, 0)` }}>
                  <p className="text-white text-base sm:text-lg md:text-3xl font-[350] tracking-wide font-display">Forged from the blockchain’s mythos.</p>
                </div>
                <div style={{ opacity: fCOpacity, transform: `translate3d(0, ${fCTY}px, 0)` }}>
                  <p className="text-white text-base sm:text-xl md:text-[1.75rem] font-[350] uppercase font-display">THE PAST IS NOT LONGER REMEMBERED IT’S MINTED</p>
                </div>
                <div style={{ opacity: ctaOpacity, transform: `translate3d(0, ${ctaTY}px, 0)` }}>
                  <a href="#museum" className="inline-block rounded-2xl bg-[#FF7400] text-white px-6 py-2 text-lg font-black shadow-lg hover:scale-[1.03] transition-transform font-auxiliar">Pick your Crown</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute z-50 md:bottom-6"
          style={{
            left: layout.migration.left,
            opacity: migrationOpacity,
            transform: `translate3d(${layout.migration.translateX}, ${migrationTY}px, 0)`,
            pointerEvents: migrationPointerEvents,
            willChange: "opacity, transform",
            width: layout.migration.width
          }}
        >
          <div className="relative flex items-center gap-3 rounded-xl border border-white/60 bg-white/95 min-w-[260px] md:min-w-[380px] pr-4 overflow-visible">
            <img
              src="/hero/monty_wise.png"
              alt="Monty with migration notice"
              className="absolute left-5 bottom-0 h-26 w-auto select-none pointer-events-none"
              draggable="false"
            />

            <div className="flex flex-col leading-tight py-4 pl-16 md:pl-8 ml-14 md:ml-17">
              <div className="text-black text-lg font-light font-display">CRW owner?</div>
              <div className="text-sm text-black font-auxiliar font-bold">Migrate to ERC-20</div>
            </div>

            <a
              href="#migrate"
              className="ml-2 inline-flex font-auxiliar items-center justify-center rounded-lg bg-[#007CCA] px-5 py-2 text-md font-bold text-white shadow-md transition-transform hover:scale-[1.04] "
            >
              Migrate
            </a>
          </div>
        </div>

        <div
          className="pointer-events-none absolute left-1/2 bottom-[0]"
          style={{ opacity: montyOpacity, transform: `translate3d(${layout.foreground.translateX}, ${montyTY}px, 0)` }}
        >
          <img src="/hero/monty.svg" alt="Monty" className="h-auto" style={{ width: layout.montyWidth }} />
        </div>
      </div>
    </section>
  );
}
