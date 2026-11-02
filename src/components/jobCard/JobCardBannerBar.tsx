import type { JobCardBanner } from "./JobCardTypes"

/**
 * A bar across the bottom of a card, in fuchsia: a colour no pill uses, so it
 * can't be mistaken for one.
 */
export const JobCardBannerBar = ({ banner }: { banner: JobCardBanner }) => (
  <div className="mt-3 flex items-center gap-2 rounded bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white shadow [&>svg]:h-4 [&>svg]:w-4">
    {banner.icon}
    {banner.label}
  </div>
)
