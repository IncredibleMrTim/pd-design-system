"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { JobCardBannerBar } from "./JobCardBannerBar"
import { JobCardBadgeBlock, JobCardSummary } from "./JobCardParts"
import { JobCardPillList } from "./JobCardPills"
import type { JobCardAction, JobCardData, JobCardTone } from "./JobCardTypes"

// Fixed palette colours on purpose: the shadcn theme tokens have no success or
// warning colours to map them to.
const CARD_TONE_CLASSES: Record<JobCardTone, string> = {
  success: "border-green-400 bg-green-50",
  warning: "border-orange-400 bg-orange-50",
  danger: "border-red-400 bg-red-50",
  neutral: "border-gray-300 bg-gray-50",
}

export interface JobCardProps {
  /**
   * What to show, already decided. The card works out nothing, so turn the
   * app's own job into this before passing it in.
   */
  job: JobCardData
  /**
   * Called when the card is clicked. Without it the card isn't clickable and
   * doesn't show a pointer.
   */
  onClick?: () => void
  /**
   * A full width button at the bottom of the card. Clicking it doesn't also
   * call `onClick`.
   */
  action?: JobCardAction
  /** Content before the title, for example a checkbox. */
  leadingContent?: ReactNode
  /** Extra content at the very bottom of the card. */
  expandedContent?: ReactNode
  /** Extra classes for the card, for example to change its margin. */
  className?: string
}

/**
 * A card for one job: a title, an optional stage, subtitle, detail lines,
 * description, badge, pills and a banner, coloured by a tone.
 *
 * It only displays what it is given, so it has no idea what a job is in any
 * particular app. The using app decides every word and colour, which is what
 * lets one card serve different projects.
 *
 * - Leave a field out and its part of the card disappears.
 * - Pills marked `priority` lead, split from the others by a rule.
 * - The colour comes from `job.tone` only.
 */
export const JobCard = ({
  job,
  onClick,
  action,
  leadingContent,
  expandedContent,
  className,
}: JobCardProps) => {
  const hasPills = Boolean(job.pills && job.pills.length > 0)

  return (
    <Card
      onClick={onClick}
      className={cn(
        "border-2 mb-2.5 active:scale-[0.98] transition-all hover:opacity-90",
        onClick && "cursor-pointer",
        CARD_TONE_CLASSES[job.tone ?? "neutral"],
        className,
      )}
    >
      <CardContent className="p-3.5">
        <div className="flex justify-between items-start mb-2">
          <JobCardSummary job={job} leadingContent={leadingContent} />
        </div>

        {(job.badge || hasPills) && (
          <div className="flex gap-2 text-xs">
            {job.badge && <JobCardBadgeBlock badge={job.badge} hasPills={hasPills} />}
            {hasPills && <JobCardPillList pills={job.pills ?? []} />}
          </div>
        )}

        {job.banner && <JobCardBannerBar banner={job.banner} />}

        {action && (
          <Button
            onClick={(event) => {
              event.stopPropagation()
              action.onClick()
            }}
            className="w-full mt-3 bg-white border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-normal hover:bg-gray-50"
            variant="outline"
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        )}
        <div>{expandedContent}</div>
      </CardContent>
    </Card>
  )
}
