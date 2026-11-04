"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  REFRESHING_HEIGHT_PX,
  getPullDistance,
  isPastThreshold,
  shouldIgnoreTouchTarget,
} from "./pullToRefresh";

/** What a refresh reports back: the data was refreshed, or a new version of the app is about to replace the page. */
export type RefreshOutcome = "refreshed" | "reloading";

export type PullPhase = "idle" | "pulling" | "ready" | "refreshing" | "reloading";

// Long enough to read "Updating to the new version" before the page goes.
const RELOAD_MESSAGE_DELAY_MS = 700;
// Stops the strip flashing away before it can be seen when the refresh is instant.
const MIN_REFRESH_DISPLAY_MS = 500;

interface UsePullToRefreshOptions {
  containerRef: RefObject<HTMLElement | null>;
  isEnabled: boolean;
  onRefresh: () => Promise<RefreshOutcome>;
  /** Called after the "reloading" message has been shown. Replaceable so tests and stories don't reload the page. */
  onReload?: () => void;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Pull-down-to-refresh for the scrolling area. The browser's own version can't
 * work here because the page itself never scrolls, only this area does (and an
 * installed app on iPhone and iPad has none at all). It only starts when the
 * area is already scrolled to the top, so scrolling back up a list never
 * triggers it, and it ignores touches that begin on fields or inside lists
 * that are scrolled down. Touches inside drawers and dialogs never reach it
 * because those are rendered outside this area.
 */
export function usePullToRefresh({ containerRef, isEnabled, onRefresh, onReload }: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [phase, setPhase] = useState<PullPhase>("idle");
  const onRefreshRef = useRef(onRefresh);
  const onReloadRef = useRef(onReload);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
    onReloadRef.current = onReload;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isEnabled) return;

    let startY = 0;
    let distance = 0;
    let isTracking = false;
    let isBusy = false;

    function reset(): void {
      distance = 0;
      setPullDistance(0);
      setPhase("idle");
    }

    function handleTouchStart(event: TouchEvent): void {
      if (isBusy || event.touches.length !== 1 || !container || container.scrollTop > 0) return;
      if (shouldIgnoreTouchTarget(event.target as Element | null, container)) return;

      startY = event.touches[0].clientY;
      distance = 0;
      isTracking = true;
    }

    function handleTouchMove(event: TouchEvent): void {
      if (!isTracking || !container) return;

      // The area has started scrolling normally, so this is not a pull.
      if (container.scrollTop > 0) {
        isTracking = false;
        reset();
        return;
      }

      distance = getPullDistance(event.touches[0].clientY - startY);
      if (distance > 0) event.preventDefault();

      setPullDistance(distance);
      setPhase(distance === 0 ? "idle" : isPastThreshold(distance) ? "ready" : "pulling");
    }

    async function handleTouchEnd(): Promise<void> {
      if (!isTracking) return;
      isTracking = false;

      if (!isPastThreshold(distance)) {
        reset();
        return;
      }

      isBusy = true;
      setPhase("refreshing");
      setPullDistance(REFRESHING_HEIGHT_PX);
      const startedAt = Date.now();

      let outcome: RefreshOutcome = "refreshed";
      try {
        outcome = await onRefreshRef.current();
      } catch (error) {
        console.error("Pull-down refresh failed:", error);
      }

      if (outcome === "reloading") {
        setPhase("reloading");
        await wait(RELOAD_MESSAGE_DELAY_MS);
        // Stays busy on purpose: the page is about to be replaced.
        (onReloadRef.current ?? (() => window.location.reload()))();
        return;
      }

      await wait(Math.max(0, MIN_REFRESH_DISPLAY_MS - (Date.now() - startedAt)));
      isBusy = false;
      reset();
    }

    function handleTouchCancel(): void {
      if (!isTracking) return;
      isTracking = false;
      reset();
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    // Not passive: it has to be able to stop the page bouncing while it is pulled.
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    container.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [containerRef, isEnabled]);

  return { pullDistance, phase };
}
