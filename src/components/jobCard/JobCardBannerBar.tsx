import type { JobCardBanner } from "./JobCardTypes"

/**
 * A notice bar across the bottom of a card: pale blue with a stronger border,
 * so it holds up on every card tone. Blue because green, orange, red and grey
 * are card tones, and red also means urgent.
 */
export const JobCardBannerBar = ({ banner }: { banner: JobCardBanner }) => (
  <div className="mt-3 flex items-center gap-2 rounded border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs text-gray-600 shadow [&>svg]:h-4 [&>svg]:w-4">
    {banner.icon}
    {banner.label}
  </div>
)
