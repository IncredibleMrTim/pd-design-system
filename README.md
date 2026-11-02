# pd-design-system

A Next.js component library boilerplate using Tailwind CSS v4 and Storybook.

## Run it

- `pnpm storybook` opens Storybook on port 6006.
- `pnpm dev` runs the Next.js app.
- `pnpm exec vitest run` runs every story as a test, including the interaction checks.
- `pnpm build-storybook` builds the static Storybook.

## Layout

- `src/components/ui/` holds the shadcn parts (Radix based): button, calendar and popover. Add more with `pnpm dlx shadcn@latest add <name>`.
- `src/components/<name>/` holds one component and its stories, for example `datePicker/`. Small repeated pieces go in a plural file.
- `src/components/index.ts` is the public export list.
- `src/lib/utils.ts` re-exports `cn` from the [cn](https://www.npmjs.com/package/cn) package, shadcn's class-merging helper. It replaces `clsx` and `tailwind-merge`, so the app only needs `cn`.
- `.storybook/main.ts` registers the Tailwind Vite plugin, because Storybook runs on Vite while Next handles Tailwind itself.

## Adding a component

1. Make `src/components/<name>/<Name>.tsx`.
2. Add `<Name>.stories.tsx` with a story per state and a `play` function for behaviour.
3. Export it from `src/components/index.ts`.

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
