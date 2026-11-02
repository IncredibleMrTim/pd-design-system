import { Flag, PackagePlus, Zap } from "lucide-react"
import type { JobCardData, JobCardPill, JobCardStage, JobCardTone } from "@/components"
import type { ExampleOrder, ExampleOrderStatus } from "./ExampleOrder"

const DAY_IN_MS = 24 * 60 * 60 * 1000

/** Choices the using app makes about how the card reads. */
export interface ToJobCardDataOptions {
  /**
   * "full" shows everything. "summary" is for a user who only needs the basics:
   * it leaves out the stage, tier, tasks and new item banner. An adapter gets a
   * restricted view just by not filling the fields in.
   */
  view?: "full" | "summary"
  /** The current time, as a millisecond timestamp. Pass it in so results are repeatable. */
  now?: number
  /** The locale for dates. Defaults to en-GB. */
  locale?: string
  /** The time zone for dates. Defaults to the viewer's own. */
  timeZone?: string
}

// The app's own stage wording and colours. The card has no idea what these mean.
const STAGES: Record<ExampleOrderStatus, JobCardStage> = {
  new: { label: "New", color: "#16a34a" },
  "in-progress": { label: "In progress", color: "#d97706" },
  ready: { label: "Ready to ship", color: "#2563eb" },
  shipped: { label: "Shipped", color: "#6b7280" },
}

/**
 * The app's own age rule: under two days is fine, under five is a warning, then
 * it's late. The clock stops once the order is ready, and a shipped order is
 * past caring, so it is grey.
 */
const getTone = (order: ExampleOrder, now: number): JobCardTone => {
  if (order.status === "shipped") return "neutral"
  const ageInDays = ((order.readyAt ?? now) - order.createdAt) / DAY_IN_MS
  if (ageInDays < 2) return "success"
  if (ageInDays < 5) return "warning"
  return "danger"
}

const getPills = (order: ExampleOrder): JobCardPill[] => {
  const pills: JobCardPill[] = []
  if (order.isUrgent) {
    pills.push({ label: "Urgent", tone: "critical", icon: <Zap aria-hidden="true" />, priority: true })
  }
  if (order.isFlagged) {
    pills.push({ label: "Flagged", tone: "warning", icon: <Flag aria-hidden="true" />, priority: true })
  }
  if (order.isInternal) pills.push({ label: "Internal", tone: "blue" })
  if (order.needsFreight) pills.push({ label: "Freight", tone: "orange" })
  return pills
}

/** Pluralises the banner: "1 new item", "3 new items". */
const getBannerLabel = (count: number): string =>
  count === 1 ? "1 new item" : `${count} new items`

/**
 * Turns an example order into the data a JobCard shows.
 *
 * This is the pattern every app follows: its own job in, `JobCardData` out. All
 * the app's rules live here, so the card itself never learns about them.
 */
export const toJobCardData = (
  order: ExampleOrder,
  { view = "full", now = Date.now(), locale = "en-GB", timeZone }: ToJobCardDataOptions = {},
): JobCardData => {
  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone,
    })
  const isFull = view === "full"

  return {
    title: order.reference,
    subtitle: order.customerName,
    description: order.summary,
    tone: isFull ? getTone(order, now) : "neutral",
    stage: isFull ? STAGES[order.status] : undefined,
    details: [
      `Created: ${formatDate(order.createdAt)}`,
      ...(order.createdByName ? [`Created by: ${order.createdByName}`] : []),
    ],
    callouts: isFull
      ? order.activeTasks.map(
          (task) => `${task.name}: ${task.percent}% (started ${formatDate(task.startedAt)})`,
        )
      : undefined,
    badge: isFull
      ? order.tier === "gold"
        ? { label: "Gold", color: "yellow" }
        : { label: "Silver", color: "gray" }
      : undefined,
    pills: getPills(order),
    banner:
      isFull && order.newItemCount > 0
        ? { label: getBannerLabel(order.newItemCount), icon: <PackagePlus aria-hidden="true" /> }
        : undefined,
  }
}
