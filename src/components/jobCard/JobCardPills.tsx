import type { JobCardPill, JobCardPillTone } from "./JobCardTypes"

// The status colours are fixed palette colours on purpose: the shadcn theme
// tokens have no success, warning or tint colours to map them to.
const PILL_BASE =
  "flex items-center gap-1 h-5 rounded-full text-center text-[10px] md:text-xs [&>svg]:w-3 [&>svg]:h-3"

const PILL_TONE_CLASSES: Record<JobCardPillTone, string> = {
  critical: "px-3 bg-red-500 text-white font-bold shadow-md shadow-red-900/70",
  warning: "px-3 bg-yellow-300 text-gray-900 font-bold shadow-md shadow-yellow-800/70",
  danger: "px-4 border bg-red-400 text-white shadow",
  red: "px-4 border bg-red-200 shadow",
  orange: "px-4 border bg-orange-200 shadow",
  green: "px-4 border bg-green-200 shadow",
  blue: "px-4 border bg-blue-200 shadow",
  purple: "px-4 border bg-purple-200 shadow",
  outline: "px-3 border border-gray-300 bg-white text-gray-600",
  dashed: "px-3 border border-dashed border-gray-400 bg-white text-gray-600",
}

/** One pill: a small rounded label, with an optional icon before the words. */
export const JobCardPillItem = ({ pill }: { pill: JobCardPill }) => (
  <span className={`${PILL_BASE} ${PILL_TONE_CLASSES[pill.tone]}`}>
    {pill.icon}
    {pill.label}
  </span>
)

/**
 * The pills, with the priority ones first. When both groups are present a
 * horizontal rule splits them, so the priority pills read as a separate group.
 */
export const JobCardPillList = ({ pills }: { pills: JobCardPill[] }) => {
  const priorityPills = pills.filter((pill) => pill.priority)
  const otherPills = pills.filter((pill) => !pill.priority)

  return (
    <div className="flex gap-2 flex-wrap">
      {priorityPills.length > 0 && (
        <div
          className={`flex gap-2 w-full ${otherPills.length > 0 ? "pb-2 border-b" : ""}`}
        >
          {priorityPills.map((pill) => (
            <JobCardPillItem key={pill.label} pill={pill} />
          ))}
        </div>
      )}
      {otherPills.map((pill) => (
        <JobCardPillItem key={pill.label} pill={pill} />
      ))}
    </div>
  )
}
