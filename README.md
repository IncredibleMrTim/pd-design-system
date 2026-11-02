# pd-design-system

A component library for Process Dynamics, built with Next.js, Tailwind CSS v4 and Storybook. Components are built on [shadcn](https://ui.shadcn.com) (Radix base). Storybook is both the documentation and the test suite.

## Stack

- Next.js 16 (App Router) and React 19. The Next app is only a host for the components.
- Tailwind CSS v4, with the theme in `src/app/globals.css`.
- shadcn on the Radix base, with the `cn` package for class merging.
- Storybook 10 for docs and stories, with the Vitest addon running every story as a test in a real browser.
- pnpm, pinned in `package.json`. Use pnpm, not npm.

## Getting started

```bash
pnpm install
pnpm exec playwright install chromium   # one-off, for the story tests
pnpm storybook                          # http://localhost:6006
```

## Commands

- `pnpm storybook` runs Storybook on port 6006.
- `pnpm build-storybook` builds the static Storybook.
- `pnpm exec vitest run` runs every story as a test, including the `play` interaction checks.
- `pnpm exec tsc --noEmit` runs the type check.
- `pnpm lint` runs ESLint.
- `pnpm dev` runs the Next host app.

The story tests don't check styling. For visual changes, open the story in a browser as well.

## Components

### DatePicker

A single date picker. A button shows the chosen date, or "Pick a date", and opens a calendar in a popover.

```tsx
"use client";

import { useState } from "react";
import { DatePicker } from "@/components";

export function Example() {
  const [date, setDate] = useState<Date | null>(null);
  return <DatePicker date={date} onSelect={setDate} />;
}
```

| Prop | Type | Description |
| --- | --- | --- |
| `date` | `Date \| null` | The selected date. Optional. The component is controlled, so update it from `onSelect` or the button won't change. |
| `onSelect` | `(date: Date) => void` | Required. Called with the chosen day, and the popover closes straight after. |

Behaviour to know about:

- The button and popover fill the width of their container, so size it with a wrapper.
- The date shows in long format, for example "March 15th, 2026".
- The calendar opens on the month of `date`, or the current month when there is none. With no date, today is highlighted as the selection while the button still says "Pick a date".
- A date can be changed but not cleared.
- The popover is modal on purpose, so it works inside a vaul drawer.

The full docs page, with live controls and stories, is in Storybook under Components, then DatePicker.

## Project layout

```
.storybook/         Storybook config (main.ts registers the Tailwind Vite plugin)
src/
  app/              Next host app and globals.css (theme tokens)
  components/
    <name>/         one folder per component: Component.tsx and its stories
    ui/             shadcn parts: button, calendar, popover
    index.ts        public exports
  lib/
    utils.ts        re-exports cn
components.json     shadcn config
```

- Storybook runs on Vite while Next handles Tailwind itself, so `.storybook/main.ts` adds the Tailwind Vite plugin. Without it every story renders unstyled.
- `src/lib/utils.ts` re-exports `cn` from the [cn](https://www.npmjs.com/package/cn) package, shadcn's class-merging helper. It replaces `clsx` and `tailwind-merge`.

## Adding a component

1. Make `src/components/<name>/<Name>.tsx`. Use shadcn parts from `src/components/ui/` where you can.
2. Add JSDoc to the component and every prop. Storybook's docs page reads it.
3. Add `<Name>.stories.tsx` with `tags: ["autodocs"]`, a story for each state, and a `play` function for behaviour.
4. Export it from `src/components/index.ts`.

Add shadcn parts with `pnpm dlx shadcn@latest add <name>`. After running shadcn, check two things: `components.json` and the new files still use the Radix base (the default, Base UI, has no `asChild`), and `src/lib/utils.ts` is still `export { cn } from "cn"`.

See `CLAUDE.md` for the full coding and Git conventions.

## What the using app must install

The packages the components import are declared as `peerDependencies` in `package.json`, so the app that uses them installs and owns them:

- `react` and `react-dom`
- `react-day-picker` and `date-fns` for the date picker
- `radix-ui` for the popover
- `lucide-react` for icons
- `class-variance-authority` for button variants
- `cn` for class merging

They are also dev dependencies here so Storybook and the tests can run.

The app also needs Tailwind v4 set to scan these component files, the shadcn theme colours in its global styles, and `tw-animate-css` imported there for the popover animation.

## Status

The project is not yet published as a package. There is no build step or export map, so apps can't install it yet.
