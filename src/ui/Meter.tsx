import { tokens } from '../tokens.js';

/**
 * A proportion, as a bar.
 *
 * For a quantity that is always between two known ends and is read at a glance rather than
 * exactly -- a heating element's duty cycle, a tank level. Not for a value whose number
 * matters: that is a `Figure`, and if both matter they sit together, the number above the
 * bar.
 *
 * # Why it is 5px and has no label of its own
 *
 * It is an accent on a card that already says what it is. At meter height the eye reads
 * position and nothing else, so anything taller starts competing with the reading above it
 * -- and the reading is the point of the card.
 *
 * # The groove is `fill`, not `surfaceSunken`
 *
 * `surfaceSunken` is opaque, so a groove drawn on a status tint punches a white hole in it.
 * `tokens.color.fill` is ink at low alpha and composites, which is the difference between a
 * meter that works on any card and one that works on white.
 *
 * # It is never identified by colour alone
 *
 * `tone` takes a pen so a brew boiler's meter matches its trace, which is the same rule the
 * charts follow -- and, like them, the colour is a match rather than a message. The label
 * beside it is what says which boiler this is. Eleven pens that all clear 3:1 cannot also be
 * far apart in luminance, so several are close in greyscale.
 */
export interface MeterProps {
  /** 0 to 1. Clamped, because a duty cycle arriving as 1.02 should not draw past the end. */
  value: number;
  /** The bar's colour. Defaults to the accent; pass a `tokens.pen` value to match a trace. */
  tone?: string;
  /** What the bar measures, for a screen reader. The visible label is the caller's. */
  label: string;
  /** Pre-formatted, for the accessible value -- "18 %", "full". */
  valueText?: string;
}

export function Meter({ value, tone = tokens.color.info, label, valueText }: MeterProps) {
  const fraction = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={Math.round(fraction * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={valueText}
      style={{
        height: '5px',
        borderRadius: '3px',
        background: tokens.color.fill,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${fraction * 100}%`,
          height: '100%',
          background: tone,
        }}
      />
    </div>
  );
}
