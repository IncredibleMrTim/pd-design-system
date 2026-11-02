"use client"
import { ChevronDownIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "../ui/button"
import { format } from "date-fns"
import { useState } from "react"

interface IDatePicker {
  /**
   * Called with the chosen day when the user picks one. The popover closes
   * straight afterwards. It is not called when the popover is dismissed
   * without a pick.
   */
  onSelect: (date: Date) => void
  /**
   * The selected date. The component is controlled: it never stores the
   * date itself, so update this from `onSelect` or the button text will not
   * change. Leave it empty (`undefined` or `null`) to show the placeholder.
   */
  date?: Date | null
}

/**
 * A single date picker. A button shows the chosen date (or "Pick a date")
 * and opens a calendar in a popover.
 *
 * - The button and the popover both fill the width of their container, so
 *   size it by wrapping it in an element with a width.
 * - The date is shown in the long format from date-fns, for example
 *   "March 15th, 2026".
 * - The calendar opens on the month of `date`, or on the current month when
 *   there is no date. With no date, today is highlighted as the selection.
 * - A date can be changed but not cleared, because the calendar is in
 *   required single mode.
 * - The popover is modal on purpose, so it still works inside a vaul drawer.
 */
export const DatePicker = ({ onSelect, date }: IDatePicker) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (selectedDate: Date) => {
    onSelect(selectedDate)
    setIsOpen(false)
  }

  return (
    // Modal so the calendar re-enables pointer events for itself. Inside a vaul
    // drawer the popover is portaled outside the drawer, and vaul bundles its
    // own copy of Radix's layer package, so a non-modal popover inherits the
    // drawer's pointer-events: none and its day buttons never receive clicks.
    <Popover modal open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          data-empty={!date}
          className="w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
        >
          {date ? format(date, "PPP") : <span>Pick a date</span>}
          <ChevronDownIcon data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Calendar
          classNames={{ root: "w-full" }}
          mode="single"
          required
          selected={date ?? new Date()}
          onSelect={handleSelect}
          defaultMonth={date ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}
