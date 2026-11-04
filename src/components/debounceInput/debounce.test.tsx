import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce } from "./debounce";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("debounce", () => {
  it("does not run until the delay has passed", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced("a");
    vi.advanceTimersByTime(249);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledWith("a");
  });

  it("runs once with the latest arguments after a burst of calls", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced("a");
    vi.advanceTimersByTime(100);
    debounced("ab");
    vi.advanceTimersByTime(100);
    debounced("abc");
    vi.advanceTimersByTime(250);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("abc");
  });

  it("restarts the wait on every call", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced("a");
    vi.advanceTimersByTime(200);
    debounced("ab");
    vi.advanceTimersByTime(200);

    expect(fn).not.toHaveBeenCalled();
  });

  it("flush runs the waiting call straight away, once", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced("a");
    debounced.flush();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");

    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("flush does nothing when no call is waiting", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced.flush();
    expect(fn).not.toHaveBeenCalled();

    debounced("a");
    vi.advanceTimersByTime(250);
    debounced.flush();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cancel drops the waiting call", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced("a");
    debounced.cancel();
    vi.advanceTimersByTime(1000);
    debounced.flush();

    expect(fn).not.toHaveBeenCalled();
  });

  it("can be used again after it has run", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced("a");
    vi.advanceTimersByTime(250);
    debounced("b");
    vi.advanceTimersByTime(250);

    expect(fn).toHaveBeenNthCalledWith(1, "a");
    expect(fn).toHaveBeenNthCalledWith(2, "b");
  });
});
