import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Flag, Lock, PackagePlus, Zap } from "lucide-react"
import { expect, fn, userEvent, within } from "storybook/test"
import { JobCard } from "./JobCard"
import type { JobCardData, JobCardPillTone } from "./JobCardTypes"

const baseJob: JobCardData = {
  title: "PO-1001",
  subtitle: "Acme Co",
}

const meta = {
  title: "Components/JobCard",
  component: JobCard,
  tags: ["autodocs"],
  args: {
    job: baseJob,
    onClick: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof JobCard>

export default meta
type Story = StoryObj<typeof meta>

/** Finds the card itself, so a story can check its classes. */
const getCard = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!

/** The plainest card: just a title. Without `onClick` it isn't clickable. */
export const TitleOnly: Story = {
  args: { job: { title: "PO-1001" }, onClick: undefined },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("PO-1001")).toBeInTheDocument()
    await expect(getCard(canvasElement)).not.toHaveClass("cursor-pointer")
    await expect(getCard(canvasElement)).toHaveClass("border-gray-300", "bg-gray-50")
  },
}

/** A title and a subtitle. With `onClick` the card shows a pointer. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("PO-1001")).toBeInTheDocument()
    await expect(canvas.getByText("Acme Co")).toBeInTheDocument()
    await expect(getCard(canvasElement)).toHaveClass("cursor-pointer")
  },
}

/** Clicking anywhere on the card calls `onClick`. */
export const Clickable: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByText("PO-1001"))
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

/** `success` is green. */
export const ToneSuccess: Story = {
  args: { job: { ...baseJob, tone: "success" } },
  play: async ({ canvasElement }) => {
    await expect(getCard(canvasElement)).toHaveClass("border-green-400", "bg-green-50")
  },
}

/** `warning` is orange. */
export const ToneWarning: Story = {
  args: { job: { ...baseJob, tone: "warning" } },
  play: async ({ canvasElement }) => {
    await expect(getCard(canvasElement)).toHaveClass("border-orange-400", "bg-orange-50")
  },
}

/** `danger` is red. */
export const ToneDanger: Story = {
  args: { job: { ...baseJob, tone: "danger" } },
  play: async ({ canvasElement }) => {
    await expect(getCard(canvasElement)).toHaveClass("border-red-400", "bg-red-50")
  },
}

/** `neutral` is grey, and is the default. */
export const ToneNeutral: Story = {
  args: { job: { ...baseJob, tone: "neutral" } },
  play: async ({ canvasElement }) => {
    await expect(getCard(canvasElement)).toHaveClass("border-gray-300", "bg-gray-50")
  },
}

/** The stage sits top right beside a dot in any CSS colour. */
export const WithStage: Story = {
  args: { job: { ...baseJob, stage: { label: "In progress", color: "#d97706" } } },
  play: async ({ canvasElement }) => {
    const label = within(canvasElement).getByText("In progress")
    await expect(label).toBeInTheDocument()
    await expect(label.previousElementSibling).toHaveStyle({ backgroundColor: "#d97706" })
  },
}

/** Without a colour the dot is grey. */
export const StageDefaultColor: Story = {
  args: { job: { ...baseJob, stage: { label: "Waiting" } } },
  play: async ({ canvasElement }) => {
    const label = within(canvasElement).getByText("Waiting")
    await expect(label.previousElementSibling).toHaveStyle({ backgroundColor: "#6b7280" })
  },
}

/** Short grey lines, such as who created the job and when. */
export const WithDetails: Story = {
  args: {
    job: { ...baseJob, details: ["Created: 29 Oct 2026", "Created by: Sam Jones"] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("Created: 29 Oct 2026")).toBeInTheDocument()
    await expect(canvas.getByText("Created by: Sam Jones")).toBeInTheDocument()
  },
}

/** A description of the work, in italics. */
export const WithDescription: Story = {
  args: { job: { ...baseJob, description: "Brass connector, 40 off" } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Brass connector, 40 off")).toBeInTheDocument()
  },
}

/** Bordered boxes of text, one per line. */
export const WithCallouts: Story = {
  args: {
    job: { ...baseJob, callouts: ["Line 2: 40% (loaded 29 Oct)", "Line 5: 25% (loaded 30 Oct)"] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/Line 2: 40%/)).toBeInTheDocument()
    await expect(canvas.getByText(/Line 5: 25%/)).toBeInTheDocument()
  },
}

/** A colour block beside the pills. */
export const WithBadge: Story = {
  args: { job: { ...baseJob, badge: { label: "Gold", color: "yellow" } } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Gold")).toHaveClass("bg-yellow-300")
  },
}

/** A grey badge. */
export const WithGrayBadge: Story = {
  args: { job: { ...baseJob, badge: { label: "Silver", color: "gray" } } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Silver")).toHaveClass("bg-gray-300")
  },
}

/** Soft tinted pills. */
export const WithPills: Story = {
  args: {
    job: {
      ...baseJob,
      badge: { label: "Gold", color: "yellow" },
      pills: [
        { label: "Internal", tone: "blue" },
        { label: "Freight", tone: "orange" },
        { label: "Rework", tone: "red" },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const label of ["Internal", "Freight", "Rework"]) {
      await expect(canvas.getByText(label)).toBeInTheDocument()
    }
  },
}

/** Priority pills lead, split from the others by a rule. They can carry an icon. */
export const PriorityPills: Story = {
  args: {
    job: {
      ...baseJob,
      pills: [
        { label: "Urgent", tone: "critical", icon: <Zap aria-hidden="true" />, priority: true },
        { label: "Flagged", tone: "warning", icon: <Flag aria-hidden="true" />, priority: true },
        { label: "Fragile", tone: "purple" },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("Urgent").parentElement).toHaveClass("border-b")
    await expect(canvas.getByText("Fragile").parentElement).not.toHaveClass("border-b")
    await expect(canvas.getByText("Urgent").querySelector("svg")).not.toBeNull()
  },
}

/** With only priority pills there is nothing to split from, so no rule. */
export const OnlyPriorityPills: Story = {
  args: {
    job: {
      ...baseJob,
      pills: [{ label: "Urgent", tone: "critical", priority: true }],
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Urgent").parentElement).not.toHaveClass("border-b")
  },
}

/** Every pill tone side by side. */
export const AllPillTones: Story = {
  args: {
    job: {
      ...baseJob,
      pills: (
        [
          "critical",
          "warning",
          "danger",
          "red",
          "orange",
          "green",
          "blue",
          "purple",
          "outline",
          "dashed",
        ] satisfies JobCardPillTone[]
      ).map((tone) => ({ label: tone, tone })),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("critical")).toHaveClass("bg-red-500")
    await expect(canvas.getByText("warning")).toHaveClass("bg-yellow-300")
    await expect(canvas.getByText("danger")).toHaveClass("bg-red-400")
    await expect(canvas.getByText("dashed")).toHaveClass("border-dashed")
  },
}

/** A bar across the bottom, in a colour no pill uses. */
export const WithBanner: Story = {
  args: {
    job: {
      ...baseJob,
      banner: { label: "3 new parts", icon: <PackagePlus aria-hidden="true" /> },
    },
  },
  play: async ({ canvasElement }) => {
    const banner = within(canvasElement).getByText("3 new parts")
    await expect(banner).toHaveClass("bg-fuchsia-600")
    await expect(banner.querySelector("svg")).not.toBeNull()
  },
}

/** A button at the bottom. Clicking it doesn't also click the card. */
export const WithAction: Story = {
  args: { action: { label: "↻ Send back for another run", onClick: fn() } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: /send back/i }))
    await expect(args.action?.onClick).toHaveBeenCalledOnce()
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}

/** While the action is saving, the button is disabled. */
export const ActionDisabled: Story = {
  args: { action: { label: "Send back", onClick: fn(), disabled: true } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("button", { name: "Send back" })).toBeDisabled()
  },
}

/** Content before the title, for example a checkbox. */
export const WithLeadingContent: Story = {
  args: { leadingContent: <input type="checkbox" aria-label="Select job" /> },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("checkbox", { name: "Select job" })).toBeInTheDocument()
  },
}

/** Extra content at the very bottom. */
export const WithExpandedContent: Story = {
  args: { expandedContent: <p className="mt-3 text-xs">Extra detail, shown when expanded.</p> },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/Extra detail/)).toBeInTheDocument()
  },
}

/** `className` adds to the card's classes, for example to remove its bottom margin. */
export const CustomClassName: Story = {
  args: { className: "mb-0" },
  play: async ({ canvasElement }) => {
    await expect(getCard(canvasElement)).toHaveClass("mb-0")
  },
}

/** Every part at once. */
export const Everything: Story = {
  args: {
    job: {
      title: "PO-1001",
      subtitle: "Acme Co",
      tone: "warning",
      stage: { label: "In progress", color: "#d97706" },
      details: ["Created: 29 Oct 2026", "Created by: Sam Jones"],
      description: "Brass connector, 40 off",
      callouts: ["Line 2: 40% (loaded 29 Oct)"],
      badge: { label: "Gold", color: "yellow" },
      pills: [
        { label: "Urgent", tone: "critical", icon: <Zap aria-hidden="true" />, priority: true },
        { label: "Flagged", tone: "warning", icon: <Flag aria-hidden="true" />, priority: true },
        { label: "Internal", tone: "blue" },
        { label: "Locked", tone: "outline", icon: <Lock aria-hidden="true" /> },
      ],
      banner: { label: "2 new parts", icon: <PackagePlus aria-hidden="true" /> },
    },
    action: { label: "↻ Send back for another run", onClick: fn() },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("PO-1001")).toBeInTheDocument()
    await expect(canvas.getByText("Locked")).toBeInTheDocument()
    await expect(canvas.getByText("2 new parts")).toBeInTheDocument()
    await expect(canvas.getByRole("button", { name: /send back/i })).toBeInTheDocument()
  },
}
