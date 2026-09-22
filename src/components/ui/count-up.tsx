"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number up to its value.
 *
 * Used only on headline scores, where the movement is doing real work: a figure
 * that counts up reads as something that was *measured*, which is the whole
 * claim this product makes about its numbers.
 *
 * Two deliberate constraints:
 *  - It starts at 0, so the server HTML and the first client render agree and
 *    there is no hydration mismatch.
 *  - It is skipped entirely under `prefers-reduced-motion`, where it jumps
 *    straight to the final value.
 */
export function CountUp({
  value,
  durationMs = 850,
  className,
  suffix = "",
}: {
  value: number;
  durationMs?: number;
  className?: string;
  /** Rendered after the number, e.g. "%". */
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || durationMs <= 0) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      // ease-out cubic: fast at first, settles gently on the real value
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [value, durationMs]);

  return (
    <span className={className}>
      {Math.round(display)}
      {suffix}
    </span>
  );
}
