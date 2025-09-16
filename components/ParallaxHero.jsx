"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import { useSectionProgress } from "./useSectionProgress";

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
function segStart(seg, vh) { return ("startVh" in seg) ? seg.startVh * vh : (seg.start ?? 0); }
function segEnd(seg, vh) { return ("endVh" in seg) ? seg.endVh * vh : (seg.end ?? 0); }
function trackValue(track, p, vh, marks) {
  if (!track || track.length === 0) return 0;
  const segs = track.map(s => ({
    from: resolveMark(s.from, marks),
    to: resolveMark(s.to, marks),
    ease: s.ease || "inOut",
    start: (vh) => segStart(s, vh),
    end: (vh) => segEnd(s, vh)
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
        { from: "preStart", to: "introStart", ease: "out", start: 24, end: 0 },
        { from: "introStart", to: "foreStart", ease: "linear", start: 0, end: -5},
        { from: "foreStart", to: "end", ease: "inOut", start: -5, end: -45 },

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
        { from: 0.08, to: "introStart", ease: "out", start: 20, end: 0 },
        { from: "introStart", to: "foreStart", ease: "linear", start: 0, end: 0 },
        { from: "foreStart", to: "fgShowEnd", ease: "inOut", start: 0, end: -10 }
      ]
    },
    claim: {
      opacity: [
        { from: 0.16, to: "introStart", ease: "out", start: 0, end: 1 },
        { from: "introStart", to: "foreStart", ease: "linear", start: 1, end: 1 },
        { from: "foreStart", to: "fgShowEnd", ease: "inOut", start: 1, end: 0 }
      ],
      y: [
        { from: 0.16, to: "introStart", ease: "out", start: 20, end: 0 },
        { from: "introStart", to: "foreStart", ease: "linear", start: 0, end: 0 },
        { from: "foreStart", to: "fgShowEnd", ease: "inOut", start: 0, end: -10 }
      ]
    }
  },
  finalText: {
    h: {
      opacity: [
        { from: "fgShowEnd", to: "end",      ease: "linear", start: 0, end: 1 }
      ],
      y: [
        { from: "fgShowEnd", to: "end",      ease: "linear", start: 20, end: -60 }
      ]
    },
    p: {
      opacity: [
        { from: "fgShowEnd", to: "end", ease: "linear", start: 0, end: 1 }
      ],
      y: [
        { from: "fgShowEnd", to: "end", ease: "linear", start: 20, end: -70 }
      ]
    },
    claim: {
      opacity: [
        { from: "fgShowEnd", to: "end", ease: "linear", start: 0, end: 1 }
      ],
      y: [
        { from: "fgShowEnd", to: "end", ease: "out", start: 50, end: -25 }
      ]
    },
    cta: {
      opacity: [
        { from: "fgShowEnd", to: "end", ease: "linear", start: 0, end: 1 }
      ],
      y: [
        { from: "fgShowEnd", to: "end", ease: "out", start: 50, end: -25 }
      ]
    }
  },
  monty: {
    opacity: [
      { from: 0.90, to: "end", ease: "out", start: 0, end: 1 }
    ],
    y: [
      { from: 0.90, to: "end", ease: "inOut", start: 30, end: 0 }
    ],
    widthVw: 10
  },
  migration: {
    opacity: [
      { from: "fgShowEnd", to: "end", ease: "linear", start: 0, end: 1 }
    ],
    y: [
      { from: "fgShowEnd", to: "end", ease: "out", start: 40, end: 0 }
    ]
  },
  layers: {
    b1: {
      scale: [
        { from: "preStart", to: "preEnd", ease: "out", start: 1.00, end: 1.05 },
        { from: "introStart", to: "introEnd", ease: "linear", start: 1.05, end: 1.0 }
        
      ],
      y: [
       { from: "introStart", to: "introEnd", ease: "out", startVh: 0, endVh: -0.15 },
        { from: "foreStart", to: "end", ease: "inOut", startVh: -0.15, endVh: -0.25 }
      ]
    },
    b2: {
      y: [
        { from: "preStart", to: "preEnd", ease: "out", startVh: 0.02, endVh: -0.05 },
        { from: "introStart", to: "introEnd", ease: "out", startVh: -0.05, endVh: -0.15 },
        { from: "foreStart", to: "end", ease: "inOut", startVh: -0.15, endVh: -0.15 }
      ]
    },
    b3: {
      y: [
        { from: "preStart", to: "preEnd", ease: "out", startVh: 0.65, endVh: 0.47 },
        { from: "introStart", to: "introEnd", ease: "out", startVh: 0.47, endVh: 0.31 },
        { from: "foreStart", to: "end", ease: "inOut", startVh: 0.31, endVh: 0.25}
      ]
    },
    b4: {
      y: [
        { from: "foreStart", to: "fgShowEnd", ease: "inOut", startVh: 0.60, endVh: 0.20 },
        { from: "fgShowEnd", to: "end",      ease: "inOut", startVh: 0.20, endVh: 0.3 }
      ],
      widthVw: 120,
      opacity: []
    },
    b5: {
      y: [
        { from: "foreStart", to: "fgShowEnd", ease: "inOut", startVh: 0.60, endVh: 0.20 },
        { from: "fgShowEnd", to: "end",      ease: "inOut", startVh: 0.20, endVh: 0.3 }
      ],
      widthVw: 130,
      opacity: []
    }
  }
};


export default function ParallaxHero() {
  const containerRef = useRef(null);
  const pRaw = useSectionProgress(containerRef);

  const [vh, setVh] = useState(0);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const onR = () => setVh(window.innerHeight || 0);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMQ = () => setReduced(mq.matches);
    onR(); onMQ();
    window.addEventListener("resize", onR);
    mq.addEventListener("change", onMQ);
    return () => { window.removeEventListener("resize", onR); mq.removeEventListener("change", onMQ); };
  }, []);

  const p = useMemo(() => reduced ? 0 : clamp01(easeOut(pRaw)), [pRaw, reduced]);

  const M = HERO_CFG.marks;
  const b1Scale = trackValue(HERO_CFG.layers.b1.scale, p, vh, M) || 1;
  const b1Y = trackValue(HERO_CFG.layers.b1.y, p, vh, M);
  const b2Y = trackValue(HERO_CFG.layers.b2.y, p, vh, M);
  const b3Y = trackValue(HERO_CFG.layers.b3.y, p, vh, M);
  const b4Y = trackValue(HERO_CFG.layers.b4.y, p, vh, M);
  const b5Y = trackValue(HERO_CFG.layers.b5.y, p, vh, M);
  const b4Opacity = (HERO_CFG.layers.b4.opacity?.length ? trackValue(HERO_CFG.layers.b4.opacity, p, vh, M) : 1);
  const b5Opacity = (HERO_CFG.layers.b5.opacity?.length ? trackValue(HERO_CFG.layers.b5.opacity, p, vh, M) : 1);
  const showFg = p >= (M.foreStart ?? 1); // oculta B4/B5 hasta foreStart

  // Text tracks (aparecen de preStart a introStart)
  const titleOpacity = trackValue(HERO_CFG.text.title.opacity, p, vh, M);
  const titleTY = trackValue(HERO_CFG.text.title.y, p, vh, M);
  const titleBlur = trackValue(HERO_CFG.text.title.blur, p, vh, M);
  const subtitleOpacity = trackValue(HERO_CFG.text.subtitle.opacity, p, vh, M);
  const subtitleTY = trackValue(HERO_CFG.text.subtitle.y, p, vh, M);
  const claimOpacity = trackValue(HERO_CFG.text.claim.opacity, p, vh, M);
  const claimTY = trackValue(HERO_CFG.text.claim.y, p, vh, M);

  // Final text + CTA
  const fHOpacity = trackValue(HERO_CFG.finalText.h.opacity, p, vh, M);
  const fHTY = trackValue(HERO_CFG.finalText.h.y, p, vh, M);
  const fPOpacity = trackValue(HERO_CFG.finalText.p.opacity, p, vh, M);
  const fPTY = trackValue(HERO_CFG.finalText.p.y, p, vh, M);
  const fCOpacity = trackValue(HERO_CFG.finalText.claim.opacity, p, vh, M);
  const fCTY = trackValue(HERO_CFG.finalText.claim.y, p, vh, M);
  const ctaOpacity = trackValue(HERO_CFG.finalText.cta.opacity, p, vh, M);
  const ctaTY = trackValue(HERO_CFG.finalText.cta.y, p, vh, M);

  // Monty
  const montyOpacity = trackValue(HERO_CFG.monty.opacity, p, vh, M);
  const montyTY = trackValue(HERO_CFG.monty.y, p, vh, M);
  const migrationOpacity = trackValue(HERO_CFG.migration.opacity, p, vh, M);
  const migrationTY = trackValue(HERO_CFG.migration.y, p, vh, M);
  const migrationPointerEvents = migrationOpacity > 0.05 ? "auto" : "none";
  const s1 = clamp01((p - 0.25) / 0.18);
  const s2 = clamp01((p - 0.52) / 0.18);
  const s3 = clamp01((p - 0.78) / 0.18);

  return (
    <section ref={containerRef} className="relative" style={{ height: `${HERO_CFG.sceneSvH}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-x-0 top-0" style={{ transform: `translate3d(0, ${b1Y}px, 0) scale(${b1Scale})`, willChange: "transform" }}>
          <img src="/hero/B1.svg" alt="" className="w-full h-full object-cover pointer-events-none select-none" draggable="false" />
        </div>

        <div className="absolute inset-x-0 top-0" style={{ transform: `translate3d(0, ${b2Y}px, 0)`, willChange: "transform" }}>
          <img src="/hero/B2.svg" alt="" className="w-full pointer-events-none select-none" draggable="false" />
        </div>

        <div className="absolute inset-x-0 top-0" style={{ transform: `translate3d(0, ${b3Y}px, 0)`, willChange: "transform" }}>
          <img src="/hero/B3.svg" alt="" className="w-full pointer-events-none select-none" draggable="false" />
        </div>

        <div className="absolute bottom-0 z-30" style={{ left: "50%", transform: `translateX(-50%) translateY(${b4Y}px)`, opacity: b4Opacity, visibility: showFg ? "visible" : "hidden", willChange: "transform, opacity" }}>
          <img src="/hero/B4.svg" alt="" className="max-w-none h-auto pointer-events-none select-none" style={{ width: `${HERO_CFG.layers.b4.widthVw}vw` }} draggable="false" />
        </div>

        <div className="absolute bottom-0 z-40" style={{ left: "50%", transform: `translateX(-50%) translateY(${b5Y}px)`, opacity: b5Opacity, visibility: showFg ? "visible" : "hidden", willChange: "transform, opacity" }}>
          <img src="/hero/B5.svg" alt="" className="max-w-none h-auto pointer-events-none select-none" style={{ width: `${HERO_CFG.layers.b5.widthVw}vw` }} draggable="false" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pt-36">
          <h1 className="text-7xl md:text-[11.2rem] font-black tracking-tight font-medieval text-white" style={{ opacity: titleOpacity, transform: `translate3d(0, ${titleTY}px, 0)` }}>
            CROWNCOIN
          </h1>
          <div className="relative mt-4 w-full flex justify-center" style={{ height: "9.5rem" }}>
            <div className="absolute inset-0 flex flex-col items-center justify-start text-center  ">
              <p className="text-xl md:text-2xl text-white font-display font-medium" style={{ opacity: subtitleOpacity, transform: `translate3d(0, ${subtitleTY}px, 0)` }}>
                The memecoin that never forgot.
              </p>
              <p className="text-lg md:text-2xl font-display  font-black uppercase tracking-wide text-[#FFCB99] drop-shadow " style={{ opacity: claimOpacity, transform: `translate3d(0, ${claimTY}px, 0)` }}>
                Forged in forums. Reborn on Ethereum.
              </p>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-start text-center gap-3">
              <div style={{ opacity: fHOpacity, transform: `translate3d(0, ${fHTY}px, 0)` }}>
                <h2 className="text-2xl  md:text-[1.75rem] font-extrabold text-white font-display">21 Crowns, 21 Crypto Moments.</h2>
              </div>
              <div style={{ opacity: fPOpacity, transform: `translate3d(0, ${fPTY}px, 0)` }}>
                <p className="text-white text-lg md:text-3xl  font-[350] tracking-wide font-display">Forged from the blockchain’s mythos.</p>
              </div>
              <div style={{ opacity: fCOpacity, transform: `translate3d(0, ${fCTY}px, 0)` }}>
                <p className="text-white text-xl md:text-[1.75rem] font-[350] uppercase font-display">THE PAST IS NOT LONGER REMEMBERED IT’S MINTED</p>
              </div>
              <div style={{ opacity: ctaOpacity, transform: `translate3d(0, ${ctaTY}px, 0)` }}>
                <a href="#museum" className="inline-block rounded-2xl bg-[#FF7400] text-white px-6 py-2 text-lg font-black shadow-lg hover:scale-[1.03] transition-transform font-auxiliar">Pick your Crown</a>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    <div
      className="absolute bottom-6 left-12 z-50"
      style={{ opacity: migrationOpacity, transform: `translate3d(0, ${migrationTY}px, 0)`, pointerEvents: migrationPointerEvents, willChange: "opacity, transform" }}
    >
      <div className="relative flex items-center gap-3 rounded-xl border border-white/60 bg-white/95 min-w-[380px] pr-4  overflow-visible">
        <img
          src="/hero/monty_wise.png"
          alt="Monty with migration notice"
          className="absolute left-5 bottom-0 h-26 w-auto select-none pointer-events-none"
          draggable="false"
        />

        {/* Texto */}
        <div className="flex flex-col leading-tight py-4 pl-8 ml-17">
          <div className="text-black text-lg font-light font-display">CRW owner?</div>
          <div className="text-sm text-black font-auxiliar font-bold">Migrate to ERC-20</div>
        </div>

        {/* Botón a la derecha */}
        <a
          href="#migrate"
          className="ml-2 inline-flex font-auxiliar items-center justify-center rounded-lg bg-[#007CCA] px-5 py-2 text-md font-bold text-white shadow-md transition-transform hover:scale-[1.04] "
        >
          Migrate
        </a>
      </div>
    </div>

      <div className="pointer-events-none absolute left-1/2 bottom-[0] " style={{ opacity: montyOpacity, transform: `translate3d(-50%, ${montyTY}px, 0)` }}>
        <img src="/hero/monty.svg" alt="Monty" className="h-auto" style={{ width: `${HERO_CFG.monty.widthVw}vw` }} />
      </div>zd
    </section>
  );
}
