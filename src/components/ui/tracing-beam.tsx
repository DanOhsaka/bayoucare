"use client";
import React, { useEffect, useId, useRef, useState } from "react";
import {
  motion,
  useTransform,
  useScroll,
  useSpring,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Aceternity Tracing Beam — scroll accent in a fixed left rail on md+.
 *
 * The rail (`md:pl-10`) is reserved from the first paint so the beam never
 * overlaps copy and never shoves layout when it becomes visible after measure.
 */
export const TracingBeam = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [svgHeight, setSvgHeight] = useState(0);
  const [viewportH, setViewportH] = useState(
    () => (typeof window !== "undefined" ? window.innerHeight : 0),
  );
  const reduceMotion = useReducedMotion();
  const gradientId = useId().replace(/:/g, "");

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const syncVp = () => setViewportH(window.innerHeight);
    syncVp();
    window.addEventListener("resize", syncVp, { passive: true });
    return () => window.removeEventListener("resize", syncVp);
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSvgHeight(el.offsetHeight));
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const y1Raw = useTransform(
    scrollYProgress,
    [0, 0.8],
    [50, Math.max(svgHeight, 50)],
  );
  const y2Raw = useTransform(
    scrollYProgress,
    [0, 1],
    [50, Math.max(svgHeight - 200, 50)],
  );
  const y1 = useSpring(y1Raw, { stiffness: 400, damping: 80, mass: 0.4 });
  const y2 = useSpring(y2Raw, { stiffness: 400, damping: 80, mass: 0.4 });

  const needsScroll = viewportH > 0 && svgHeight > viewportH + 48;
  const showBeam = !reduceMotion && needsScroll;

  return (
    <div
      ref={ref}
      className={cn(
        "relative mx-auto h-full w-full max-w-4xl",
        // Always reserve the far-left rail on md+ (beam lives here, not on text).
        "md:pl-10",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute top-3 bottom-0 left-0 z-0 hidden w-10 flex-col items-center md:flex",
          !showBeam && "invisible",
        )}
        aria-hidden="true"
      >
        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-background shadow-sm dark:border-neutral-600">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#34d399]" />
        </div>
        {showBeam && svgHeight > 0 ? (
          <svg
            viewBox={`0 0 20 ${svgHeight}`}
            width="20"
            height={svgHeight}
            className="block"
          >
            <path
              d={`M 10 0 V ${svgHeight}`}
              fill="none"
              stroke="#9091A0"
              strokeOpacity="0.28"
              strokeWidth="1.5"
            />
            <motion.path
              d={`M 10 0 V ${svgHeight}`}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
              className="motion-reduce:hidden"
            />
            <defs>
              <motion.linearGradient
                id={gradientId}
                gradientUnits="userSpaceOnUse"
                x1="0"
                x2="0"
                y1={y1}
                y2={y2}
              >
                <stop stopColor="#18CCFC" stopOpacity="0" />
                <stop stopColor="#34d399" />
                <stop offset="0.5" stopColor="#6ee7b7" />
                <stop offset="1" stopColor="#e8a317" stopOpacity="0" />
              </motion.linearGradient>
            </defs>
          </svg>
        ) : null}
      </div>
      <div ref={contentRef} className="relative z-10 min-w-0">
        {children}
      </div>
    </div>
  );
};
