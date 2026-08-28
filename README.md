# @variegated-coffee/ui

The Variegated design language — tokens, and the primitives built from them — shared by the
two Preact frontends that make up the machine's UI:

- `variegated-plantlet-ts/packages/shot-log` and `packages/routine-editor`
- `variegated-rs/firmwares/variegated-comms-firmware/frontend`

## Why this is a package and not a folder

Those two live in different repositories, and Vite does not transpile TypeScript inside
`node_modules`. So this ships built JS with declarations beside it (`npm run build`), and
is consumed from the registry rather than by path. Pinning it by a relative path would tie
the firmware's build to the umbrella checkout layout, and the firmware's `build.rs` runs
`npm run build` on every build that touches the frontend — it has to work from a bare
clone.

## Why it exists at all

`tokens.ts` was written as "the design language of the comms frontend, given names", and
lived in `shot-log`, where the comms frontend could not reach it. It never did. That
frontend has 736 hex literals, 0 `htmlFor`, 0 `role=`, 0 `aria-*`, 8 `window.confirm` and
19 `alert()`, and the Bootstrap alert palette pasted inline in 57 places — because
`tokens.color` offered `ok`, `info` and `idle` and no way to say "danger" or "warn".

So the package is both halves of that gap: the roles that were missing, and the six
primitives the 62 components were each re-inventing.

## What's in it

| Export | |
|---|---|
| `tokens` | colour, space, radius, font, the 14-pen chart palette, phase bands |
| `statusColors`, `StatusRole` | the four status roles as `{ solid, surface, border, ink }` |
| `contrastRatio` | WCAG 2.1, so the palette's tuning is a test rather than a claim |
| `Button` | `primary` / `secondary` / `quiet` / `destructive` |
| `Field`, `TextInput` | label, id, help, error, units — the label is not optional |
| `Alert` | the four roles, announced, with a way out |
| `Badge` | state pills and capacity counts |
| `EmptyState` | the fact, and the next step |
| `Dialog`, `DialogHost`, `useDialogs` | modal shell, and `confirm`/`notify` as promises |

## Rules the tests hold

`npm test` is not a formality — these are the things that were absent everywhere and could
quietly go absent again:

- Every status ink clears 4.5:1 on its own tint **and** on white; every solid clears 3:1.
- Every pen clears 3:1 on white and on every phase band; every band stays under 1.25:1.
- `Field` puts an `id` on its control that its `<label>` actually points at.
- `TextInput` never renders `type="number"` — that is what displayed PID gains as `1,4`.
- `Button variant="destructive"` is not red at rest.
- `Dialog` is announced as one, traps Tab, and cancels on Escape.

## No CSS

Neither consumer has a CSS pipeline, deliberately: these components have to drop into a
firmware frontend that has none. Everything is inline style objects, hover and focus are
tracked in JavaScript (`useInteractive`), and the tokens are not runtime-themeable — making
them CSS custom properties would change both consumers.

## Two schemes, and what that does not mean

There is a dark palette: `tokens.darkColor`, `tokens.darkPen` and `tokens.darkPhase`, with
`themeFor(scheme)` to pick a set. It holds the same contrast contract as the light one, in
a parallel suite in `test/tokens.test.ts`.

It is **not** a dark mode for the primitives. They read their palette at module-init time
and copy it into module-level style objects, so a component follows a scheme only once it
is threaded one — which is a change at roughly a dozen call sites and has not been made.
Adding the palette was the easy half; that is the half worth budgeting for.

Two tokens exist only because the second scheme needs them, and are duplicates of existing
values in light so a site can be written once and be right in both:

- `accentInk` — `info` used as *text* rather than as a fill. One blue does both jobs in
  light and cannot in dark, where a fill must stay dark enough for a white label while text
  must be lighter than its surface.
- `onFill` — the label on a filled accent or status block. White in **both** schemes.
  Reaching for `surfaceRaised` here is the mistake that makes an inverted palette look
  right until a filled button turns up.

## Contrast, from the command line

```
node measure-contrast.mjs '#721c24' '#f8d7da' '#155724' '#d4edda'
```

Every ratio quoted in `src/tokens.ts` came from this. Use it before writing a new colour
down, not after `npm test` rejects it.

The dark pen ramp is derived rather than chosen, by running the light palette's own rule
backwards. Re-run it after changing a light pen and paste the line it prints:

```
node derive-dark-pens.mjs
```
