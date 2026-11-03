"use client"
import type { ComponentProps, CSSProperties } from "react"
import { toast } from "sonner"
import { Toaster as BaseToaster } from "@/components/ui/sonner"

type SonnerToasterProps = ComponentProps<typeof BaseToaster>

/**
 * Props for `Toaster`. Any other Sonner toaster prop (`duration`, `richColors`,
 * `closeButton` and so on) is passed straight through.
 */
export interface ToasterProps extends SonnerToasterProps {
  /**
   * Where on the screen toasts appear: a vertical edge and a horizontal place,
   * such as `"top-center"` or `"bottom-right"`. Default `"top-center"`.
   */
  position?: SonnerToasterProps["position"]
  /**
   * `"light"`, `"dark"` or `"system"`. It is not read from the app, so pass it
   * if toasts should follow a theme. Default is Sonner's own (light).
   */
  theme?: SonnerToasterProps["theme"]
  /**
   * Replaces the icon for a type of toast: `success`, `info`, `warning`,
   * `error`, `loading` or `close`. Optional, and only the types given change,
   * the others keep their default icon. A single toast can also set its own
   * with `toast("Saved", { icon: <StarIcon /> })`.
   */
  icons?: SonnerToasterProps["icons"]
}

/**
 * Colors for one toast. Every field is optional, and one left out keeps the
 * theme's color. Each is any CSS color, or a theme variable such as
 * `var(--primary)`.
 */
export interface ToastColors {
  /** Background of the toast. */
  background?: string
  /** Color of the message and the icon. */
  text?: string
  /** Color of the toast's border. */
  border?: string
}

/**
 * Turns colors into the `style` of a single toast:
 * `toast("Saved", { style: toastColors({ background: "var(--primary)" }) })`.
 *
 * It sets the toast's own color variables, which is why the color names are
 * not needed by the caller. With the `richColors` prop on, the success, error,
 * warning and info toasts use their own colors instead, and these are ignored.
 */
export function toastColors({
  background,
  text,
  border,
}: ToastColors): CSSProperties {
  return {
    ...(background && { "--normal-bg": background }),
    ...(text && { "--normal-text": text }),
    ...(border && { "--normal-border": border }),
  } as CSSProperties
}

/**
 * Where toasts appear and how they look. Mount it once near the root of the
 * app, then show a toast from anywhere by calling `toast`.
 *
 * `position` defaults to `"top-center"`. The theme is not read from the app:
 * pass `theme` (`"light"`, `"dark"` or `"system"`) if it should follow one.
 */
export function Toaster({ position = "top-center", ...props }: ToasterProps) {
  return <BaseToaster position={position} {...props} />
}

/**
 * Shows a toast. It is Sonner's `toast` function, re-exported so an app does
 * not need to import `sonner` itself: `toast("Saved")`, `toast.success(...)`,
 * `toast.error(...)`, or `toast("Deleted", { action: { label, onClick } })`.
 */
export { toast }
