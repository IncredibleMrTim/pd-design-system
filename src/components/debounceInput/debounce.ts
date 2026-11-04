/** A debounced function, with ways to drop or force its waiting call. */
export interface IDebouncedFunction<Args extends unknown[]> {
  (...args: Args): void;
  /** Drops the waiting call, if there is one. */
  cancel: () => void;
  /** Runs the waiting call now, if there is one, instead of waiting. */
  flush: () => void;
}

/**
 * Delays `fn` until `delayMs` after the last call, running it once with the
 * latest arguments.
 *
 * `flush` exists because a delayed write must never be lost: code that is about
 * to read what the call would have written (a Save, a blur, an unmount) forces
 * it through first. `cancel` is for when the waiting value is no longer wanted.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): IDebouncedFunction<Args> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Args | null = null;

  const run = () => {
    const args = latestArgs;
    timeout = null;
    latestArgs = null;
    if (args) fn(...args);
  };

  const debounced = (...args: Args) => {
    latestArgs = args;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(run, delayMs);
  };

  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
    latestArgs = null;
  };

  debounced.flush = () => {
    if (!timeout) return;
    clearTimeout(timeout);
    run();
  };

  return debounced;
}
