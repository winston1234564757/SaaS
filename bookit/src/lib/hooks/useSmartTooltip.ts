'use client';

import { RefObject, useLayoutEffect, useState } from 'react';

/**
 * Clamps a tooltip's horizontal position to stay within the viewport.
 * Replaces per-widget useLayoutEffect boilerplate in WeeklyChart + PeakHours.
 *
 * @param tooltipRef  — ref on the rendered tooltip DOM node
 * @param rawLeft     — unclamped center X (pixels from left edge), or null when hidden
 * @param safeArea    — minimum padding from viewport edges (default 8px)
 * @returns clamped X value (or rawLeft if no clamping needed, or null when hidden)
 */
export function useSmartTooltip(
  tooltipRef: RefObject<HTMLElement | null>,
  rawLeft: number | null,
  safeArea = 8,
): number | null {
  const [left, setLeft] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (rawLeft === null) {
      setLeft(null);
      return;
    }
    if (!tooltipRef.current) {
      setLeft(rawLeft);
      return;
    }
    const halfW = tooltipRef.current.offsetWidth / 2;
    const vw = window.innerWidth;
    const clamped = Math.max(halfW + safeArea, Math.min(vw - halfW - safeArea, rawLeft));
    setLeft(prev => Math.abs((prev ?? rawLeft) - clamped) > 0.5 ? clamped : prev);
  }, [rawLeft, safeArea, tooltipRef]);

  return left ?? rawLeft;
}
