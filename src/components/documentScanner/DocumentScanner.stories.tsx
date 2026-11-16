import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import {
  DocumentScanner,
  type DocumentScannerPage,
  type DocumentScannerProps,
  type DocumentScannerStatus,
} from "./DocumentScanner"

/**
 * A made-up page as an image, so the stories need no files and no network.
 * Each page gets its own number and a slightly different tint.
 */
function makeSamplePage(pageNumber: number): DocumentScannerPage {
  const tint = ["#e8f0fe", "#fef3e8", "#e8fef1"][pageNumber % 3]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="${tint}"/><rect x="30" y="40" width="240" height="14" fill="#9ca3af"/><rect x="30" y="80" width="180" height="10" fill="#cbd5e1"/><rect x="30" y="110" width="210" height="10" fill="#cbd5e1"/><rect x="30" y="140" width="150" height="10" fill="#cbd5e1"/><text x="150" y="330" font-size="22" text-anchor="middle" fill="#6b7280" font-family="sans-serif">Sample page ${pageNumber}</text></svg>`
  return {
    id: `sample-page-${pageNumber}`,
    src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    alt: `Sample page ${pageNumber}`,
  }
}

const ONE_PAGE = [makeSamplePage(1)]
const THREE_PAGES = [makeSamplePage(1), makeSamplePage(2), makeSamplePage(3)]

const meta = {
  title: "Components/DocumentScanner",
  component: DocumentScanner,
  tags: ["autodocs"],
  args: {
    pages: [],
    onAddFiles: fn(),
    onRemovePage: fn(),
    onScan: fn(),
  },
  argTypes: {
    status: {
      control: "radio",
      options: ["idle", "success", "error"] satisfies DocumentScannerStatus[],
    },
    capture: {
      control: "radio",
      options: ["environment", "user", false],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DocumentScanner>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing staged yet: one large button that opens the camera or the file picker. */
export const Empty: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByRole("button", { name: /Tap to photograph the document/ }),
    ).toBeEnabled()
    // The scan and add page buttons only appear once there is a page.
    await expect(canvas.queryByRole("button", { name: "Scan" })).toBeNull()

    const fileInput = canvasElement.querySelector<HTMLInputElement>(
      "[data-slot='document-scanner-input']",
    )!
    const photo = new File(["photo"], "photo.png", { type: "image/png" })
    await userEvent.upload(fileInput, photo)

    await expect(args.onAddFiles).toHaveBeenCalledWith([photo])
  },
}

/** One page staged, ready to scan. */
export const OnePage: Story = {
  args: { pages: ONE_PAGE },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText("Page 1 of 1")).toBeVisible()

    await userEvent.click(canvas.getByRole("button", { name: "Scan" }))
    await expect(args.onScan).toHaveBeenCalledTimes(1)
  },
}

/**
 * Several pages. They sit in a strip that snaps to one page at a time, so swipe
 * or scroll sideways to see the others.
 */
export const ManyPages: Story = {
  args: { pages: THREE_PAGES },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByRole("listitem")).toHaveLength(3)
    await expect(canvas.getByText("Page 3 of 3")).toBeInTheDocument()

    await userEvent.click(canvas.getByRole("button", { name: "Remove page 2" }))
    await expect(args.onRemovePage).toHaveBeenCalledWith("sample-page-2")
  },
}

/** A scan is running: every button is locked and the scan button says so. */
export const Scanning: Story = {
  args: { pages: THREE_PAGES, isScanning: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole("button", { name: "Scanning..." })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "Add page" })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "Remove page 1" })).toBeDisabled()
  },
}

/** A scan worked. The first message is the headline and the rest are detail. */
export const Success: Story = {
  args: {
    pages: THREE_PAGES,
    status: "success",
    messages: ["Scan complete", "4 lines found", "1 line needs checking"],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole("status")).toHaveTextContent("Scan complete")
    // After a scan the button offers to run it again.
    await expect(canvas.getByRole("button", { name: "Rescan" })).toBeEnabled()
  },
}

/** A scan failed. The result is announced to screen readers as an alert. */
export const Failure: Story = {
  args: {
    pages: ONE_PAGE,
    status: "error",
    messages: ["The scan failed", "Check the photo is clear and try again"],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole("alert")).toHaveTextContent("The scan failed")
    await expect(canvas.getByRole("button", { name: "Rescan" })).toBeEnabled()
  },
}

/** The whole scanner is locked, for example while the form around it is saving. */
export const Disabled: Story = {
  args: { pages: THREE_PAGES, isDisabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    for (const button of canvas.getAllByRole("button")) {
      await expect(button).toBeDisabled()
    }
  },
}

/** Every piece of text can be reworded or translated. Anything left out keeps its default. */
export const CustomLabels: Story = {
  args: {
    pages: THREE_PAGES,
    labels: {
      title: "Read the delivery note",
      hint: "One photo per sheet",
      addPage: "Add sheet",
      scan: "Read it",
      removePage: "Delete sheet",
      pageCount: (pageNumber, pageTotal) => `Sheet ${pageNumber} of ${pageTotal}`,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole("button", { name: "Add sheet" })).toBeInTheDocument()
    await expect(canvas.getByRole("button", { name: "Read it" })).toBeInTheDocument()
    await expect(canvas.getByRole("button", { name: "Delete sheet 1" })).toBeInTheDocument()
    await expect(canvas.getByText("Sheet 1 of 3")).toBeInTheDocument()
  },
}

/**
 * Plays the part of the app: it holds the pages, turns chosen photos into
 * previews, and pretends to scan for a moment. The component itself does none
 * of this, which is why an app can plug in whatever does the scanning.
 */
function InteractiveScanner(props: DocumentScannerProps) {
  const [pages, setPages] = useState<DocumentScannerPage[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [status, setStatus] = useState<DocumentScannerStatus>("idle")
  const [messages, setMessages] = useState<string[]>([])

  const handleAddFiles = (files: File[]) => {
    props.onAddFiles(files)
    setPages((current) => [
      ...current,
      ...files.map((file) => ({
        id: `${file.name}-${current.length}-${file.size}`,
        src: URL.createObjectURL(file),
        alt: file.name,
      })),
    ])
  }

  const handleScan = () => {
    props.onScan()
    setIsScanning(true)
    window.setTimeout(() => {
      setIsScanning(false)
      setStatus("success")
      setMessages(["Scan complete", `${pages.length} page(s) read`])
    }, 600)
  }

  return (
    <DocumentScanner
      {...props}
      pages={pages}
      isScanning={isScanning}
      status={status}
      messages={messages}
      onAddFiles={handleAddFiles}
      onRemovePage={(pageId) => {
        props.onRemovePage(pageId)
        setPages((current) => current.filter((page) => page.id !== pageId))
      }}
      onScan={handleScan}
    />
  )
}

/** Choose a photo from your device to see the whole flow: add, scan, result, remove. */
export const Interactive: Story = {
  render: (args) => <InteractiveScanner {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const fileInput = canvasElement.querySelector<HTMLInputElement>(
      "[data-slot='document-scanner-input']",
    )!

    await userEvent.upload(fileInput, new File(["photo"], "first.png", { type: "image/png" }))
    await expect(canvas.getByText("Page 1 of 1")).toBeVisible()

    await userEvent.click(canvas.getByRole("button", { name: "Scan" }))
    await expect(canvas.getByRole("button", { name: "Scanning..." })).toBeDisabled()

    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Scan complete"))
    await expect(canvas.getByRole("button", { name: "Rescan" })).toBeEnabled()

    await userEvent.click(canvas.getByRole("button", { name: "Remove page 1" }))
    await expect(
      canvas.getByRole("button", { name: /Tap to photograph the document/ }),
    ).toBeInTheDocument()
  },
}
