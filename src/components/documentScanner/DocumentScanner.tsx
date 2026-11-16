"use client"
import { useRef, type ChangeEvent } from "react"
import { CameraIcon, ScanLineIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DocumentScannerPages } from "./DocumentScannerPages"
import { DocumentScannerResult } from "./DocumentScannerResult"

/** Whether the last scan has not run yet, worked, or failed. */
export type DocumentScannerStatus = "idle" | "success" | "error"

/** One staged page of the document. */
export interface DocumentScannerPage {
  /** A stable id for the page, passed back to `onRemovePage`. */
  id: string
  /** The image address to show. A local preview address works. */
  src: string
  /** Text for screen readers. Defaults to "Page" and its number. */
  alt?: string
}

/** Every piece of text the component shows, so an app can reword or translate it. */
export interface DocumentScannerLabels {
  /** The heading above the scanner. */
  title: string
  /** The line next to the heading saying what a scan does. */
  hint: string
  /** The main text of the empty state's photo button. */
  emptyPrompt: string
  /** The smaller line under the empty state's prompt. */
  emptyHint: string
  /** The button that adds another page. */
  addPage: string
  /** The scan button before any scan has run. */
  scan: string
  /** The scan button once a scan has run. */
  rescan: string
  /** The scan button while a scan is running. */
  scanning: string
  /** The start of each remove button's name. The page number follows it. */
  removePage: string
  /** Builds the "Page 1 of 3" badge on each page. */
  pageCount: (pageNumber: number, pageTotal: number) => string
}

const DEFAULT_LABELS: DocumentScannerLabels = {
  title: "Scan document",
  hint: "Photograph the pages, then scan",
  emptyPrompt: "Tap to photograph the document",
  emptyHint: "Add several pages one at a time",
  addPage: "Add page",
  scan: "Scan",
  rescan: "Rescan",
  scanning: "Scanning...",
  removePage: "Remove page",
  pageCount: (pageNumber, pageTotal) => `Page ${pageNumber} of ${pageTotal}`,
}

export interface DocumentScannerProps {
  /**
   * The pages staged so far, in order. Controlled: the component only shows
   * them, so add and remove them from `onAddFiles` and `onRemovePage`, or
   * nothing will change on screen.
   */
  pages: DocumentScannerPage[]
  /**
   * True while a scan is running. The scan, add and remove buttons are
   * disabled and the scan button says "Scanning...". Defaults to false.
   */
  isScanning?: boolean
  /**
   * How the last scan went. Defaults to "idle", which shows no result and
   * labels the scan button "Scan". "success" and "error" show the result
   * panel (when there are messages) and label the button "Rescan".
   */
  status?: DocumentScannerStatus
  /**
   * The lines to show in the result panel. The first is the headline and the
   * rest are detail. The panel is hidden when this is empty or the status is
   * "idle". Defaults to none.
   */
  messages?: string[]
  /**
   * Called with the images the person chose, from the camera or the file
   * picker. The component does not read, resize or upload them: do that here
   * and add the result to `pages`. Never called with an empty list.
   */
  onAddFiles: (files: File[]) => void
  /** Called with the id of the page whose remove button was pressed. */
  onRemovePage: (pageId: string) => void
  /**
   * Called when the scan button is pressed. What a scan does is up to the app:
   * the component makes no network call and holds no keys. Set `isScanning`
   * while it runs and `status` and `messages` when it finishes.
   */
  onScan: () => void
  /** Reword any text. Anything left out keeps its default. */
  labels?: Partial<DocumentScannerLabels>
  /**
   * The kinds of file the picker offers. Defaults to "image/*".
   */
  accept?: string
  /**
   * Which camera a phone opens straight away: "environment" is the rear one.
   * Defaults to "environment". Pass `false` for the normal file picker, which
   * also lets the person choose a saved photo. Desktop browsers ignore it.
   */
  capture?: "environment" | "user" | false
  /** Disables every control, for when the form around it is locked. Defaults to false. */
  isDisabled?: boolean
  /** Extra classes for the outer element. */
  className?: string
}

/**
 * Stages photos of a document and asks the app to scan them.
 *
 * It is a screen part only. It keeps no state of its own about the pages or
 * the scan, makes no network calls and holds no keys, so the app decides how
 * images are stored and what does the reading. That also keeps it safe to use
 * in the browser: anything passed to it ends up in the page.
 */
export function DocumentScanner({
  pages,
  isScanning = false,
  status = "idle",
  messages = [],
  onAddFiles,
  onRemovePage,
  onScan,
  labels,
  accept = "image/*",
  capture = "environment",
  isDisabled = false,
  className,
}: DocumentScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const text = { ...DEFAULT_LABELS, ...labels }

  const isLocked = isScanning || isDisabled
  const hasPages = pages.length > 0
  const shouldShowResult = status !== "idle" && messages.length > 0

  const openFilePicker = () => fileInputRef.current?.click()

  const handleFilesChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const chosenFiles = Array.from(event.target.files ?? [])
    // Cleared so choosing the same photo again still counts as a change.
    event.target.value = ""
    if (chosenFiles.length > 0) onAddFiles(chosenFiles)
  }

  const scanLabel = isScanning
    ? text.scanning
    : status === "idle"
      ? text.scan
      : text.rescan

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {text.title}
        {" — "}
        <span className="font-normal normal-case">{text.hint}</span>
      </p>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        capture={capture}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        data-slot="document-scanner-input"
        onChange={handleFilesChosen}
      />

      {hasPages ? (
        <>
          <DocumentScannerPages
            pages={pages}
            isLocked={isLocked}
            removeLabel={text.removePage}
            formatPageCount={text.pageCount}
            onRemovePage={onRemovePage}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 border-dashed"
              disabled={isLocked}
              onClick={openFilePicker}
            >
              <CameraIcon />
              {text.addPage}
            </Button>
            <Button
              type="button"
              className="h-10 flex-1"
              disabled={isLocked}
              onClick={onScan}
            >
              <ScanLineIcon />
              {scanLabel}
            </Button>
          </div>

          {shouldShowResult && (
            <DocumentScannerResult status={status} messages={messages} />
          )}
        </>
      ) : (
        <button
          type="button"
          disabled={isLocked}
          onClick={openFilePicker}
          className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 py-8 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        >
          <CameraIcon className="size-8" />
          <span className="font-medium text-foreground">{text.emptyPrompt}</span>
          <span className="text-xs">{text.emptyHint}</span>
        </button>
      )}
    </div>
  )
}
