import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn, waitFor, within } from "storybook/test"
import { PullToRefreshArea, type RefreshOutcome } from "./PullToRefreshArea"

// Every touch is reported with the one finger's vertical position, which is all
// the area reads. The dead zone and resistance turn 100px of finger into 46px
// of pull (short of the threshold) and 160px into 76px (past it).
const SHORT_PULL_FINGER_PX = 100
const LONG_PULL_FINGER_PX = 160

function touch(target: Element, type: string, clientY?: number) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, "touches", {
    value: clientY === undefined ? [] : [{ clientY }],
  })
  target.dispatchEvent(event)
}

function SampleList() {
  return (
    <ul className="divide-y text-sm">
      {Array.from({ length: 12 }, (_, index) => (
        <li key={index} className="px-4 py-3">
          Row {index + 1}
        </li>
      ))}
    </ul>
  )
}

const meta = {
  title: "Components/PullToRefreshArea",
  component: PullToRefreshArea,
  tags: ["autodocs"],
  args: {
    isEnabled: true,
    onRefresh: fn(() => Promise.resolve<RefreshOutcome>("refreshed")),
    onReload: fn(),
    className: "h-72 w-80 overflow-y-auto rounded-md border bg-background",
    children: <SampleList />,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Pull down on a touch screen to refresh. In the stories the pull is acted out with touch events, so no touch device is needed. On a desktop with a mouse the area just scrolls.",
      },
    },
  },
} satisfies Meta<typeof PullToRefreshArea>

export default meta
type Story = StoryObj<typeof meta>

/** At rest. Nothing shows until a pull starts, and the area scrolls as normal. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole("status")).toBeEmptyDOMElement()
    await expect(canvas.getByText("Row 1")).toBeVisible()
  },
}

/** Part way through a pull, short of the threshold. Letting go here does nothing. */
export const Pulling: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const row = canvas.getByText("Row 1")

    touch(row, "touchstart", 0)
    touch(row, "touchmove", SHORT_PULL_FINGER_PX)

    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Pull down to refresh"))

    touch(row, "touchend")

    await waitFor(() => expect(canvas.getByRole("status")).toBeEmptyDOMElement())
    await expect(args.onRefresh).not.toHaveBeenCalled()
  },
}

/** Pulled far enough, with the finger still down. The arrow turns to say "let go now". */
export const ReadyToRelease: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const row = canvas.getByText("Row 1")

    touch(row, "touchstart", 0)
    touch(row, "touchmove", LONG_PULL_FINGER_PX)

    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Release to refresh"))
  },
}

/**
 * Released past the threshold while `onRefresh` is still working. This one
 * never finishes, so the spinner stays up to be looked at.
 */
export const Refreshing: Story = {
  args: {
    onRefresh: fn(() => new Promise<RefreshOutcome>(() => {})),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const row = canvas.getByText("Row 1")

    touch(row, "touchstart", 0)
    touch(row, "touchmove", LONG_PULL_FINGER_PX)
    touch(row, "touchend")

    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Refreshing…"))
    await expect(args.onRefresh).toHaveBeenCalledTimes(1)
  },
}

/**
 * `onRefresh` found that a newer version of the app is live and resolved with
 * `"reloading"`. The area shows its updating message, then calls `onReload`.
 * Here `onReload` does nothing, where the default reloads the browser page.
 */
export const Reloading: Story = {
  args: {
    onRefresh: fn(() => Promise.resolve<RefreshOutcome>("reloading")),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const row = canvas.getByText("Row 1")

    touch(row, "touchstart", 0)
    touch(row, "touchmove", LONG_PULL_FINGER_PX)
    touch(row, "touchend")

    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Updating to the new version…"))
    await waitFor(() => expect(args.onReload).toHaveBeenCalledTimes(1), { timeout: 2000 })
  },
}

/** Switched off. There is no strip, and pulling does nothing. */
export const Disabled: Story = {
  args: {
    isEnabled: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const row = canvas.getByText("Row 1")

    touch(row, "touchstart", 0)
    touch(row, "touchmove", LONG_PULL_FINGER_PX)
    touch(row, "touchend")

    await expect(canvas.queryByRole("status")).not.toBeInTheDocument()
    await expect(args.onRefresh).not.toHaveBeenCalled()
  },
}
