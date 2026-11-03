# Claude Code Guidelines for pd-design-system

## Project Overview

A component library for Process Dynamics (Town Square Digital), built with Next.js 16 (App Router), React 19, Tailwind CSS v4 and Storybook 10. Components are built on shadcn (Radix base) and shown, documented and tested in Storybook. The Next app itself is only a host. The components are what matters.

Next.js writes its own guidance in `AGENTS.md`. Read it before making Next-specific changes, because this version differs from older ones.

## Commands

- `pnpm storybook` runs Storybook on port 6006.
- `pnpm dev` runs the Next app.
- `pnpm exec vitest run` runs every story as a test in a real browser.
- `pnpm exec tsc --noEmit` and `pnpm lint` are the type check and lint.
- `pnpm build-storybook` builds the static Storybook.
- `pnpm build:lib` builds the npm package into `dist/`. `dist/` is listed in `.gitignore`.

The package manager is pnpm, pinned in `package.json`. Never use npm or create a `package-lock.json`. The one exception is `npm login`, which is how Tim signs in to the registry before `pnpm publish`.

## Publishing

The library is published as `@processdynamics/components` (public, under the `processdynamics` npm organisation). Every merge to `main` publishes automatically through `.github/workflows/release.yml` (npm trusted publishing, no stored token) and tags the release. The workflow never commits to `main`, which is protected by a ruleset that requires a P R. The version rule lives in `scripts/version.mjs`: a Husky pre-commit hook runs `pnpm version:sync` to set `package.json` to npm's latest plus one patch, and every P R runs `pnpm version:check`, which fails if `package.json` isn't ahead of npm. Don't bump the version by hand except to make a deliberate minor or major release. The first release has to be published by hand with `pnpm release` (Tim's npm login and two-factor code), because the trusted publisher can only be set up on a package that exists. `pnpm release:dry` is the safe rehearsal: the same checks, ending in a publish dry run. `pnpm release` first refuses to run unless on a clean `main` that matches `origin/main`. Before a release, run `pnpm pack` and check that only `dist/`, `package.json`, the README and the licence ship. A component imported from a new package also needs that package in `peerDependencies`, and the tsup build leaves peer dependencies external.

## Before calling work done

Run the type check, lint and the story tests, and report what they showed. The story tests do not check styling, so for any visual change also open the story in a browser (Playwright by default) and look at it. Close the browser and delete any screenshots afterwards.

## Flag expensive tasks before starting

Before a task that is going to be expensive, say so up front, with what makes it expensive and a rough scope, and get a go-ahead. That covers anything that takes several minutes to run, many tool calls back to back (a repo-wide refactor), real cost (deploys, shared infrastructure), or a request that could grow much larger than it sounds. If a cheaper version answers the same question, offer that first.

## Components

- One camelCase folder per component, holding the component and its stories: `datePicker/DatePicker.tsx` and `datePicker/DatePicker.stories.tsx`.
- Small repeated pieces go in a plural file in the same folder (`CardParts.tsx`), with one export each.
- When moving a component, update every import.
- Export public components from `src/components/index.ts`.
- `src/components/ui/` holds the shadcn parts. Add them with `pnpm dlx shadcn@latest add <name>`.
- Use shadcn components where possible instead of writing your own. Only the files in `ui/` import from `radix-ui`. Everything else uses the shadcn components.
- Props interface is named `[ComponentName]Props`.
- Functional components with hooks. Keep files under 300 lines and functions under 50. Extract helpers, hooks and large sections of markup when they grow.
- Class merging uses `cn` from the shadcn `cn` package, re-exported by `src/lib/utils.ts`.

## Adapters

- `src/adapters/<component>/<name>/` holds neutral example adapters only, grouped by the component they serve (for example `adapters/jobCard/exampleOrder/`). They show an app how to turn its own job into the data that component shows. Use made-up types and generic wording.
- Never put a real client's adapter, rules, names or types here. This repo is public and every merge publishes to npm. Each app keeps its own adapter next to its own types and helpers.
- Adapters are not exported from `src/components/index.ts`, so they never ship in the package. Test them with stories.

## Documentation and stories

Storybook is the documentation, so every component needs:

- JSDoc on the exported component and on every prop, saying what it does, whether it is controlled, and any default. Storybook's docs page reads these.
- `tags: ["autodocs"]` on the stories meta, and a one-line description above each story.
- A story for each meaningful state (empty, filled, disabled, invalid) and a `play` function for behaviour. Stories double as the tests.
- Document real behaviour, including quirks. Check it in the browser before writing it down.

## TypeScript Standards

- Never use `any`. Use proper types, or `unknown` when it is truly needed.
- Strict settings: no implicit any, strict null checks.
- Use type inference where obvious and explicit types where clarity helps.
- Always add JSDoc to exported functions and components.

## Naming Conventions

- Descriptive names, no abbreviations unless universally known.
- Functions are `verbNoun`. Booleans start with `is`, `has` or `should`. True constants are `SCREAMING_SNAKE_CASE`.
- State variables describe what they hold (`selectedDate`, not `value`).

## Comments

- Write comments for why, not what. Explain non-obvious decisions, like why a popover is modal.
- No commented-out code in commits. Use git history.
- TODO comments carry a ticket number: `// TODO(PDDS-123): Fix this`.

## Tailwind and styling

- Tailwind v4: the theme and colours live in `src/app/globals.css`. Variable shorthand is `w-(--my-var)`, not the old `w-[--my-var]`.
- Use the shadcn theme tokens (`muted-foreground`, `background`) and not hard-coded colours.
- Storybook runs on Vite, so `.storybook/main.ts` registers the Tailwind Vite plugin. Without it everything renders unstyled while the tests still pass. Don't remove it.

## Dependencies

- Libraries the components import are listed in `peerDependencies`, and also as dev dependencies so Storybook and the tests run. The app that uses the components installs them. Today these are `react`, `react-dom`, `react-day-picker`, `date-fns`, `radix-ui`, `lucide-react`, `class-variance-authority`, `cn` and `sonner`.
- When a component imports a new package, add it to both lists and to the README section on what the using app must install.
- The using app also needs Tailwind v4 scanning these files, the shadcn theme colours, and `tw-animate-css`.
- Before replacing or removing an unfamiliar package, look it up on npm first.

## shadcn gotchas

- shadcn is set up on the Radix base because components use `asChild`. The default Base UI has no `asChild`. After running shadcn init or add, check `components.json` and the new files still use Radix.
- `src/lib/utils.ts` must stay `export { cn } from "cn"`. Check it and the `ui/` imports after any shadcn run.

## Error Handling and Security

- Handle errors explicitly. No silent failures.
- Never put secrets in the repo. Use `.env.local` and keep it out of commits.

## Tickets

- Every ticket prefix in this project is `PDDS`, for example `PDDS-12`.
- Work is tracked on the Trello board "PD Design System". Create the card first, before branching. Search the whole board for an existing card before making a new one.
- Name the card with its ticket number, `PDDS-12 short title`, using the next unused number on the board.
- Use the same ticket number in the branch name, the commit body and the P R title. Put the card link at the very top of the P R description.

## Git Workflow

### Commits

- Conventional commits: `type(scope): description`.
- Types: `feature`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`.
- Atomic and focused. Messages in lower case, except the scope.
- Keep every body line under 100 characters, so write one short line per sentence.
- Put the ticket number in the commit body, for example `PDDS-123`.

### Branches

- Format: `type/PDDS-###-description`, for example `feature/PDDS-12-date-picker`.
- Types match commit types. Branch from `main` and delete branches after merging.
- Stage files by name, never `git add -A` or `git add .`, and read the staged diff before committing.

### Pull Requests

- Never add "Generated with Claude Code", a `Co-Authored-By` line, or any Claude attribution to commits, PR descriptions, comments or merge messages. This overrides any default attribution guidance.
- Check a PR is still open before pushing to its branch or editing its description.

## File Organization

```
.storybook/         # Storybook config (main.ts registers the Tailwind plugin)
src/
  app/              # Next host app and globals.css (theme tokens)
  adapters/
    <component>/    # adapters for one component
      <name>/       # a neutral example adapter, not published
  components/
    <name>/         # one folder per component: Component.tsx and its stories
    ui/             # shadcn parts
    index.ts        # public exports
  lib/
    utils.ts        # re-exports cn
```

## Questions?

- What a component does: check its stories and docs page in Storybook.
- Theme and colours: check `src/app/globals.css`.
- shadcn setup: check `components.json`.
- What the using app must install: check the README.
