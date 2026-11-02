/** Where an example order is in its life. */
export type ExampleOrderStatus = "new" | "in-progress" | "ready" | "shipped"

/** A task an example order is being worked on in. */
export interface ExampleOrderTask {
  /** The task's name. */
  name: string
  /** How much of the task's capacity the order takes. */
  percent: number
  /** When work started, as a millisecond timestamp. */
  startedAt: number
}

/**
 * A made-up job type, standing in for an app's own. Real apps have their own
 * type and their own rules. This one exists only to show how to write an adapter.
 */
export interface ExampleOrder {
  /** The reference shown as the card's title. */
  reference: string
  /** The customer's name. */
  customerName: string
  /** A short description of what was ordered. */
  summary?: string
  /** When the order was created, as a millisecond timestamp. */
  createdAt: number
  /** When the order became ready, as a millisecond timestamp. Stops the age clock. */
  readyAt?: number | null
  /** Where the order is. */
  status: ExampleOrderStatus
  /** The customer's tier. */
  tier: "gold" | "silver"
  /** Marked urgent by hand. */
  isUrgent: boolean
  /** Flagged for attention by hand. */
  isFlagged: boolean
  /** Work for the business itself, not a customer. */
  isInternal: boolean
  /** The customer wants it shipped. */
  needsFreight: boolean
  /** Who created the order. */
  createdByName?: string
  /** Items nobody has set up yet. */
  newItemCount: number
  /** The tasks the order is being worked on in right now. */
  activeTasks: ExampleOrderTask[]
}
