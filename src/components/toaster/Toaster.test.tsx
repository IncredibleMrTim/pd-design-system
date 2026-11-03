import { afterEach, describe, expect, it } from "vitest"
import { act, render, screen } from "@testing-library/react"
import { Toaster, toast, toastColors } from "@/components/toaster/Toaster"

// Toasts live in one store shared by every test, so each test uses its own
// message text and the store is cleared afterwards.
afterEach(() => {
  act(() => {
    toast.dismiss()
  })
})

const showToast = (show: () => void) => {
  act(() => {
    show()
  })
}

describe("toastColors", () => {
  it("returns no styles when no color is given", () => {
    expect(toastColors({})).toEqual({})
  })

  it("sets only the colors that are given", () => {
    expect(toastColors({ background: "red" })).toEqual({ "--normal-bg": "red" })
    expect(toastColors({ text: "white", border: "blue" })).toEqual({
      "--normal-text": "white",
      "--normal-border": "blue",
    })
  })

  it("sets all three colors", () => {
    expect(
      toastColors({ background: "#111", text: "#eee", border: "#444" }),
    ).toEqual({
      "--normal-bg": "#111",
      "--normal-text": "#eee",
      "--normal-border": "#444",
    })
  })

  it("accepts a theme variable", () => {
    expect(toastColors({ background: "var(--primary)" })).toEqual({
      "--normal-bg": "var(--primary)",
    })
  })

  it("leaves out a color given as an empty string, so the theme's stays", () => {
    expect(toastColors({ background: "", text: "white" })).toEqual({
      "--normal-text": "white",
    })
  })
})

describe("Toaster", () => {
  it("shows a message passed to toast", async () => {
    render(<Toaster />)

    showToast(() => toast("Saved the job"))

    expect(await screen.findByText("Saved the job")).toBeInTheDocument()
  })

  it("puts toasts at the top centre by default", async () => {
    const { container } = render(<Toaster />)

    showToast(() => toast("Default position"))
    await screen.findByText("Default position")

    const toaster = container.ownerDocument.querySelector(
      "[data-sonner-toaster]",
    )
    expect(toaster).toHaveAttribute("data-y-position", "top")
    expect(toaster).toHaveAttribute("data-x-position", "center")
  })

  it("puts toasts where position says", async () => {
    const { container } = render(<Toaster position="bottom-right" />)

    showToast(() => toast("Moved position"))
    await screen.findByText("Moved position")

    const toaster = container.ownerDocument.querySelector(
      "[data-sonner-toaster]",
    )
    expect(toaster).toHaveAttribute("data-y-position", "bottom")
    expect(toaster).toHaveAttribute("data-x-position", "right")
  })

  it("uses the icon given to a single toast", async () => {
    render(<Toaster />)

    showToast(() =>
      toast("Starred the job", { icon: <span data-testid="star-icon" /> }),
    )

    expect(await screen.findByTestId("star-icon")).toBeInTheDocument()
  })

  it("changes the icon for one type and keeps the default for the others", async () => {
    const { container } = render(
      <Toaster icons={{ success: <span data-testid="heart-icon" /> }} />,
    )

    showToast(() => {
      toast.success("Success with new icon")
      toast.error("Error with default icon")
    })

    expect(await screen.findByTestId("heart-icon")).toBeInTheDocument()
    // The error icon was not changed, so the default one is still drawn.
    await screen.findByText("Error with default icon")
    expect(
      container.ownerDocument.querySelector(".lucide-octagon-x"),
    ).toBeInTheDocument()
  })

  it("applies the colors from toastColors to the toast", async () => {
    render(<Toaster />)

    showToast(() =>
      toast("Tinted toast", {
        style: toastColors({ background: "#dc2626", text: "#ffffff" }),
      }),
    )

    const toastElement = (await screen.findByText("Tinted toast")).closest(
      "[data-sonner-toast]",
    )
    expect(toastElement).toHaveAttribute(
      "style",
      expect.stringContaining("--normal-bg: #dc2626"),
    )
    expect(toastElement).toHaveAttribute(
      "style",
      expect.stringContaining("--normal-text: #ffffff"),
    )
  })

  it("shows a toast only in the toaster it is sent to", async () => {
    render(
      <>
        <Toaster id="first" />
        <Toaster id="second" />
      </>,
    )

    showToast(() => toast("Only in the first", { toasterId: "first" }))

    expect(await screen.findAllByText("Only in the first")).toHaveLength(1)
  })
})
