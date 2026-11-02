# pd-design-system

A component library for Process Dynamics, built with Next.js, Tailwind CSS v4 and Storybook. Components are built on [shadcn](https://ui.shadcn.com) (Radix base). Storybook is both the documentation and the test suite.

## Install

The library is published on npm as `@processdynamics/components`.

```bash
pnpm add @processdynamics/components
```

Install the peer dependencies too (see [What the using app must install](#what-the-using-app-must-install)), then add two lines to your global CSS, after Tailwind:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "@processdynamics/components/styles.css";
```

`styles.css` carries the shadcn theme colours, the dark mode variant, and the Tailwind source line that makes Tailwind scan the package's classes. Then import components by name:

```tsx
import { DatePicker } from "@processdynamics/components";
```

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
- `pnpm build` builds Storybook into `public/storybook` first and then the Next app, so the deployed site serves Storybook at `/storybook/index.html`. Don't commit `public/storybook`, it is generated.
- `pnpm exec vitest run` runs every story as a test, including the `play` interaction checks.
- `pnpm exec tsc --noEmit` runs the type check.
- `pnpm lint` runs ESLint.
- `pnpm dev` runs the Next host app.
- `pnpm build:lib` builds the package into `dist/` (ESM, CommonJS, types and `styles.css`).

The story tests don't check styling. For visual changes, open the story in a browser as well.

## Components

### DatePicker

A single date picker. A text field takes a typed date, and a calendar button beside it opens a calendar in a popover. Both change the same date.

```tsx
"use client";

import { useState } from "react";
import { DatePicker } from "@processdynamics/components";

export function Example() {
  const [date, setDate] = useState<Date | null>(null);
  return <DatePicker date={date} onSelect={setDate} />;
}
```

| Prop | Type | Description |
| --- | --- | --- |
| `date` | `Date \| null` | The selected date. Optional. The component is controlled, so update it from `onSelect` or the date won't change. |
| `onSelect` | `(date: Date) => void` | Required. Called with the chosen day, from the calendar or from a typed date. |
| `dateFormat` | `string` | A date-fns format string for showing and typing the date. Optional, defaults to `dd/MM/yyyy`. The placeholder is this in lower case. |

Behaviour to know about:

- The field and the calendar button fill the width of their container, so size it with a wrapper.
- A typed date is read when the user presses Enter or leaves the field. Text that is not a real date, or a year under 1000 such as `2/11/26`, is ignored and the field goes back to the last good date. Enter doesn't submit a surrounding form.
- Picking a day in the calendar fills the field and closes the popover.
- The calendar opens on the month of `date`, or the current month when there is none. With no date, today is highlighted as the selection while the field stays empty.
- A date can be changed but not cleared. Emptying the field puts the last date back.
- The field's accessible name is "Date" and the button's is "Open calendar". With two pickers on one page, wrap each in a labelled group.
- The popover is modal on purpose, so it works inside a vaul drawer.

The full docs page, with live controls and stories, is in Storybook under Components, then DatePicker.

### JobCard

A card for one job: a title, and optionally a stage, subtitle, detail lines, description, callouts, badge, pills and a banner. It only displays what it is given, so it has no idea what a job is in any particular app. The using app turns its own job into a `JobCardData` and decides every word, colour and date format, which is what lets one card serve different projects.

```tsx
import { Flag } from "lucide-react";
import { JobCard, type JobCardData } from "@processdynamics/components";

const job: JobCardData = {
  title: "PO-1001",
  subtitle: "Acme Co",
  tone: "warning",
  stage: { label: "In progress", color: "#d97706" },
  details: ["Created: 29 Oct 2026"],
  badge: { label: "Gold", color: "yellow" },
  pills: [
    { label: "Flagged", tone: "warning", icon: <Flag />, priority: true },
    { label: "Internal", tone: "blue" },
  ],
};

<JobCard
  job={job}
  onClick={() => openJob()}
  action={{ label: "Send back", onClick: sendBack }}
/>;
```

Write one small function in the app that maps its job (and anything derived from it, such as an age or a stage) to `JobCardData`. Keep the app's rules there: the card never imports the app's types, helpers or data hooks.

A worked example of that function is in `src/adapters/jobCard/exampleOrder/`, with stories under Adapters, then Job card, then Example order, in Storybook. It uses a made-up order type, and covers an age rule that stops the clock, stage colours, priority pills, formatted dates, a banner that pluralises, and a restricted "summary" view made just by leaving fields out. Copy the pattern, not the file. It isn't part of the published package, and each app keeps its own adapter next to its own types and helpers.

| Prop | Type | Description |
| --- | --- | --- |
| `job` | `JobCardData` | Required. What to show, already decided. |
| `onClick` | `() => void` | Called when the card is clicked. Without it the card isn't clickable. |
| `action` | `{ label, onClick, disabled? }` | A full width button at the bottom. Clicking it doesn't also call `onClick`. |
| `leadingContent` | `ReactNode` | Content before the title, for example a checkbox. |
| `expandedContent` | `ReactNode` | Extra content at the very bottom. |
| `className` | `string` | Extra classes for the card. |

The fields of `JobCardData`, all optional except `title`:

| Field | Description |
| --- | --- |
| `title` | The heading, for example a PO number. |
| `subtitle` | A line under the heading. |
| `stage` | `{ label, color? }`: shown top right beside a dot in any CSS colour. |
| `tone` | The card colour: `success` (green), `warning` (orange), `danger` (red) or `neutral` (grey, the default). |
| `details` | Short grey lines, one per entry. |
| `description` | Shown in italics. |
| `callouts` | Bordered boxes of text, one per entry. |
| `badge` | `{ label, color }`: a colour block beside the pills. |
| `pills` | `{ label, tone, icon?, priority? }[]`. Labels must be unique. |
| `banner` | `{ label, icon? }`: a pale blue notice bar across the bottom. |

Behaviour to know about:

- Leave a field out and its part of the card disappears.
- Pills marked `priority` lead, and a rule splits them from the others. With only priority pills there is no rule.
- Pill tones are `critical`, `warning`, `danger`, the soft tints `red`, `orange`, `green`, `blue` and `purple`, and the outlines `outline` and `dashed`. An icon can be any small svg, such as a lucide icon.
- The colour comes from `tone` only. The card colours and pill tints are fixed palette colours, because the shadcn theme has no success or warning colours to map them to.

The full docs page, with every prop and a story for each part, is in Storybook under Components, then JobCard.

## Project layout

```
.storybook/         Storybook config (main.ts registers the Tailwind Vite plugin)
src/
  app/              Next host app and globals.css (theme tokens)
  adapters/
    jobCard/        adapters for the JobCard, one folder each (not published)
      exampleOrder/ a neutral example of turning an app's job into JobCardData
  components/
    <name>/         one folder per component: Component.tsx and its stories
    ui/             shadcn parts: button, calendar, popover
    index.ts        public exports
  lib/
    utils.ts        re-exports cn
  styles/
    theme.css       theme tokens and variants, shipped as styles.css
scripts/            buildStyles.mjs writes dist/styles.css
tsup.config.ts      library build config
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

The app also needs Tailwind v4 and `tw-animate-css` (for the popover animation). The theme colours and the Tailwind source line come from `@processdynamics/components/styles.css`, as shown in [Install](#install).

## Publishing

The package is public on npm under the `processdynamics` organisation. Every merge to `main` publishes a new version automatically.

### How it works

- **When you commit**, a pre-commit hook (Husky, installed by `pnpm install`) runs `pnpm version:sync`. It asks npm for the latest version and, if `package.json` isn't already ahead, sets it to that plus one patch and stages the change. It never blocks a commit: if npm is unreachable or the package isn't published yet, it just skips.
- **On every pull request**, the Release workflow runs `pnpm version:check`, which fails if `package.json` isn't ahead of npm. It's the safety net for a skipped hook, or for another P R that merged first and took your number. If it fails, run `pnpm version:sync`, commit, and push.
- **On every merge to `main`**, the workflow runs the checks, publishes to npm and tags the release (`v0.1.5`). It uses npm trusted publishing, so no npm token is stored anywhere. It never commits to `main`, because `main` is protected.
- **For a minor or major release**, set the version yourself in `package.json` (for example `0.2.0`) in the P R. A version already ahead of npm is kept as it is.

If two P Rs merge close together and the second carries a number that's already taken, the workflow publishes npm's latest plus one instead and tags that. `package.json` on `main` is then one behind until the next P R's hook corrects it.

### One-off setup

1. Publish the first version by hand (see below), because the trusted publisher can only be added to a package that exists.
2. On npmjs.com, open the package, then Settings, then Trusted Publisher, and add GitHub Actions with owner `IncredibleMrTim`, repository `pd-design-system` and workflow filename `release.yml`. All three are case-sensitive.

### If a publish fails

The Release workflow only tags a release after the publish succeeds, so a failed publish leaves no tag and nothing on npm. Look at the failed run's "Publish to npm" step:

- **`E403 ... OIDC permission denied for this action`**: npm didn't accept the trusted publisher settings for this workflow. Open the package on npmjs.com, then Settings, then Trusted Publisher, and check the owner (`IncredibleMrTim`), repository (`pd-design-system`) and workflow filename (`release.yml`, with the extension). They're case-sensitive, and if there's an allowed actions option, `npm publish` must be ticked.
- **`TLOG_CREATE_ENTRY_ERROR ... (409) an equivalent entry already exists`**: the repo is public, so npm records signed provenance for each publish in a public transparency log. Once an attempt has logged an entry, re-running the same run is refused. Don't re-run it. A new commit on `main`, meaning a new merged P R, makes a fresh run and publishes normally. Each failed attempt adds a permanent public log entry, so fix the cause before trying again.

If `package.json` is already ahead of npm when a merge happens, the workflow publishes that version as it is, so a retry after a failure publishes the same number.

### Publishing by hand

This is only needed for the first release. Commit and merge first, then:

1. Switch to `main` with a clean, up-to-date checkout.
2. Log in with `npm login` (two-factor authentication is on).
3. Run `pnpm release:dry` to rehearse. It runs the type check, lint and story tests, confirms you're logged in to npm, then does a publish dry run that uploads nothing. It works from any branch.
4. Run `pnpm release`. It first stops unless you're on `main` with a clean working tree that matches `origin/main`. Then it runs the same checks as the rehearsal and `pnpm publish`, which asks for your two-factor code. Publishing builds the package first through `prepublishOnly`, and `publishConfig` already sets public access.

To check what would ship without publishing, run `pnpm pack` and read the file list. Only `dist/`, `package.json`, this README and the licence go in.

Because of how it's built, every component is bundled into one client bundle with a `"use client"` banner, and the `@/` alias used inside the source is resolved at build time.
