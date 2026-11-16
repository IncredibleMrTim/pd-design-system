"use client"
import { XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DocumentScannerPage } from "./DocumentScanner"

interface DocumentScannerPagesProps {
  /** The staged pages, in order. */
  pages: DocumentScannerPage[]
  /** True while a scan is running, which stops pages being removed. */
  isLocked: boolean
  /** Label for the remove button, which the page number is added to. */
  removeLabel: string
  /** Builds the "Page 1 of 3" text for a page. */
  formatPageCount: (pageNumber: number, pageTotal: number) => string
  /** Called with the id of the page whose remove button was pressed. */
  onRemovePage: (pageId: string) => void
}

/**
 * The staged pages as a strip that snaps one page at a time. A strip you swipe
 * (or scroll) is used instead of a carousel so the library needs no extra
 * package for it.
 */
export function DocumentScannerPages({
  pages,
  isLocked,
  removeLabel,
  formatPageCount,
  onRemovePage,
}: DocumentScannerPagesProps) {
  return (
    <ul className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto">
      {pages.map((page, index) => (
        <li
          key={page.id}
          className="relative w-full shrink-0 snap-center overflow-hidden rounded-lg border-2 border-dashed border-border"
        >
          {/* A plain image: the address may be a local preview, which the
              Next image component cannot optimise. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.src}
            alt={page.alt ?? `Page ${index + 1}`}
            className="w-full"
            loading="lazy"
          />
          <span className="absolute top-3 left-3 rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
            {formatPageCount(index + 1, pages.length)}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute top-3 right-3 rounded-full shadow-sm"
            aria-label={`${removeLabel} ${index + 1}`}
            disabled={isLocked}
            onClick={() => onRemovePage(page.id)}
          >
            <XIcon />
          </Button>
        </li>
      ))}
    </ul>
  )
}
