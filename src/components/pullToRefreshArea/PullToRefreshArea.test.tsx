import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import { PullToRefreshArea, type RefreshOutcome } from "./PullToRefreshArea"

// jsdom has no real touch support, so these build the events by hand and
// attach the touch list the hook reads.
function touch(target: Element, type: string, clientY?: number): Event {
  const event = new Event(type, { bubbles: true, cancelable: true })
  const touches = clientY === undefined ? [] : [{ clientY }]
  Object.defineProperty(event, "touches", { value: touches })
  act(() => {
    target.dispatchEvent(event)
  })
  return event
}

// 8px dead zone, then half the finger travel: 100px of finger is 46px of pull
// (short of the 64px threshold) and 160px is 76px (past it).
const SHORT_PULL_FINGER_PX = 100
const LONG_PULL_FINGER_PX = 160

function renderArea(overrides: { onRefresh?: () => Promise<RefreshOutcome>; isEnabled?: boolean } = {}) {
  const onRefresh = vi.fn(overrides.onRefresh ?? (() => Promise.resolve<RefreshOutcome>("refreshed")))
  const onReload = vi.fn()
  render(
    <PullToRefreshArea isEnabled={overrides.isEnabled ?? true} onRefresh={onRefresh} onReload={onReload}>
      <p data-testid="content">Page content</p>
      <input data-testid="field" />
    </PullToRefreshArea>,
  )
  return { onRefresh, onReload, content: screen.getByTestId("content"), field: screen.getByTestId("field") }
}

async function advance(milliseconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds)
  })
}

function pullAndRelease(target: Element, fingerPx: number) {
  touch(target, "touchstart", 0)
  touch(target, "touchmove", fingerPx)
  touch(target, "touchend")
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("PullToRefreshArea", () => {
  it("shows its children and an empty status strip at rest", () => {
    renderArea()

    expect(screen.getByText("Page content")).toBeInTheDocument()
    expect(screen.getByRole("status")).toBeEmptyDOMElement()
  })

  it("renders only the children, with no strip, when disabled", () => {
    const { content, onRefresh } = renderArea({ isEnabled: false })

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    pullAndRelease(content, LONG_PULL_FINGER_PX)
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it("asks the user to keep pulling while short of the threshold", () => {
    const { content } = renderArea()

    touch(content, "touchstart", 0)
    const move = touch(content, "touchmove", SHORT_PULL_FINGER_PX)

    expect(screen.getByRole("status")).toHaveTextContent("Pull down to refresh")
    // Stops the browser bouncing the page while it is being pulled.
    expect(move.defaultPrevented).toBe(true)
  })

  it("asks the user to let go once past the threshold", () => {
    const { content } = renderArea()

    touch(content, "touchstart", 0)
    touch(content, "touchmove", LONG_PULL_FINGER_PX)

    expect(screen.getByRole("status")).toHaveTextContent("Release to refresh")
  })

  it("does not refresh when released short of the threshold", () => {
    const { content, onRefresh } = renderArea()

    pullAndRelease(content, SHORT_PULL_FINGER_PX)

    expect(onRefresh).not.toHaveBeenCalled()
    expect(screen.getByRole("status")).toBeEmptyDOMElement()
  })

  it("refreshes when released past the threshold, then settles back", async () => {
    const { content, onRefresh, onReload } = renderArea()

    pullAndRelease(content, LONG_PULL_FINGER_PX)

    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("status")).toHaveTextContent("Refreshing…")

    // An instant refresh still keeps the strip up long enough to be seen.
    await advance(400)
    expect(screen.getByRole("status")).toHaveTextContent("Refreshing…")

    await advance(200)
    expect(screen.getByRole("status")).toBeEmptyDOMElement()
    expect(onReload).not.toHaveBeenCalled()
  })

  it("ignores a second pull while a refresh is running", async () => {
    const { content, onRefresh } = renderArea()

    pullAndRelease(content, LONG_PULL_FINGER_PX)
    pullAndRelease(content, LONG_PULL_FINGER_PX)
    await advance(600)

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it("shows the updating message, then reloads, when a new version is live", async () => {
    const { content, onReload } = renderArea({ onRefresh: () => Promise.resolve("reloading") })

    pullAndRelease(content, LONG_PULL_FINGER_PX)
    await advance(0)

    expect(screen.getByRole("status")).toHaveTextContent("Updating to the new version…")
    expect(onReload).not.toHaveBeenCalled()

    await advance(700)
    expect(onReload).toHaveBeenCalledTimes(1)
  })

  it("logs the error and settles back when the refresh fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const { content, onReload } = renderArea({ onRefresh: () => Promise.reject(new Error("offline")) })

    pullAndRelease(content, LONG_PULL_FINGER_PX)
    await advance(600)

    expect(consoleError).toHaveBeenCalledWith("Pull-down refresh failed:", expect.any(Error))
    expect(screen.getByRole("status")).toBeEmptyDOMElement()
    expect(onReload).not.toHaveBeenCalled()
  })

  it("ignores a pull that starts on a field", () => {
    const { field, onRefresh } = renderArea()

    pullAndRelease(field, LONG_PULL_FINGER_PX)

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it("ignores a pull when the area is already scrolled down", () => {
    const { content, onRefresh } = renderArea()
    const container = content.parentElement as HTMLElement
    container.scrollTop = 40

    pullAndRelease(content, LONG_PULL_FINGER_PX)

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it("cancels the pull when the area starts scrolling part way through", () => {
    const { content, onRefresh } = renderArea()
    const container = content.parentElement as HTMLElement

    touch(content, "touchstart", 0)
    touch(content, "touchmove", SHORT_PULL_FINGER_PX)
    container.scrollTop = 20
    touch(content, "touchmove", LONG_PULL_FINGER_PX)
    touch(content, "touchend")

    expect(screen.getByRole("status")).toBeEmptyDOMElement()
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it("resets when the touch is cancelled", () => {
    const { content } = renderArea()

    touch(content, "touchstart", 0)
    touch(content, "touchmove", LONG_PULL_FINGER_PX)
    touch(content, "touchcancel")

    expect(screen.getByRole("status")).toBeEmptyDOMElement()
  })
})
