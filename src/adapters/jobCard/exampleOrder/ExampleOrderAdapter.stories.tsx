import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn, userEvent, within } from "storybook/test"
import { JobCard } from "@/components"
import type { ExampleOrder } from "./ExampleOrder"
import { toJobCardData, type ToJobCardDataOptions } from "./toJobCardData"

const DAY_IN_MS = 24 * 60 * 60 * 1000
// A fixed "now" and time zone, so the age rules and the dates come out the same every time.
const NOW = new Date("2026-11-02T12:00:00Z").getTime()

const baseOrder: ExampleOrder = {
  reference: "ORD-1001",
  customerName: "Acme Co",
  createdAt: NOW - DAY_IN_MS,
  status: "new",
  tier: "silver",
  isUrgent: false,
  isFlagged: false,
  isInternal: false,
  needsFreight: false,
  newItemCount: 0,
  activeTasks: [],
}

interface ExampleOrderCardProps {
  /** The made-up order to show. */
  order: ExampleOrder
  /** "full" shows everything, "summary" leaves most parts out. Defaults to "full". */
  view?: ToJobCardDataOptions["view"]
  /** Called when the Reopen button on a shipped order is clicked. */
  onReopen: () => void
}

/**
 * Passes an example order through the adapter and into a JobCard, which is how
 * an app uses an adapter. The card gets only the result.
 */
const ExampleOrderCard = ({ order, view, onReopen }: ExampleOrderCardProps) => (
  <JobCard
    job={toJobCardData(order, { view, now: NOW, timeZone: "UTC" })}
    action={
      order.status === "shipped"
        ? { label: "Reopen order", onClick: onReopen }
        : undefined
    }
  />
)

const meta = {
  title: "Adapters/Job card/Example order",
  component: ExampleOrderCard,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "An adapter turns an app's own job into the `JobCardData` a JobCard shows. All the app's rules live in the adapter: wording, colours, the age rule, which pills appear and how dates read. The card never learns about them. This example uses a made-up order type. Copy the pattern, not the file. Each app keeps its own adapter next to its own types.",
      },
    },
  },
  args: { order: baseOrder, onReopen: fn() },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ExampleOrderCard>

export default meta
type Story = StoryObj<typeof meta>

/** Finds the card itself, so a story can check its colour. */
const getCard = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!

/** A day-old order is on time, so the card is green and the stage reads New. */
export const NewOrder: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(getCard(canvasElement)).toHaveClass("border-green-400", "bg-green-50")
    await expect(canvas.getByText("New")).toBeInTheDocument()
    await expect(canvas.getByText("Silver")).toBeInTheDocument()
    await expect(canvas.getByText("Created: 1 Nov 2026")).toBeInTheDocument()
  },
}

/** Three days old is a warning. */
export const DueSoon: Story = {
  args: { order: { ...baseOrder, createdAt: NOW - 3 * DAY_IN_MS, status: "in-progress" } },
  play: async ({ canvasElement }) => {
    await expect(getCard(canvasElement)).toHaveClass("border-orange-400", "bg-orange-50")
  },
}

/** Ten days old is late. */
export const Overdue: Story = {
  args: { order: { ...baseOrder, createdAt: NOW - 10 * DAY_IN_MS, status: "in-progress" } },
  play: async ({ canvasElement }) => {
    await expect(getCard(canvasElement)).toHaveClass("border-red-400", "bg-red-50")
  },
}

/** The age clock stops when the order is ready, so waiting to ship doesn't turn it red. */
export const AgeStopsWhenReady: Story = {
  args: {
    order: {
      ...baseOrder,
      createdAt: NOW - 10 * DAY_IN_MS,
      readyAt: NOW - 9 * DAY_IN_MS,
      status: "ready",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(getCard(canvasElement)).toHaveClass("border-green-400", "bg-green-50")
    await expect(canvas.getByText("Ready to ship")).toBeInTheDocument()
  },
}

/** A shipped order is grey, however old, and offers a button to reopen it. */
export const Shipped: Story = {
  args: { order: { ...baseOrder, createdAt: NOW - 10 * DAY_IN_MS, status: "shipped" } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(getCard(canvasElement)).toHaveClass("border-gray-300", "bg-gray-50")
    await userEvent.click(canvas.getByRole("button", { name: "Reopen order" }))
    await expect(args.onReopen).toHaveBeenCalledOnce()
  },
}

/** Urgent and flagged are manual, so they are priority pills, split from the rest by a rule. */
export const UrgentAndFlagged: Story = {
  args: { order: { ...baseOrder, isUrgent: true, isFlagged: true, needsFreight: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("Urgent").parentElement).toHaveClass("border-b")
    await expect(canvas.getByText("Flagged")).toBeInTheDocument()
    await expect(canvas.getByText("Freight")).toBeInTheDocument()
  },
}

/** A gold customer, internal work and a freight request. */
export const GoldInternalFreight: Story = {
  args: { order: { ...baseOrder, tier: "gold", isInternal: true, needsFreight: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("Gold")).toHaveClass("bg-yellow-300")
    await expect(canvas.getByText("Internal")).toBeInTheDocument()
    await expect(canvas.getByText("Freight")).toBeInTheDocument()
  },
}

/** Active tasks become callouts, with the adapter formatting the date. */
export const WithTasks: Story = {
  args: {
    order: {
      ...baseOrder,
      status: "in-progress",
      createdByName: "Sam Jones",
      activeTasks: [
        { name: "Line 2", percent: 40, startedAt: NOW - 2 * DAY_IN_MS },
        { name: "Line 5", percent: 25, startedAt: NOW - DAY_IN_MS },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("Line 2: 40% (started 31 Oct 2026)")).toBeInTheDocument()
    await expect(canvas.getByText("Line 5: 25% (started 1 Nov 2026)")).toBeInTheDocument()
    await expect(canvas.getByText("Created by: Sam Jones")).toBeInTheDocument()
  },
}

/** Items nobody has set up yet show as a banner, pluralised by the adapter. */
export const WithNewItems: Story = {
  args: { order: { ...baseOrder, newItemCount: 3 } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("3 new items")).toBeInTheDocument()
  },
}

/** One new item reads as singular. */
export const WithOneNewItem: Story = {
  args: { order: { ...baseOrder, newItemCount: 1 } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("1 new item")).toBeInTheDocument()
  },
}

/**
 * A restricted view. The adapter just doesn't fill in the stage, tier, tasks
 * and banner, so those parts of the card are gone. The card has no "summary"
 * mode of its own.
 */
export const SummaryView: Story = {
  args: {
    view: "summary",
    order: {
      ...baseOrder,
      createdAt: NOW - 10 * DAY_IN_MS,
      isUrgent: true,
      isInternal: true,
      newItemCount: 2,
      activeTasks: [{ name: "Line 2", percent: 40, startedAt: NOW - DAY_IN_MS }],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Ten days old would be red in the full view. The summary ignores age.
    await expect(getCard(canvasElement)).toHaveClass("border-gray-300", "bg-gray-50")
    await expect(canvas.getByText("ORD-1001")).toBeInTheDocument()
    await expect(canvas.getByText("Urgent")).toBeInTheDocument()
    await expect(canvas.queryByText("New")).not.toBeInTheDocument()
    await expect(canvas.queryByText("Silver")).not.toBeInTheDocument()
    await expect(canvas.queryByText(/Line 2/)).not.toBeInTheDocument()
    await expect(canvas.queryByText(/new item/)).not.toBeInTheDocument()
  },
}
