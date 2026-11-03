import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test"
import { Button } from "@/components/ui/button"
import { HeartIcon, StarIcon } from "lucide-react"
import { Toaster, toast, toastColors, type ToasterProps } from "./Toaster"

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
  parameters: {
    // Each story mounts its own Toaster. Inline on the docs page they would all
    // show every toast, so the docs page renders each one in its own frame.
    docs: { story: { inline: false, iframeHeight: 220 } },
  },
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

/** Renders the Toaster and one button that shows a toast when pressed. */
function ToastDemo({
  label,
  show,
  ...toasterProps
}: ToasterProps & { label: string; show: () => void }) {
  return (
    <>
      <Toaster {...toasterProps} />
      <Button type="button" variant="outline" onClick={show}>
        {label}
      </Button>
    </>
  )
}

/** A plain message, at the top centre by default. */
export const Default: Story = {
  render: (args) => (
    <ToastDemo {...args} label="Show toast" show={() => toast("Job saved")} />
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
      show={() => toast.success("Job saved")}
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
      show={() => toast.error("Could not save the job")}
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
      show={() =>
        toast("Job deleted", { action: { label: "Undo", onClick: onUndo } })
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
    <ToastDemo {...args} label="Show toast" show={() => toast("Job saved")} />
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
      show={() =>
        toast("Job starred", {
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

/** One toast with its own colors. Each of the three is optional. */
export const CustomColor: Story = {
  render: (args) => (
    <ToastDemo
      {...args}
      label="Show with color"
      show={() =>
        toast("Job approved", {
          style: toastColors({
            background: "var(--primary)",
            text: "var(--primary-foreground)",
          }),
        })
      }
    />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Show with color" }),
    )
    const toastElement = (await screen.findByText("Job approved")).closest(
      "[data-sonner-toast]",
    )
    await expect(toastElement).toHaveAttribute(
      "style",
      expect.stringContaining("--normal-bg: var(--primary)"),
    )
    await expect(toastElement).toHaveAttribute(
      "style",
      expect.stringContaining("--normal-text: var(--primary-foreground)"),
    )
  },
  parameters: {
    docs: {
      source: {
        code: `toast("Job approved", {
  style: toastColors({
    background: "var(--primary)",
    text: "var(--primary-foreground)",
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
      show={() => {
        toast.success("Job saved")
        toast.error("Could not save the job")
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
