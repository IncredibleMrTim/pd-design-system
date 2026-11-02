"use client"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format, isSameDay, isValid, parse } from "date-fns"
import { useState } from "react"

const DEFAULT_DATE_FORMAT = "dd/MM/yyyy"

// A year below 1000 is nearly always a half-typed one ("2/11/26"), not a real
// date, and date-fns would happily read it as the year 26.
const MIN_TYPED_YEAR = 1000

interface IDatePicker {
  /**
   * Called with the chosen day when the user picks one in the calendar, or
   * types a real date and presses Enter or leaves the field. It is not called
   * when the popover is dismissed without a pick, or for text that is not a
   * real date.
   */
  onSelect: (date: Date) => void
  /**
   * The selected date. The component is controlled: it never decides the date
   * itself, so update this from `onSelect` or the date will not change. Leave
   * it empty (`undefined` or `null`) to show the placeholder.
   */
  date?: Date | null
  /**
   * How the date is shown and typed, as a date-fns format string. Defaults to
   * `dd/MM/yyyy`. The placeholder is this in lower case.
   */
  dateFormat?: string
}

/** Turns typed text into a date, or null when it is not a real date. */
const parseTypedDate = (text: string, dateFormat: string): Date | null => {
  const parsed = parse(text.trim(), dateFormat, new Date())
  if (!isValid(parsed) || parsed.getFullYear() < MIN_TYPED_YEAR) return null
  return parsed
}

const formatDate = (date: Date | null | undefined, dateFormat: string) =>
  date ? format(date, dateFormat) : ""

/**
 * A single date picker. A text field takes a typed date, and a calendar button
 * beside it opens a calendar in a popover. Both change the same date.
 *
 * - The field and the button fill the width of their container, so size it by
 *   wrapping it in an element with a width.
 * - The date is shown as `dd/MM/yyyy` unless `dateFormat` says otherwise.
 * - A typed date is read when the user presses Enter or leaves the field. If it
 *   is not a real date, the field goes back to the last good date.
 * - The calendar opens on the month of `date`, or on the current month when
 *   there is no date. With no date, today is highlighted as the selection.
 * - A date can be changed but not cleared, because the calendar is in
 *   required single mode and an emptied field goes back to the last date.
 * - The popover is modal on purpose, so it still works inside a vaul drawer.
 */
export const DatePicker = ({
  onSelect,
  date,
  dateFormat = DEFAULT_DATE_FORMAT,
}: IDatePicker) => {
  const [isOpen, setIsOpen] = useState(false)
  const [typedText, setTypedText] = useState(formatDate(date, dateFormat))
  const [shownDate, setShownDate] = useState(date)

  // The app owns the date, so when it changes from outside (a pick, a reset),
  // the text follows. React runs this straight away instead of after a paint.
  if (date?.getTime() !== shownDate?.getTime()) {
    setShownDate(date)
    setTypedText(formatDate(date, dateFormat))
  }

  const handleCalendarSelect = (selectedDate: Date) => {
    setTypedText(formatDate(selectedDate, dateFormat))
    onSelect(selectedDate)
    setIsOpen(false)
  }

  const commitTypedText = () => {
    const parsedDate = parseTypedDate(typedText, dateFormat)
    if (!parsedDate) {
      setTypedText(formatDate(date, dateFormat))
      return
    }
    setTypedText(formatDate(parsedDate, dateFormat))
    if (!date || !isSameDay(parsedDate, date)) onSelect(parsedDate)
  }

  return (
    // Modal so the calendar re-enables pointer events for itself. Inside a vaul
    // drawer the popover is portaled outside the drawer, and vaul bundles its
    // own copy of Radix's layer package, so a non-modal popover inherits the
    // drawer's pointer-events: none and its day buttons never receive clicks.
    <Popover modal open={isOpen} onOpenChange={setIsOpen}>
      {/* The popover lines up with the whole row, not just the button. */}
      <PopoverAnchor asChild>
        <div className="flex w-full gap-2">
          <Input
            value={typedText}
            onChange={(event) => setTypedText(event.target.value)}
            onBlur={commitTypedText}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return
              // Inside a form, Enter should read the date, not submit the form.
              event.preventDefault()
              commitTypedText()
            }}
            placeholder={dateFormat.toLowerCase()}
            autoComplete="off"
            aria-label="Date"
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Open calendar"
            >
              <CalendarIcon />
            </Button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          required
          selected={date ?? new Date()}
          onSelect={handleCalendarSelect}
          defaultMonth={date ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}
