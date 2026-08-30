import { useEffect, useState } from 'preact/hooks';
import { tokens } from '../tokens.js';

/**
 * One measured number, and the unit that says what it is.
 *
 * The smallest of the new primitives and the one with the most call sites: every figure on
 * every screen goes through it. It exists because the same number was being set three ways
 * -- `48.9 s` as one proportional string in the shot table, `93` in a text input on the
 * machine page, `93.3 °C` hand-assembled inside `Reading` -- so nothing lined up in a column
 * and nothing agreed on how a stale value looks.
 *
 * # The unit is not part of the value
 *
 * `48.9 s` as a single string right-aligns on the `s`, which puts the decimal points of a
 * column in different places and defeats the entire reason for tabular figures. Splitting
 * them lets the number carry the alignment and the unit ride along muted and smaller, which
 * is also the reading order: you want the quantity first.
 *
 * So `value` is pre-formatted and `unit` is separate. This decides how a number *looks*,
 * never how many decimals it has -- rounding is a question about the measurement, and the
 * caller is the only one who knows the answer.
 *
 * # Two sizes, because there are two jobs
 *
 * `figure` is a number in a row or a metadata line. `reading` is the headline -- a boiler's
 * current temperature, the thing the card is about. They are `tokens.type.figure` and
 * `tokens.type.reading` rather than two local literals, so the scale stays a system
 * decision.
 *
 * # Pending is not the same as stale
 *
 * Most machine commands are fire-and-forget: the send resolving means *queued*, not *set*.
 * A target that has been sent but not yet confirmed by the machine's own reading is
 * `pending` -- greyed, with a spinner beside it -- and one sent to a machine that is not
 * reachable is `queued`, greyed with a word rather than a spinner, because nothing is
 * in flight to wait for. The distinction is the difference between "wait a moment" and
 * "this will happen when it comes back", and a single grey state cannot say both.
 */
export interface FigureProps {
  /** Pre-formatted. See above: this decides how it looks, not how many decimals it has. */
  value: string;
  unit?: string;
  size?: 'figure' | 'reading';
  /**
   * `right` for a column of figures, which is the whole point of tabular numerals.
   * `left` for a figure sitting in a sentence or beside a label.
   */
  align?: 'left' | 'right';
  /** Sent, and waiting for the machine's own reading to confirm it. */
  pending?: boolean;
  /** Sent to a machine that is not reachable. It will go out when the machine returns. */
  queued?: boolean;
}

export function Figure({
  value,
  unit,
  size = 'figure',
  align = 'left',
  pending = false,
  queued = false,
}: FigureProps) {
  const role = size === 'reading' ? tokens.type.reading : tokens.type.figure;
  const unsettled = pending || queued;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        // Fills its cell when right-aligned, because otherwise there is nothing to align
        // against: an inline-flex box is only as wide as its content, so `flex-end` inside it
        // moves nothing. This is what makes a column of figures line up on the decimal point.
        width: align === 'right' ? '100%' : undefined,
        gap: tokens.space.xs,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          ...role,
          // Greyed rather than faded, because opacity would take the unit and the spinner
          // with it and make the whole group look disabled rather than the value look
          // unconfirmed.
          color: unsettled ? tokens.color.idle : tokens.color.ink,
        }}
      >
        {value}
      </span>
      {unit && (
        <span
          style={{
            // The family, but deliberately not the role's `tabular-nums`: a unit has no
            // digits to align, and tagging it anyway would leave two nodes claiming to be
            // the figure -- which is what the mono face is supposed to mark.
            fontFamily: role.fontFamily,
            // Smaller than the value it qualifies, and muted, so a column reads as numbers
            // with units rather than as a column of strings.
            fontSize: size === 'reading' ? '14px' : '11.5px',
            color: tokens.color.inkMuted,
          }}
        >
          {unit}
        </span>
      )}
      {pending && <Spinner />}
      {queued && !pending && (
        <span
          style={{
            ...tokens.type.eyebrow,
            color: tokens.color.warnInk,
            background: tokens.color.warnSurface,
            border: `1px solid ${tokens.color.warnBorder}`,
            borderRadius: tokens.radius.sm,
            padding: `2px ${tokens.space.xs}`,
          }}
        >
          queued
        </span>
      )}
    </span>
  );
}

/**
 * The in-flight indicator, as an SVG rather than a CSS animation.
 *
 * There is no stylesheet to put a `@keyframes` in -- that is the whole architecture, so that
 * the components drop into a firmware frontend with no CSS build -- and an inline style
 * object cannot declare one. SMIL is the one animation that travels inside the element,
 * which makes it the only option that does not introduce the pipeline this system exists
 * without.
 *
 * Honours `prefers-reduced-motion` by not animating at all: a static ring still says
 * "something is outstanding here", which is the whole message. A spinner is decoration on
 * top of that, and it is decoration that makes some people ill.
 */
function Spinner() {
  const still = usePrefersReducedMotion();

  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      role="img"
      aria-label="Sent, waiting for the machine to confirm"
      style={{ flexShrink: 0, alignSelf: 'center' }}
    >
      <circle cx="8" cy="8" r="6.5" fill="none" stroke={tokens.color.hairlineStrong} strokeWidth="2" />
      <path
        d="M8 1.5 A6.5 6.5 0 0 1 14.5 8"
        fill="none"
        stroke={tokens.color.info}
        strokeWidth="2"
        strokeLinecap="round"
      >
        {!still && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 8 8"
            to="360 8 8"
            dur="0.7s"
            repeatCount="indefinite"
          />
        )}
      </path>
    </svg>
  );
}

/**
 * Whether the reader has asked for less movement.
 *
 * Read at mount and then followed, because the setting can change while the page is open and
 * a spinner that keeps going after someone turns it off is exactly the case the setting is
 * for. Defaults to "no preference" where `matchMedia` is unavailable, which is the same
 * answer a browser without the query would give.
 */
function usePrefersReducedMotion(): boolean {
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setStill(query.matches);
    const onChange = (event: MediaQueryListEvent) => setStill(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return still;
}
