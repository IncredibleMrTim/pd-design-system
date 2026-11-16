"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MouseEventHandler, ReactNode } from "react"

/** One tab in the footer navigation. */
export type FooterNavigationItem = {
  /** Where the tab links to. The tab is active when this matches the current path exactly. */
  href: string
  /** What shows above the label: an emoji or text, or any element such as an icon. */
  icon: string | ReactNode
  /** The tab's text, shown under the icon. */
  label: string
}

export interface FooterNavigationProps {
  /** The tabs, in the order they show. Each `href` should be unique, because it is the React key. */
  navItems: FooterNavigationItem[]
  /** Called when any tab is clicked, before the navigation happens. Not controlled: the link still navigates. */
  onClick: MouseEventHandler<HTMLAnchorElement>
}

/**
 * A row of equal-width tabs for the foot of a phone-sized screen. The tab whose
 * `href` matches the current path is highlighted with the primary colour.
 * It reads the path from the Next router, so it must render inside a Next app.
 */
export function FooterNavigation({ onClick, navItems }: FooterNavigationProps) {
  const pathname = usePathname()

  return (
    <nav className="flex border-t border-gray-200 bg-white shrink-0">
      {navItems.map(({ href, icon, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={`flex-1 px-1 py-2.5 flex flex-col items-center gap-0.5 border-none bg-transparent cursor-pointer text-[10px] font-medium border-t-2 transition-colors ${
              isActive
                ? "text-primary border-t-primary"
                : "text-gray-500 border-t-transparent"
            }`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
