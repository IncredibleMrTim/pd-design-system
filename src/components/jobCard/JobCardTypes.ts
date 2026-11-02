import type { ReactNode } from "react"

/**
 * How the whole card is coloured. `success` is green, `warning` orange,
 * `danger` red and `neutral` grey. What each one means is up to the using app,
 * for example an age or a status.
 */
export type JobCardTone = "success" | "warning" | "danger" | "neutral"

/** The colours a badge can be. */
export type JobCardColor =
  | "gray"
  | "yellow"
  | "red"
  | "orange"
  | "green"
  | "blue"
  | "purple"

/**
 * How a pill looks.
 *
 * - `critical`: solid red, bold, with a shadow. For the most urgent flag.
 * - `warning`: solid yellow, bold, with a shadow. For a second priority flag.
 * - `danger`: solid red, not bold.
 * - `red`, `orange`, `green`, `blue`, `purple`: a soft tint.
 * - `outline`: a plain grey outline.
 * - `dashed`: a dashed outline, for something not final yet.
 */
export type JobCardPillTone =
  | "critical"
  | "warning"
  | "danger"
  | "red"
  | "orange"
  | "green"
  | "blue"
  | "purple"
  | "outline"
  | "dashed"

/** Where a job is in its life, shown top right of the card beside a coloured dot. */
export interface JobCardStage {
  /** The words shown, for example "In progress". */
  label: string
  /** Any CSS colour for the dot. Defaults to grey. */
  color?: string
}

/** A block of colour to the left of the pills, for example a category. */
export interface JobCardBadge {
  /** The words shown. */
  label: string
  /** The badge colour. */
  color: JobCardColor
}

/** A small rounded label, for example a flag or a requirement. */
export interface JobCardPill {
  /** The words shown. Also used as the React key, so keep them unique. */
  label: string
  /** How the pill looks. */
  tone: JobCardPillTone
  /** An icon before the label. Any 12 pixel svg, for example a lucide icon. */
  icon?: ReactNode
  /**
   * Priority pills lead, and are split from the others by a horizontal rule, so
   * they read as a separate group.
   */
  priority?: boolean
}

/** A pale blue notice bar across the bottom of the card. */
export interface JobCardBanner {
  /** The words shown. */
  label: string
  /** An icon before the label. Any 16 pixel svg, for example a lucide icon. */
  icon?: ReactNode
}

/** A full width button at the bottom of the card. */
export interface JobCardAction {
  /** The button text. */
  label: string
  /** Called when the button is clicked. It doesn't also trigger the card's `onClick`. */
  onClick: () => void
  /** Disables the button, for example while it is saving. */
  disabled?: boolean
}

/**
 * Everything a JobCard shows, already decided. The card works out nothing: the
 * using app turns its own job into this, so the card never needs to know the
 * app's types, rules, wording or date formats.
 */
export interface JobCardData {
  /** The card's heading, for example a PO number. */
  title: string
  /** A line under the heading, for example the customer. */
  subtitle?: string
  /** Where the job is. Leave out to hide it. */
  stage?: JobCardStage
  /** The card colour. Defaults to `neutral`. */
  tone?: JobCardTone
  /** Short grey lines under the subtitle, for example "Created by: Sam Jones". */
  details?: string[]
  /** A description of the work, shown in italics. */
  description?: string
  /** Bordered boxes of text under the description, one line each. */
  callouts?: string[]
  /** A colour block beside the pills. */
  badge?: JobCardBadge
  /** Status pills. */
  pills?: JobCardPill[]
  /** A bar across the bottom of the card. */
  banner?: JobCardBanner
}
