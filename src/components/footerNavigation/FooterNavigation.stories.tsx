import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn, userEvent, within } from "storybook/test"
import { FooterNavigation, type FooterNavigationItem } from "./FooterNavigation"

const NAV_ITEMS: FooterNavigationItem[] = [
  { href: "/jobs", icon: "📋", label: "Jobs" },
  { href: "/parts", icon: "🔧", label: "Parts" },
  { href: "/scan", icon: "📷", label: "Scan" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
]

const meta = {
  title: "Components/FooterNavigation",
  component: FooterNavigation,
  tags: ["autodocs"],
  args: {
    navItems: NAV_ITEMS,
    // The links point at paths that don't exist in Storybook, so the click is
    // stopped here and only the handler is checked.
    onClick: fn((event) => event.preventDefault()),
  },
  decorators: [
    (Story) => (
      <div className="w-80 overflow-hidden rounded-md border">
        <Story />
      </div>
    ),
  ],
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/jobs" } },
    docs: {
      description: {
        component:
          "A row of tabs for the foot of a phone screen. The tab matching the current path is highlighted. In the stories the path is set with the `nextjs.navigation.pathname` parameter.",
      },
    },
  },
} satisfies Meta<typeof FooterNavigation>

export default meta
type Story = StoryObj<typeof meta>

/** The first tab is the current page, so it is highlighted. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByRole("link")).toHaveLength(4)
    await expect(canvas.getByRole("link", { name: /Jobs/ })).toHaveClass("text-primary")
    await expect(canvas.getByRole("link", { name: /Parts/ })).toHaveClass("text-gray-500")
  },
}

/** A different current path moves the highlight to that tab. */
export const SecondTabActive: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/parts" } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole("link", { name: /Parts/ })).toHaveClass("text-primary")
    await expect(canvas.getByRole("link", { name: /Jobs/ })).toHaveClass("text-gray-500")
  },
}

/** The path must match exactly, so a sub-page highlights no tab. */
export const NoTabActive: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/jobs/42" } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    for (const link of canvas.getAllByRole("link")) {
      await expect(link).not.toHaveClass("text-primary")
    }
  },
}

/** The icon can be any element, such as an inline SVG, as well as an emoji or text. */
export const WithElementIcons: Story = {
  args: {
    navItems: NAV_ITEMS.map((item) => ({
      ...item,
      icon: (
        <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor">
          <circle cx="12" cy="12" r="9" />
        </svg>
      ),
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByRole("link")).toHaveLength(4)
    await expect(canvasElement.querySelectorAll("svg")).toHaveLength(4)
  },
}

/** Two tabs is enough: each takes half the width. */
export const TwoTabs: Story = {
  args: { navItems: NAV_ITEMS.slice(0, 2) },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("link")).toHaveLength(2)
  },
}

/** Clicking a tab calls `onClick` once. The handler runs for every tab, not only the active one. */
export const ClickingATab: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole("link", { name: /Scan/ }))

    await expect(args.onClick).toHaveBeenCalledTimes(1)
  },
}
