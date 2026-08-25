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
tracked in JavaScript (`useInteractive`), and the tokens are not runtime-themeable. A dark
mode would turn them into CSS custom properties and change both consumers.

## Contrast, from the command line

```
node measure-contrast.mjs '#721c24' '#f8d7da' '#155724' '#d4edda'
```

Every ratio quoted in `src/tokens.ts` came from this. Use it before writing a new colour
down, not after `npm test` rejects it.
