import type { ComponentChildren } from 'preact';
import { tokens } from '../tokens.js';

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
  /** For nested detail -- the PID terms inside a boiler card. */
  size?: 'md' | 'sm';
  /** Draws the eye to the figure that is the point of the card. */
  emphasis?: boolean;
}

export function Reading({ label, value, unit, size = 'md', emphasis = false }: ReadingProps) {
  const scale = size === 'sm' ? '0.8rem' : '0.9rem';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: tokens.space.sm,
        fontSize: scale,
      }}
    >
      <span style={{ color: tokens.color.inkMuted, fontFamily: tokens.font.sans }}>{label}</span>
      <span
        style={{
          fontFamily: tokens.font.mono,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: emphasis ? 500 : 400,
          color: tokens.color.ink,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: '0.85em', color: tokens.color.inkMuted }}> {unit}</span>
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
