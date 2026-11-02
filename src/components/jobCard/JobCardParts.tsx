import type { ReactNode } from "react"
import type { JobCardBadge, JobCardColor, JobCardData } from "./JobCardTypes"

const DEFAULT_STAGE_COLOR = "#6b7280"

// Fixed palette colours on purpose: the shadcn theme tokens have no tints.
const BADGE_COLOR_CLASSES: Record<JobCardColor, string> = {
  gray: "bg-gray-300",
  yellow: "bg-yellow-300",
  red: "bg-red-300",
  orange: "bg-orange-300",
  green: "bg-green-300",
  blue: "bg-blue-300",
  purple: "bg-purple-300",
}

interface JobCardHeadingProps {
  title: string
  stage: JobCardData["stage"]
  leadingContent?: ReactNode
}

/** The title on the left, and the stage with its coloured dot on the right. */
export const JobCardHeading = ({ title, stage, leadingContent }: JobCardHeadingProps) => (
  <div className="flex items-center gap-2 mb-1">
    <div className="flex justify-between w-full">
      <span className="flex items-center gap-2 font-bold text-base">
        {leadingContent}
        {title}
      </span>
      {stage && (
        <div className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: stage.color ?? DEFAULT_STAGE_COLOR }}
          ></span>
          <span className="text-gray-900">{stage.label}</span>
        </div>
      )}
    </div>
  </div>
)

/** Short grey lines, one per entry. */
export const JobCardDetails = ({ details }: { details: string[] }) => (
  <div className="flex flex-col gap-1">
    {details.map((detail, index) => (
      <div key={`${index}-${detail}`} className="text-xs text-gray-500">
        {detail}
      </div>
    ))}
  </div>
)

/** Bordered boxes of text, one per entry. */
export const JobCardCallouts = ({ callouts }: { callouts: string[] }) => (
  <div className="flex justify-between w-full">
    <div className="text-xs my-1 w-full space-y-1">
      {callouts.map((callout, index) => (
        <div
          key={`${index}-${callout}`}
          className="flex gap-2 items-center border p-2 rounded bg-white shadow"
        >
          <span>{callout}</span>
        </div>
      ))}
    </div>
  </div>
)

/** The top of the card: heading, subtitle, detail lines, description and callouts. */
export const JobCardSummary = ({
  job,
  leadingContent,
}: {
  job: JobCardData
  leadingContent?: ReactNode
}) => (
  <div className="w-full">
    <JobCardHeading title={job.title} stage={job.stage} leadingContent={leadingContent} />
    {job.subtitle && (
      <div className="text-[13px] text-gray-600 mb-1">{job.subtitle}</div>
    )}
    {job.details && job.details.length > 0 && <JobCardDetails details={job.details} />}
    {job.description && (
      <div className="text-sm text-gray-700 italic mt-1">{job.description}</div>
    )}
    {job.callouts && job.callouts.length > 0 && (
      <JobCardCallouts callouts={job.callouts} />
    )}
  </div>
)

/** A block of colour to the left of the pills. It gets a divider when pills follow. */
export const JobCardBadgeBlock = ({
  badge,
  hasPills,
}: {
  badge: JobCardBadge
  hasPills: boolean
}) => (
  <div className={`flex pr-4 w-20 ${hasPills ? "border-r" : ""}`}>
    <span
      className={`flex items-center shadow border rounded px-4 py-1 text-center text-wrap ${BADGE_COLOR_CLASSES[badge.color]} ${hasPills ? "border-r" : ""}`}
    >
      {badge.label}
    </span>
  </div>
)
