import type { MouseEvent } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { FooterNavigation, type FooterNavigationItem } from "./FooterNavigation"

// The component reads the current path from the Next router, which doesn't
// exist in jsdom, so each test sets the path it wants.
const mockPathname = vi.hoisted(() => vi.fn<() => string>())
vi.mock("next/navigation", () => ({ usePathname: mockPathname }))

const NAV_ITEMS: FooterNavigationItem[] = [
  { href: "/jobs", icon: "J", label: "Jobs" },
  { href: "/parts", icon: "P", label: "Parts" },
  { href: "/settings", icon: "S", label: "Settings" },
]

function renderNavigation(
  pathname: string,
  overrides: { navItems?: FooterNavigationItem[] } = {},
) {
  mockPathname.mockReturnValue(pathname)
  // jsdom can't navigate, so the click's default is stopped to keep it quiet.
  const onClick = vi.fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault())
  render(<FooterNavigation navItems={overrides.navItems ?? NAV_ITEMS} onClick={onClick} />)
  return { onClick }
}

beforeEach(() => {
  mockPathname.mockReset()
})

describe("FooterNavigation", () => {
  it("renders one link per item, in order, pointing at its href", () => {
    renderNavigation("/jobs")

    const links = screen.getAllByRole("link")
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/jobs", "/parts", "/settings"])
    expect(links.map((link) => link.textContent)).toEqual(["JJobs", "PParts", "SSettings"])
  })

  it("renders no links when there are no items", () => {
    renderNavigation("/jobs", { navItems: [] })

    expect(screen.queryAllByRole("link")).toHaveLength(0)
    expect(screen.getByRole("navigation")).toBeInTheDocument()
  })

  it("highlights only the item whose href matches the path", () => {
    renderNavigation("/parts")

    expect(screen.getByRole("link", { name: /Parts/ })).toHaveClass("text-primary", "border-t-primary")
    expect(screen.getByRole("link", { name: /Jobs/ })).toHaveClass("text-gray-500", "border-t-transparent")
    expect(screen.getByRole("link", { name: /Settings/ })).not.toHaveClass("text-primary")
  })

  it("highlights nothing when the path is a sub-page, because the match is exact", () => {
    renderNavigation("/jobs/42")

    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveClass("text-primary")
    }
  })

  it("highlights nothing when the path matches no item", () => {
    renderNavigation("/elsewhere")

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveClass("text-gray-500")
    }
  })

  it("renders an element icon as well as text", () => {
    renderNavigation("/jobs", {
      navItems: [{ href: "/jobs", icon: <svg data-testid="icon" />, label: "Jobs" }],
    })

    expect(screen.getByTestId("icon")).toBeInTheDocument()
  })

  it("calls onClick once for the tab that is clicked, and for inactive tabs too", () => {
    const { onClick } = renderNavigation("/jobs")

    fireEvent.click(screen.getByRole("link", { name: /Settings/ }))
    expect(onClick).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole("link", { name: /Jobs/ }))
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it("does not call onClick until a tab is clicked", () => {
    const { onClick } = renderNavigation("/jobs")

    expect(onClick).not.toHaveBeenCalled()
  })
})
