import type { ComponentChildren } from 'preact';
import { tokens } from '../tokens.js';
import { Figure } from './Figure.js';

/**
 * A label and the number it names.
 *
 * The seventh primitive, and the one the audit describes without naming: 74 label strings
 * ending in a colon -- "Temperature:", "Output:", "EC:" -- each followed by a value
 * rendered in the proportional stack, so every live figure jitters sideways as it updates.
 * The shot family solved this years ago with `tokens.font.mono`; the 21 remaining
 * `"monospace"` literals scattered through the machine screens are where the intent
 * survived the copy-paste but the token did not.
 *
 * # Why `Reading` and not `Readout`
 *
 * `Readout` was the obvious name and is already taken: the shot page's `Readout` is the
 * panel listing every pen's current value, and it is the older, user-facing component. Two
 * different things called `Readout` in one flat bundle namespace is a duplicate export, and
 * more importantly it is a design system that cannot say which one it means. This is the
 * singular -- one reading -- and `ReadingGroup` is a stack of them.
 *
 * Three decisions worth stating, because each was being made differently per screen:
 *
 * - **Monospace with tabular figures, always.** Not a style choice. A boiler temperature
 *   updating at 1 Hz through 99.9 -> 100.0 changes width in a proportional face, which
 *   drags the whole row. `tokens.font.mono` and `tabular-nums` together fix the column.
 * - **No trailing colon.** Two columns with the label left and the value right already say
 *   which is which; the colon is punctuation for a sentence this is not. Dropping it also
 *   stops "Temperature:" and "Temperature :" and "Temperature" being three spellings of
 *   one label across three files.
 * - **The unit is separate from the value**, muted and smaller, so `93.3` reads as the
 *   figure and `°C` as its unit -- and so a column of them aligns on the number rather
 *   than on the end of the string.
 */
export interface ReadingProps {
  label: string;
  /** Pre-formatted. This decides how it *looks*, never how many decimals it has. */
  value: string;
  unit?: string;
  /**
   * For nested detail -- the PID terms inside a boiler card.
   *
   * Affects the label and the spacing only. The figure itself takes its size from the type
   * scale via `emphasis`, because "how big is this number" is a question about what the
   * number *is*, not about how tightly the block around it is set.
   */
  size?: 'md' | 'sm';
  /**
   * Draws the eye to the figure that is the point of the card.
   *
   * This is now the switch between the two figure roles: `figure` for a value in a list, and
   * `reading` -- 30px mono -- for the headline a card exists to show, like a boiler's current
   * temperature. Six call sites across both frontends set it, and they are exactly the six
   * headline numbers.
   */
  emphasis?: boolean;
  /**
   * A second line under the value -- what it is doing, or when it was last true.
   *
   * "pump idle" under a group pressure of `0.0`, "today 10:52 · Simply fast" under a shot
   * duration. The number alone is often ambiguous about whether it is a measurement or an
   * absence, and this is where that gets said rather than being inferred from a zero.
   */
  secondary?: string;
  /** Sent, waiting for the machine's own reading to confirm it. */
  pending?: boolean;
  /** Sent to a machine that is not reachable. */
  queued?: boolean;
}

export function Reading({
  label,
  value,
  unit,
  size = 'md',
  emphasis = false,
  secondary,
  pending = false,
  queued = false,
}: ReadingProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: size === 'sm' ? tokens.space.xs : tokens.space.sm,
      }}
    >
      {/*
       * The label is an eyebrow rather than sentence-cased body text.
       *
       * It is naming a value, not saying something about it -- and at this size a mono
       * capitalised label is told apart from the figure beside it at a glance, where two
       * runs of sans at the same size have to be read to be separated.
       */}
      <span style={{ ...tokens.type.eyebrow, color: tokens.color.inkMuted }}>{label}</span>
      <span style={{ textAlign: 'right' }}>
        {/*
         * The number itself is `Figure`'s, not this component's.
         *
         * It was the same mono-tabular-with-a-muted-unit treatment written out twice, and
         * two copies is how the shot table and the machine cards came to disagree about
         * where the unit goes. Delegating also means a `Reading` gets the pending and queued
         * states for free rather than growing its own.
         */}
        <Figure
          value={value}
          unit={unit}
          size={emphasis ? 'reading' : 'figure'}
          align="right"
          pending={pending}
          queued={queued}
        />
        {secondary && (
          <span
            style={{
              ...tokens.type.caption,
              display: 'block',
              color: tokens.color.inkMuted,
              marginTop: '2px',
            }}
          >
            {secondary}
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * A stack of `Reading`s, with the spacing decided once.
 *
 * Exists because the alternative is every card declaring the same flex column, and three
 * of them declaring a slightly different gap.
 */
export function ReadingGroup({
  title,
  children,
}: {
  /** Optional heading, for a nested block like "PID terms". */
  title?: string;
  children: ComponentChildren;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.xs }}>
      {title && (
        <div
          style={{
            font: `0.75rem ${tokens.font.sans}`,
            fontWeight: 500,
            color: tokens.color.inkMuted,
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
