"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePullToRefresh, type PullPhase, type RefreshOutcome } from "./usePullToRefresh";

export type { PullPhase, RefreshOutcome };

const LABELS: Record<PullPhase, string> = {
  idle: "",
  pulling: "Pull down to refresh",
  ready: "Release to refresh",
  refreshing: "Refreshing…",
  reloading: "Updating to the new version…",
};

export interface PullToRefreshAreaProps {
  /**
   * Turns the pull gesture on or off. Turn it off where a refresh can't work,
   * for example when the app can't reach its version check. When off, the area
   * renders its children and nothing else. Not controlled by the area.
   */
  isEnabled: boolean;
  /**
   * Runs when the user pulls past the threshold and lets go. Resolve with
   * `"refreshed"` once the data is up to date, or `"reloading"` when a newer
   * version of the app is live: the area then shows its updating message and
   * calls `onReload`. If it rejects, the error is logged and the area resets.
   */
  onRefresh: () => Promise<RefreshOutcome>;
  /**
   * Called after the updating message has been shown, when `onRefresh`
   * resolved with `"reloading"`. Defaults to reloading the browser page.
   */
  onReload?: () => void;
  /** Classes for the scrolling container. Give it a fixed height or a flex size, because the area itself is what scrolls. */
  className?: string;
  /** The page content. */
  children: ReactNode;
}

/**
 * The scrolling page area, with a quiet strip that opens at the top while you
 * pull down. The pull only starts when the area is scrolled to the top, and it
 * ignores touches that begin on fields, inside lists that are scrolled down, or
 * inside anything marked `data-no-pull-refresh`. What a refresh does is up to
 * the app, through `onRefresh`.
 */
export function PullToRefreshArea({
  isEnabled,
  onRefresh,
  onReload,
  className,
  children,
}: PullToRefreshAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { pullDistance, phase } = usePullToRefresh({
    containerRef,
    isEnabled,
    onRefresh,
    onReload,
  });

  const isDragging = phase === "pulling" || phase === "ready";
  const isWorking = phase === "refreshing" || phase === "reloading";

  return (
    <div ref={containerRef} className={cn(className, isEnabled && "overscroll-y-contain")}>
      {isEnabled && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-end justify-center overflow-hidden text-sm text-muted-foreground"
          style={{ height: pullDistance, transition: isDragging ? "none" : "height 200ms ease" }}
        >
          {phase !== "idle" && (
            <span className="flex items-center gap-2 pb-2">
              {isWorking ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
              ) : (
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform"
                  style={{ transform: phase === "ready" ? "rotate(180deg)" : "none" }}
                >
                  ↓
                </span>
              )}
              {LABELS[phase]}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
