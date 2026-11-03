import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useId } from "react"
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test"
import { Button } from "@/components/ui/button"
import { HeartIcon, StarIcon } from "lucide-react"
import {
  Toaster,
  toast,
  toastColors,
  type ToastColors,
  type ToasterProps,
} from "./Toaster"

const meta = {
  title: "Components/Toaster",
  component: Toaster,
  tags: ["autodocs"],
  // Storybook cannot work out a list of choices from the props type here, so it
  // shows "Set object". Naming the options gives a drop-down instead.
  argTypes: {
    position: {
      control: "select",
      options: [
        "top-left",
        "top-center",
        "top-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ],
    },
    theme: {
      control: "select",
      options: ["light", "dark", "system"],
    },
  },
  // Toasts live in one shared store, so one story's toast must not carry over.
  beforeEach: () => () => {
    toast.dismiss()
  },
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Renders the Toaster and one button that shows a toast when pressed.
 *
 * Every demo has its own toaster id, and `show` is given it to pass to `toast`.
 * Without it, the docs page, which shows all the stories at once, would show
 * each toast in every story's Toaster.
 */
function ToastDemo({
  label,
  show,
  ...toasterProps
}: ToasterProps & { label: string; show: (toasterId: string) => void }) {
  const toasterId = useId()
  return (
    <>
      <Toaster {...toasterProps} id={toasterId} />
      <Button type="button" variant="outline" onClick={() => show(toasterId)}>
        {label}
      </Button>
    </>
  )
}

/** A plain message, at the top centre by default. */
export const Default: Story = {
  render: (args) => (
    <ToastDemo {...args} label="Show toast" show={(toasterId) => toast("Job saved", { toasterId })} />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Show toast" }),
    )
    await expect(await screen.findByText("Job saved")).toBeInTheDocument()
  },
  parameters: {
    docs: {
      source: {
        code: `<Toaster />

// anywhere in the app
toast("Job saved")`,
      },
    },
  },
}

/** A success message, for something that worked. */
export const Success: Story = {
  render: (args) => (
    <ToastDemo
      {...args}
      label="Show success"
      show={(toasterId) => toast.success("Job saved", { toasterId })}
    />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Show success" }),
    )
    await expect(await screen.findByText("Job saved")).toBeInTheDocument()
  },
  parameters: {
    docs: { source: { code: `toast.success("Job saved")` } },
  },
}

/** An error message, for something that failed. */
export const ErrorMessage: Story = {
  render: (args) => (
    <ToastDemo
      {...args}
      label="Show error"
      show={(toasterId) =>
        toast.error("Could not save the job", { toasterId })
      }
    />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Show error" }),
    )
    await expect(
      await screen.findByText("Could not save the job"),
    ).toBeInTheDocument()
  },
  parameters: {
    docs: { source: { code: `toast.error("Could not save the job")` } },
  },
}

const onUndo = fn()

/** A message with a button, such as undoing what was just done. */
export const WithAction: Story = {
  render: (args) => (
    <ToastDemo
      {...args}
      label="Show with action"
      show={(toasterId) =>
        toast("Job deleted", {
          toasterId,
          action: { label: "Undo", onClick: onUndo },
        })
      }
    />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Show with action" }),
    )
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(onUndo).toHaveBeenCalledOnce())
  },
  parameters: {
    docs: {
      source: {
        code: `toast("Job deleted", {
  action: { label: "Undo", onClick: () => restoreJob() },
})`,
      },
    },
  },
}

/** Anywhere else on the screen: pass `position`. */
export const BottomRight: Story = {
  args: { position: "bottom-right" },
  render: (args) => (
    <ToastDemo {...args} label="Show toast" show={(toasterId) => toast("Job saved", { toasterId })} />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Show toast" }),
    )
    await expect(await screen.findByText("Job saved")).toBeInTheDocument()
  },
  parameters: {
    docs: { source: { code: `<Toaster position="bottom-right" />` } },
  },
}

/** One toast with its own icon: pass `icon` in the toast's options. */
export const CustomIcon: Story = {
  render: (args) => (
    <ToastDemo
      {...args}
      label="Show with icon"
      show={(toasterId) =>
        toast("Job starred", {
          toasterId,
          icon: <StarIcon data-testid="custom-icon" className="size-4" />,
        })
      }
    />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Show with icon" }),
    )
    await expect(await screen.findByText("Job starred")).toBeInTheDocument()
    await expect(await screen.findByTestId("custom-icon")).toBeInTheDocument()
  },
  parameters: {
    docs: {
      source: {
        code: `toast("Job starred", { icon: <StarIcon className="size-4" /> })`,
      },
    },
  },
}

/**
 * One toast with its own colors. Each of the three is optional. Change them in
 * the controls panel and press the button again to see the result.
 */
export const CustomColor: StoryObj<ToasterProps & ToastColors> = {
  args: {
    background: "#1f2937",
    text: "#f9fafb",
    border: "#4b5563",
  },
  argTypes: {
    background: { control: "color", description: "Background of the toast." },
    text: {
      control: "color",
      description: "Color of the message and the icon.",
    },
    border: { control: "color", description: "Color of the toast's border." },
  },
  render: ({ background, text, border, ...toasterArgs }) => (
    <ToastDemo
      {...toasterArgs}
      label="Show with color"
      show={(toasterId) =>
        toast("Job approved", {
          toasterId,
          style: toastColors({ background, text, border }),
        })
      }
    />
  ),
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Show with color" }),
    )
    const toastElement = (await screen.findByText("Job approved")).closest(
      "[data-sonner-toast]",
    )
    await expect(toastElement).toHaveAttribute(
      "style",
      expect.stringContaining(`--normal-bg: ${args.background}`),
    )
    await expect(toastElement).toHaveAttribute(
      "style",
      expect.stringContaining(`--normal-text: ${args.text}`),
    )
    await expect(toastElement).toHaveAttribute(
      "style",
      expect.stringContaining(`--normal-border: ${args.border}`),
    )
  },
  parameters: {
    docs: {
      source: {
        code: `toast("Job approved", {
  style: toastColors({
    background: "#1f2937",
    text: "#f9fafb",
    border: "#4b5563",
  }),
})`,
      },
    },
  },
}

/** Change the icon for every toast of a type. The other types keep theirs. */
export const ChangedDefaultIcon: Story = {
  args: {
    icons: { success: <HeartIcon data-testid="heart-icon" className="size-4" /> },
  },
  render: (args) => (
    <ToastDemo
      {...args}
      label="Show success and error"
      show={(toasterId) => {
        toast.success("Job saved", { toasterId })
        toast.error("Could not save the job", { toasterId })
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "Show success and error",
      }),
    )
    await expect(await screen.findByTestId("heart-icon")).toBeInTheDocument()
    // The error toast was not given an icon, so it keeps the default one.
    await waitFor(() =>
      expect(document.querySelector(".lucide-octagon-x")).toBeInTheDocument(),
    )
  },
  parameters: {
    docs: {
      source: {
        code: `<Toaster icons={{ success: <HeartIcon className="size-4" /> }} />`,
      },
    },
  },
}
