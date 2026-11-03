"use client";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { debounce, type IDebouncedFunction } from "@/lib/debounce";

interface DebouncedInputProps
  extends Omit<
    ComponentProps<typeof Input>,
    "type" | "value" | "defaultValue" | "onChange"
  > {
  value: string;
  onValueChange: (value: string) => void;
  /** How long typing must pause before `onValueChange` is called. */
  delay?: number;
}

/**
 * Text input that tells its owner about a change only after typing pauses.
 *
 * The typed text lives locally so every keystroke shows at once, while the
 * owner (a store that re-renders a whole form) is written to once per pause.
 * The waiting text is pushed through straight away on blur, on unmount, and on
 * the next press anywhere on the page. The press covers a Save tapped soon
 * after typing: iOS Safari does not blur a focused input when a button is
 * tapped, so blur alone could let Save read the old value.
 */
export function DebouncedInput({
  value,
  onValueChange,
  delay = 250,
  onFocus,
  onBlur,
  ...inputProps
}: DebouncedInputProps) {
  const [text, setText] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // The debounced function outlives renders, so it reads the latest callback
  // from here rather than the one it was created with.
  const onValueChangeRef = useRef(onValueChange);
  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  });

  const commitTextRef = useRef<IDebouncedFunction<[string]> | null>(null);

  useEffect(() => {
    const commitText = debounce(
      (next: string) => onValueChangeRef.current(next),
      delay,
    );
    commitTextRef.current = commitText;

    const flushWaitingText = () => commitText.flush();
    document.addEventListener("pointerdown", flushWaitingText, true);
    return () => {
      document.removeEventListener("pointerdown", flushWaitingText, true);
      commitText.flush();
      commitTextRef.current = null;
    };
  }, [delay]);

  // Follow changes made elsewhere (opening a saved job, resetting the form,
  // choosing a suggestion), but never while this box has focus: its own
  // writes come back as a changed value, and following them would overwrite
  // characters typed since.
  if (!isFocused && text !== value) {
    setText(value);
  }

  return (
    <Input
      {...inputProps}
      type="text"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        commitTextRef.current?.(e.target.value);
      }}
      onFocus={(e) => {
        setIsFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        commitTextRef.current?.flush();
        setIsFocused(false);
        onBlur?.(e);
      }}
    />
  );
}
