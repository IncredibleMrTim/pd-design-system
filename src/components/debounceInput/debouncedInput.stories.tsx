import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { FocusEventHandler, useState } from "react"
import { expect, fn, within } from "storybook/test"
import { DebouncedInput, DebouncedInputProps } from "./DebouncedInput"
import { userEvent } from "storybook/test"

const meta = {
  title: "Components/DebouncedInput",
  component: DebouncedInput,
  tags: ["autodocs"],
  args: {
    onValueChange: fn(),
  },
  argTypes: {
    value: {
      control: "text",
      description:
        "The text the owner holds. Controlled: the box shows what is typed at once, and follows this value when it changes from elsewhere.",
      table: { type: { summary: "string" } },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  // Plays the part of the owner: it holds the value, passes it down, and writes
  // back what the input reports. The args spy is called too, so stories can
  // check what was reported.
  render: function Render({
    value,
    delay,
    onBlur,
    onFocus,
    onValueChange,
    ...inputProps
  }: DebouncedInputProps) {
    // What the owner holds. The input follows it when it loses focus, so it has
    // to keep what the input reports or the typed text would be put back.
    const [text, setText] = useState(value)

    // The blur story (the only one with an `onBlur` spy) starts with no output
    // and fills it in only when the blur happens, not on the debounced change.
    const [output, setOutput] = useState(onBlur ? "" : value)

    // Passes the event on to the args spy as well, so the Actions panel and the
    // play functions can see the blur.
    const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
      setOutput(e.target.value)
      onBlur?.(e)
    }

    const handleValueChange = (value: string) => {
      setText(value)
      if (!onBlur) setOutput(value)
      onValueChange?.(value)
    }

    const handleOnFocus: FocusEventHandler<HTMLInputElement> = (e) => {
      setOutput(e.target.value)
      onFocus?.(e)
    }

    // The note follows the arg a story sets: the delay story sets `delay`, and
    // the blur story is the only one that sets an `onBlur` spy. A story that
    // sets neither gets the default delay note.

    let message = ""

    if (delay)
      message = `Text updates after a ${delay}ms delay as set in the delay prop.`
    else if (onBlur) {
      message = `The value passed back after the onBlur event is fired.`
    } else if (onFocus) {
      message = `The value passed back after the onFocus event is fired.`
    } else {
      message = `Text updates after the default 250ms delay.`
    }

    return (
      <div className="border p-4">
        <div className="mb-4">
          <DebouncedInput
            {...inputProps}
            value={text}
            delay={delay}
            onBlur={handleBlur}
            onFocus={handleOnFocus}
            onValueChange={handleValueChange}
          />
        </div>

        {message && <p className="text-sm text-gray-500 mb-1">{message}</p>}
        <p className="border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs text-gray-600 rounded">
          Output: <span className="border-b">{output}</span>
        </p>
      </div>
    )
  },
} satisfies Meta<typeof DebouncedInput>

export default meta
type Story = StoryObj<typeof meta>

export const WithInitialValue: Story = {
  args: {
    value: "PO-1001",
  },
  play: async ({ canvasElement }) => {
    const element = within(canvasElement).getByRole("textbox")
    await expect(element).toHaveValue("PO-1001")
    await userEvent.clear(element)
    await userEvent.type(element, "PO-1002")
    await userEvent.tab()
    await expect(element).toHaveValue("PO-1002")
  },
  parameters: {
    docs: {
      source: {
        code: `const [inputValue, setInputValue] = useState("PO-1001")

<DebouncedInput
  value={inputValue}
  onValueChange={setInputValue}
/>`,
      },
    },
  },
}

export const WithoutInitialValue: Story = {
  args: { value: "" },
  play: async ({ canvasElement }) => {
    const element = within(canvasElement).getByRole("textbox")
    await expect(element).toHaveValue("")
  },
  parameters: {
    docs: {
      source: {
        code: `const [inputValue, setInputValue] = useState("")

<DebouncedInput
  value={inputValue}
  onValueChange={setInputValue}
/>`,
      },
    },
  },
}

export const WithDelay: Story = {
  args: { value: "", delay: 1000 },
  play: async ({ canvasElement }) => {
    const element = within(canvasElement).getByRole("textbox")
    await userEvent.type(element, "PO-1001")
    await userEvent.tab()
    await expect(element).toHaveValue("PO-1001")
  },
  parameters: {
    docs: {
      source: {
        code: `const [inputValue, setInputValue] = useState("")

<DebouncedInput
  delay={1000}
  value={inputValue}
  onValueChange={setInputValue}
/>`,
      },
    },
  },
}

export const WithOnBlur: Story = {
  args: { value: "PO-1001", onBlur: fn() },
  play: async ({ canvasElement, args }) => {
    const element = within(canvasElement).getByRole("textbox")
    await expect(element).toHaveValue("PO-1001")
    await userEvent.click(element)
    await userEvent.clear(element)
    await userEvent.type(element, "PO-1002")
    await userEvent.tab()
    await expect(args.onBlur).toHaveBeenCalledOnce()
    await expect(element).toHaveValue("PO-1002")
    await expect(within(canvasElement).getByText("PO-1002")).toBeInTheDocument()
  },
  parameters: {
    docs: {
      source: {
        code: `const [inputValue, setInputValue] = useState("PO-1001")

<DebouncedInput
  value={inputValue}
  onValueChange={setInputValue}
  onBlur={(event) => console.log(event.target.value)}
/>`,
      },
    },
  },
}

export const WithOnFocus: Story = {
  args: { value: "PO-1001", onFocus: fn() },
  play: async ({ canvasElement, args }) => {
    const element = within(canvasElement).getByRole("textbox")
    await expect(element).toHaveValue("PO-1001")
    await expect(args.onFocus).not.toHaveBeenCalled()

    await userEvent.click(element)

    await expect(args.onFocus).toHaveBeenCalledOnce()
    await expect(element).toHaveFocus()
    // Focusing alone must not change the value or report anything.
    await expect(element).toHaveValue("PO-1001")
    await expect(within(canvasElement).getByText("PO-1001")).toBeInTheDocument()
  },
  parameters: {
    docs: {
      source: {
        code: `const [inputValue, setInputValue] = useState("PO-1001")

<DebouncedInput
  value={inputValue}
  onValueChange={setInputValue}
  onFocus={() => console.log("focused")}
/>`,
      },
    },
  },
}
