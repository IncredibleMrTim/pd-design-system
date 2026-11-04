import { afterEach, describe, expect, it } from "vitest"
import {
  DEAD_ZONE_PX,
  MAX_PULL_PX,
  REFRESH_THRESHOLD_PX,
  getPullDistance,
  isPastThreshold,
  shouldIgnoreTouchTarget,
} from "./pullToRefresh"

describe("getPullDistance", () => {
  it("ignores small movements so a tap or wobble never starts a pull", () => {
    expect(getPullDistance(0)).toBe(0)
    expect(getPullDistance(-40)).toBe(0)
    expect(getPullDistance(DEAD_ZONE_PX)).toBe(0)
  })

  it("moves the page less than the finger", () => {
    expect(getPullDistance(DEAD_ZONE_PX + 100)).toBe(50)
  })

  it("never pulls further than the maximum", () => {
    expect(getPullDistance(2000)).toBe(MAX_PULL_PX)
  })
})

describe("isPastThreshold", () => {
  it("only counts once the page has been pulled far enough", () => {
    expect(isPastThreshold(REFRESH_THRESHOLD_PX - 1)).toBe(false)
    expect(isPastThreshold(REFRESH_THRESHOLD_PX)).toBe(true)
  })
})

describe("shouldIgnoreTouchTarget", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  function build(html: string) {
    document.body.innerHTML = `<div id="container">${html}</div>`
    return document.getElementById("container") as HTMLElement
  }

  it("lets a touch on ordinary content start a pull", () => {
    const container = build('<p id="text">hello</p>')

    expect(shouldIgnoreTouchTarget(document.getElementById("text"), container)).toBe(false)
  })

  it("ignores touches on fields", () => {
    const container = build('<input id="field" /><textarea id="notes"></textarea><select id="pick"></select>')

    for (const id of ["field", "notes", "pick"]) {
      expect(shouldIgnoreTouchTarget(document.getElementById(id), container)).toBe(true)
    }
  })

  it("ignores touches inside an area that opts out", () => {
    const container = build('<div data-no-pull-refresh><span id="inner">x</span></div>')

    expect(shouldIgnoreTouchTarget(document.getElementById("inner"), container)).toBe(true)
  })

  it("ignores touches inside a list that is itself scrolled down", () => {
    const container = build('<div id="list" style="overflow-y:auto"><p id="row">row</p></div>')
    const list = document.getElementById("list") as HTMLElement
    Object.defineProperty(list, "scrollHeight", { value: 500, configurable: true })
    Object.defineProperty(list, "clientHeight", { value: 100, configurable: true })
    list.scrollTop = 50

    expect(shouldIgnoreTouchTarget(document.getElementById("row"), container)).toBe(true)
  })

  it("allows a pull from a nested list that is already at its top", () => {
    const container = build('<div id="list" style="overflow-y:auto"><p id="row">row</p></div>')
    const list = document.getElementById("list") as HTMLElement
    Object.defineProperty(list, "scrollHeight", { value: 500, configurable: true })
    Object.defineProperty(list, "clientHeight", { value: 100, configurable: true })
    list.scrollTop = 0

    expect(shouldIgnoreTouchTarget(document.getElementById("row"), container)).toBe(false)
  })

  it("does not look above the container", () => {
    document.body.innerHTML = '<div data-no-pull-refresh><div id="container"><p id="text">x</p></div></div>'
    const container = document.getElementById("container") as HTMLElement

    expect(shouldIgnoreTouchTarget(document.getElementById("text"), container)).toBe(false)
  })
})
