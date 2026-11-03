import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { DebouncedInput } from "@/components/debounceInput/DebouncedInput";

beforeEach(() => {
  // Testing Library waits on a zero-length timer after every action; the clock
  // has to keep ticking or that wait never ends under vitest.
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

// No delay between actions, because the fake clock would never release them.
const setupUser = () => userEvent.setup({ delay: null });

describe("DebouncedInput", () => {
  it("shows each keystroke at once but calls onValueChange only after the pause", async () => {
    const user = setupUser();
    const onValueChange = vi.fn();
    render(<DebouncedInput value="" onValueChange={onValueChange} delay={250} />);

    await user.type(screen.getByRole("textbox"), "abc");

    expect(screen.getByRole("textbox")).toHaveValue("abc");
    expect(onValueChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("abc");
  });

  it("pushes the waiting text through on blur", async () => {
    const user = setupUser();
    const onValueChange = vi.fn();
    render(<DebouncedInput value="" onValueChange={onValueChange} />);

    await user.type(screen.getByRole("textbox"), "abc");
    await user.tab();

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("abc");
  });

  it("pushes the waiting text through on a press elsewhere, even if the box keeps focus", async () => {
    const user = setupUser();
    const onValueChange = vi.fn();
    render(
      <>
        <DebouncedInput value="" onValueChange={onValueChange} />
        <button type="button">Save</button>
      </>,
    );

    await user.type(screen.getByRole("textbox"), "abc");
    // iOS Safari taps a button without blurring the input, so only the press
    // itself can be relied on.
    act(() => {
      screen
        .getByRole("button")
        .dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });

    expect(onValueChange).toHaveBeenCalledWith("abc");
  });

  it("pushes the waiting text through when it unmounts", async () => {
    const user = setupUser();
    const onValueChange = vi.fn();
    const { unmount } = render(
      <DebouncedInput value="" onValueChange={onValueChange} />,
    );

    await user.type(screen.getByRole("textbox"), "abc");
    unmount();

    expect(onValueChange).toHaveBeenCalledWith("abc");
  });

  it("does not call onValueChange when nothing was typed", async () => {
    const user = setupUser();
    const onValueChange = vi.fn();
    const { unmount } = render(
      <DebouncedInput value="saved" onValueChange={onValueChange} />,
    );

    await user.click(screen.getByRole("textbox"));
    await user.tab();
    unmount();

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("follows a change made elsewhere while it is not focused", () => {
    const { rerender } = render(
      <DebouncedInput value="old" onValueChange={vi.fn()} />,
    );

    rerender(<DebouncedInput value="new" onValueChange={vi.fn()} />);

    expect(screen.getByRole("textbox")).toHaveValue("new");
  });

  it("does not overwrite characters typed after its own write comes back", async () => {
    const user = setupUser();

    // Stands in for the store: it hands back whatever was last written.
    function Harness() {
      const [stored, setStored] = useState("");
      return <DebouncedInput value={stored} onValueChange={setStored} />;
    }
    render(<Harness />);
    const box = screen.getByRole("textbox");

    await user.type(box, "ab");
    act(() => {
      vi.advanceTimersByTime(250);
    });
    // "ab" has been written and has come back as the value; typing goes on.
    await user.type(box, "c");

    expect(box).toHaveValue("abc");
  });

  it("uses the latest onValueChange, not the one it first rendered with", async () => {
    const user = setupUser();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<DebouncedInput value="" onValueChange={first} />);

    await user.type(screen.getByRole("textbox"), "a");
    rerender(<DebouncedInput value="" onValueChange={second} />);
    await user.tab();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("a");
  });

  it("still calls the onFocus and onBlur it was given", async () => {
    const user = setupUser();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <DebouncedInput
        value=""
        onValueChange={vi.fn()}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );

    await user.click(screen.getByRole("textbox"));
    await user.tab();

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
