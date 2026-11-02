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
      description: "Called with the chosen day. The popover closes straight after.",
      table: { type: { summary: "(date: Date) => void" } },
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
  render: function Render({ date: initial, onSelect }) {
    const [date, setDate] = useState(initial);
    return (
      <DatePicker
        date={date}
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

/** No date yet, so the button shows the "Pick a date" placeholder. */
export const Empty: Story = {};

/** A date is set, so the button shows it in long format and the calendar opens on that month. */
export const WithDate: Story = {
  args: { date: new Date(2026, 2, 15) },
};

/** Opens the calendar, picks the 20th and checks the button text and `onSelect`. */
export const PicksADate: Story = {
  args: { date: new Date(2026, 2, 15) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /March 15th, 2026/ }));
    // The calendar opens in a portal outside the story canvas
    await userEvent.click(await screen.findByRole("button", { name: /March 20th, 2026/ }));
    await expect(args.onSelect).toHaveBeenCalledOnce();
    // The modal popover hides the page until its close animation ends
    await waitFor(() => expect(canvas.getByRole("button", { name: /March 20th, 2026/ })).toBeVisible());
  },
};
