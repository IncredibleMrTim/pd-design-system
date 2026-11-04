/** How far (in px) the finger has to travel before the pull starts to count, so a tap or a wobble never does. */
export const DEAD_ZONE_PX = 8
/** The page moves less than the finger, which is what makes it feel like pulling against something. */
export const RESISTANCE = 0.5
export const MAX_PULL_PX = 120
/** Pull at least this far (the distance shown on screen) and let go to refresh. */
export const REFRESH_THRESHOLD_PX = 64
/** Height of the strip while the refresh is running. */
export const REFRESHING_HEIGHT_PX = 48

/** Turns how far the finger has moved down into how far the page is shown pulled. */
export function getPullDistance(fingerDeltaY: number): number {
  if (fingerDeltaY <= DEAD_ZONE_PX) return 0

  return Math.min((fingerDeltaY - DEAD_ZONE_PX) * RESISTANCE, MAX_PULL_PX)
}

export function isPastThreshold(pullDistance: number): boolean {
  return pullDistance >= REFRESH_THRESHOLD_PX
}

// Things a pull must never start on: typing, and anything that opts out.
const IGNORED_SELECTOR = "input, textarea, select, [contenteditable='true'], [data-no-pull-refresh]"

function isScrolledVertically(element: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(element)
  const canScroll = overflowY === "auto" || overflowY === "scroll"

  return canScroll && element.scrollHeight > element.clientHeight && element.scrollTop > 0
}

/**
 * True when a touch should be left alone: it started on a field or an opted-out
 * area, or inside a list that is itself scrolled down. In that case the finger
 * moving down is the user scrolling that list back up, not asking to refresh.
 */
export function shouldIgnoreTouchTarget(target: Element | null, container: HTMLElement): boolean {
  for (let element = target; element && element !== container; element = element.parentElement) {
    if (element.matches(IGNORED_SELECTOR)) return true
    if (element instanceof HTMLElement && isScrolledVertically(element)) return true
  }

  return false
}
