import type { ComponentChildren } from 'preact';
import { statusColors, tokens, type StatusRole } from '../tokens';

/**
 * A small piece of state attached to a thing, and a place to put capacity figures.
 *
 * Two jobs, both from the audit:
 *
 * - The `ENABLED`/`DISABLED` pills on `ScheduleBuilder` rows, and the several other
 *   hand-rolled versions of them, each with its own padding and radius.
 * - The storage ceilings that had leaked into headings. `Schedules (2/64)` and `Derived
 *   Parameters (1/16)` made a firmware limit the title of the screen. The count is worth
 *   showing -- it is how you know you are near the wall -- but as an annotation beside the
 *   heading, not as part of its name. `tone="neutral"` is that case.
 *
 * There is deliberately no filled variant, though that is what the frontend has today: the
 * `ENABLED` pill is white on `#28a745`, which measures 3.13:1 and fails the 4.5:1 that
 * text has to clear. There is no fix that keeps the fill -- `ok` and `warn` have no shade
 * dark enough to carry a white label and still read as green and amber -- so the tint is
 * the only variant, and it is the quieter one anyway, which is the direction finding 02
 * wants everything to move.
 *
 * The colour is always paired with a word, never used alone. That is the rule the pen
 * palette records, and it is what makes these legible to someone who is not seeing hue.
 */
export interface BadgeProps {
  children: ComponentChildren;
  /** Omit for the grey annotation case: counts, capacities, inert metadata. */
  role?: StatusRole;
  /** Tabular figures, for a badge whose contents change -- `3/64` ticking up to `4/64`. */
  numeric?: boolean;
}

export function Badge({ children, role, numeric = false }: BadgeProps) {
  const colors = role ? statusColors[role] : null;

  const palette = colors
    ? { background: colors.surface, color: colors.ink, border: colors.border }
    : { background: tokens.color.surface, color: tokens.color.inkMuted, border: tokens.color.border };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: `0.1rem ${tokens.space.sm}`,
        borderRadius: tokens.radius.sm,
        background: palette.background,
        color: palette.color,
        border: `1px solid ${palette.border}`,
        font: numeric ? `0.75rem ${tokens.font.mono}` : `0.75rem ${tokens.font.sans}`,
        fontVariantNumeric: numeric ? 'tabular-nums' : undefined,
        fontWeight: 500,
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
