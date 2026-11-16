import { describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  DocumentScanner,
  type DocumentScannerPage,
  type DocumentScannerProps,
} from "./DocumentScanner"

const SAMPLE_PAGES: DocumentScannerPage[] = [
  { id: "page-a", src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" },
  { id: "page-b", src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" },
  { id: "page-c", src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" },
]

function renderScanner(overrides: Partial<DocumentScannerProps> = {}) {
  const callbacks = {
    onAddFiles: vi.fn(),
    onRemovePage: vi.fn(),
    onScan: vi.fn(),
  }
  const { container } = render(
    <DocumentScanner pages={[]} {...callbacks} {...overrides} />,
  )
  // The file input is hidden, so it has no role to find it by.
  const fileInput = container.querySelector<HTMLInputElement>(
    "[data-slot='document-scanner-input']",
  )!
  return { ...callbacks, fileInput, container }
}

function makeImageFile(name: string) {
  return new File(["not a real image"], name, { type: "image/png" })
}

describe("DocumentScanner with no pages", () => {
  it("shows only the photo prompt, with no scan or add page button", () => {
    renderScanner()

    expect(
      screen.getByRole("button", { name: /Tap to photograph the document/ }),
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Scan" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add page" })).not.toBeInTheDocument()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })

  it("opens the file picker when the prompt is pressed", async () => {
    const { fileInput } = renderScanner()
    const clickSpy = vi.spyOn(fileInput, "click")

    await userEvent.click(
      screen.getByRole("button", { name: /Tap to photograph the document/ }),
    )

    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it("disables the prompt while a scan is running", () => {
    renderScanner({ isScanning: true })

    expect(
      screen.getByRole("button", { name: /Tap to photograph the document/ }),
    ).toBeDisabled()
  })
})

describe("DocumentScanner with pages", () => {
  it("counts each page out of the total, in order", () => {
    renderScanner({ pages: SAMPLE_PAGES })

    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(3)
    expect(items.map((item) => item.textContent)).toEqual([
      "Page 1 of 3",
      "Page 2 of 3",
      "Page 3 of 3",
    ])
  })

  it("gives each image a numbered description unless the page brings its own", () => {
    renderScanner({
      pages: [
        { id: "plain", src: SAMPLE_PAGES[0].src },
        { id: "described", src: SAMPLE_PAGES[0].src, alt: "Front of the form" },
      ],
    })

    expect(screen.getByRole("img", { name: "Page 1" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Front of the form" })).toBeInTheDocument()
  })

  it("passes the id of the right page when a remove button is pressed", async () => {
    const { onRemovePage } = renderScanner({ pages: SAMPLE_PAGES })

    await userEvent.click(screen.getByRole("button", { name: "Remove page 2" }))

    expect(onRemovePage).toHaveBeenCalledTimes(1)
    expect(onRemovePage).toHaveBeenCalledWith("page-b")
  })

  it("calls onScan when the scan button is pressed", async () => {
    const { onScan } = renderScanner({ pages: SAMPLE_PAGES })

    await userEvent.click(screen.getByRole("button", { name: "Scan" }))

    expect(onScan).toHaveBeenCalledTimes(1)
  })

  it("opens the file picker from the add page button", async () => {
    const { fileInput } = renderScanner({ pages: SAMPLE_PAGES })
    const clickSpy = vi.spyOn(fileInput, "click")

    await userEvent.click(screen.getByRole("button", { name: "Add page" }))

    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it("locks every button while a scan is running and says so on the scan button", () => {
    renderScanner({ pages: SAMPLE_PAGES, isScanning: true })

    expect(screen.getByRole("button", { name: "Scanning..." })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Add page" })).toBeDisabled()
    for (const removeButton of screen.getAllByRole("button", { name: /Remove page/ })) {
      expect(removeButton).toBeDisabled()
    }
  })

  it("locks every button when the whole component is disabled", () => {
    renderScanner({ pages: SAMPLE_PAGES, isDisabled: true })

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled()
    }
  })
})

describe("DocumentScanner choosing files", () => {
  it("passes the chosen images to onAddFiles as a list", async () => {
    const { onAddFiles, fileInput } = renderScanner()
    const firstPhoto = makeImageFile("first.png")
    const secondPhoto = makeImageFile("second.png")

    await userEvent.upload(fileInput, [firstPhoto, secondPhoto])

    expect(onAddFiles).toHaveBeenCalledTimes(1)
    expect(onAddFiles).toHaveBeenCalledWith([firstPhoto, secondPhoto])
  })

  it("does not call onAddFiles when the picker is closed with nothing chosen", () => {
    const { onAddFiles, fileInput } = renderScanner()

    fireEvent.change(fileInput, { target: { files: [] } })

    expect(onAddFiles).not.toHaveBeenCalled()
  })

  it("clears the input so the same photo can be chosen again", async () => {
    const { onAddFiles, fileInput } = renderScanner()
    const photo = makeImageFile("again.png")

    await userEvent.upload(fileInput, photo)
    expect(fileInput.value).toBe("")
    await userEvent.upload(fileInput, photo)

    expect(onAddFiles).toHaveBeenCalledTimes(2)
  })

  it("offers images and the rear camera by default", () => {
    const { fileInput } = renderScanner()

    expect(fileInput).toHaveAttribute("accept", "image/*")
    expect(fileInput).toHaveAttribute("capture", "environment")
    expect(fileInput).toHaveAttribute("multiple")
  })

  it("lets the app change the accepted files and the camera", () => {
    const { fileInput } = renderScanner({ accept: "image/png", capture: "user" })

    expect(fileInput).toHaveAttribute("accept", "image/png")
    expect(fileInput).toHaveAttribute("capture", "user")
  })

  it("leaves the camera out when capture is false, so saved photos can be picked", () => {
    const { fileInput } = renderScanner({ capture: false })

    expect(fileInput).not.toHaveAttribute("capture")
  })
})

describe("DocumentScanner scan result", () => {
  it("shows no result before a scan, even if messages are passed", () => {
    renderScanner({ pages: SAMPLE_PAGES, messages: ["Leftover text"] })

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.queryByText("Leftover text")).not.toBeInTheDocument()
  })

  it("shows a success as a status, with every message line in order", () => {
    renderScanner({
      pages: SAMPLE_PAGES,
      status: "success",
      messages: ["Scan complete", "3 lines found", "1 line needs checking"],
    })

    const result = screen.getByRole("status")
    expect(result.textContent).toBe("Scan complete3 lines found1 line needs checking")
    expect(within(result).getByText("Scan complete")).toHaveClass("font-semibold")
    expect(within(result).getByText("3 lines found")).not.toHaveClass("font-semibold")
  })

  it("shows a failure as an alert, in the error colours", () => {
    renderScanner({
      pages: SAMPLE_PAGES,
      status: "error",
      messages: ["The scan failed"],
    })

    const result = screen.getByRole("alert")
    expect(result).toHaveTextContent("The scan failed")
    expect(result).toHaveClass("text-destructive")
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("shows no panel when there is a status but nothing to say", () => {
    renderScanner({ pages: SAMPLE_PAGES, status: "success", messages: [] })

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("calls the scan button Rescan once a scan has run, and Scan before that", () => {
    renderScanner({ pages: SAMPLE_PAGES })
    expect(screen.getByRole("button", { name: "Scan" })).toBeInTheDocument()
    cleanup()

    renderScanner({ pages: SAMPLE_PAGES, status: "success" })
    expect(screen.getByRole("button", { name: "Rescan" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Scan" })).not.toBeInTheDocument()
  })

  it("puts Scanning... on the button ahead of Rescan while a rescan runs", () => {
    renderScanner({ pages: SAMPLE_PAGES, status: "error", isScanning: true })

    expect(screen.getByRole("button", { name: "Scanning..." })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Rescan" })).not.toBeInTheDocument()
  })
})

describe("DocumentScanner labels", () => {
  it("rewords only the labels given and keeps the default for the rest", () => {
    renderScanner({
      pages: SAMPLE_PAGES,
      labels: {
        addPage: "Add sheet",
        removePage: "Delete sheet",
        pageCount: (pageNumber, pageTotal) => `Sheet ${pageNumber}/${pageTotal}`,
      },
    })

    expect(screen.getByRole("button", { name: "Add sheet" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Delete sheet 1" })).toBeInTheDocument()
    expect(screen.getByText("Sheet 1/3")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Scan" })).toBeInTheDocument()
  })

  it("shows the heading and its hint", () => {
    renderScanner({ labels: { title: "Read the form", hint: "Use the rear camera" } })

    expect(screen.getByText(/Read the form/)).toBeInTheDocument()
    expect(screen.getByText("Use the rear camera")).toBeInTheDocument()
  })
})
