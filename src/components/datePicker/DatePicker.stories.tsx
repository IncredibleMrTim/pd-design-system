import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { DatePicker } from "./DatePicker";

const meta = {
  title: "Components/DatePicker",
  component: DatePicker,
  tags: ["autodocs"],
  args: { onSelect: fn() },
  argTypes: {
    date: {
      control: "date",
      description:
        "The selected date. Controlled: update it from `onSelect`. Leave empty to show the placeholder.",
      table: { type: { summary: "Date | null" }, defaultValue: { summary: "undefined" } },
    },
    onSelect: {
      description:
        "Called with the chosen day, from the calendar or from a typed date. Not called for text that is not a real date.",
      table: { type: { summary: "(date: Date) => void" } },
    },
    dateFormat: {
      control: "text",
      description:
        "How the date is shown and typed, as a date-fns format string. The placeholder is this in lower case.",
      table: { type: { summary: "string" }, defaultValue: { summary: "dd/MM/yyyy" } },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  // DatePicker is controlled, so the stories hold the date in state
  render: function Render({ date: initial, onSelect, dateFormat }) {
    const [date, setDate] = useState(initial);
    return (
      <DatePicker
        date={date}
        dateFormat={dateFormat}
        onSelect={(next) => {
          setDate(next);
          onSelect(next);
        }}
      />
    );
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No date yet, so the field shows the format as its placeholder. */
export const Empty: Story = {};

/** A date is set, so the field shows it and the calendar opens on that month. */
export const WithDate: Story = {
  args: { date: new Date(2026, 2, 15) },
};

/** The format is a date-fns string, so an app can show the date its own way. */
export const CustomFormat: Story = {
  args: { date: new Date(2026, 2, 15), dateFormat: "yyyy-MM-dd" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "Date" })).toHaveValue("2026-03-15");
  },
};

/** Opens the calendar, picks the 20th and checks the field text and `onSelect`. */
export const PicksADate: Story = {
  args: { date: new Date(2026, 2, 15) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open calendar" }));
    // The calendar opens in a portal outside the story canvas
    await userEvent.click(await screen.findByRole("button", { name: /March 20th, 2026/ }));
    await expect(args.onSelect).toHaveBeenCalledOnce();
    // The modal popover hides the page until its close animation ends
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Date" })).toHaveValue("20/03/2026"));
  },
};

/** Types a date and presses Enter. The date is read, `onSelect` is called and the field keeps it. */
export const TypesADate: Story = {
  args: { date: new Date(2026, 2, 15) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "Date" });
    await userEvent.clear(field);
    await userEvent.type(field, "20/03/2026{Enter}");
    await expect(args.onSelect).toHaveBeenCalledOnce();
    await expect(args.onSelect).toHaveBeenCalledWith(new Date(2026, 2, 20));
    await expect(field).toHaveValue("20/03/2026");
  },
};

/** Types a date that does not exist and leaves the field. Nothing is called and the last good date comes back. */
export const RevertsAnInvalidDate: Story = {
  args: { date: new Date(2026, 2, 15) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "Date" });
    await userEvent.clear(field);
    await userEvent.type(field, "31/02/2026");
    await userEvent.tab();
    await expect(args.onSelect).not.toHaveBeenCalled();
    await expect(field).toHaveValue("15/03/2026");
  },
};
