import { cn } from "@/lib/utils"
import type { DocumentScannerStatus } from "./DocumentScanner"

interface DocumentScannerResultProps {
  /** Whether the scan worked or failed. */
  status: Exclude<DocumentScannerStatus, "idle">
  /** The lines to show. The first is the headline and the rest are detail. */
  messages: string[]
}

/**
 * The outcome of a scan. A failure is announced as an alert so a screen reader
 * reads it out at once. A success is announced politely, without interrupting.
 */
export function DocumentScannerResult({
  status,
  messages,
}: DocumentScannerResultProps) {
  const isError = status === "error"

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-3 text-sm",
        isError
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-primary/30 bg-primary/10 text-foreground",
      )}
    >
      {messages.map((message, index) => (
        <p key={index} className={index === 0 ? "mb-1 font-semibold" : undefined}>
          {message}
        </p>
      ))}
    </div>
  )
}
