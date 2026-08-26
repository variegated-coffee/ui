import type { ComponentChildren, JSX } from 'preact';
import { tokens } from '../tokens.js';
import { focusRingStyle, useInteractive } from './useInteractive.js';

/**
 * Four weights, and the point of the set is that only one of them is loud.
 *
 * The audit found three button treatments inside a single `ShotLogPanel` card and three
 * competing "primary" weights in one `RoutineEditor` footer -- dark grey fill, blue fill
 * and hairline outline all claiming to be the main action. That is what happens when every
 * screen invents its own: nothing is comparable across screens because nothing was ever
 * compared.
 *
 *   primary      one per view. The thing the screen is for.
 *   secondary    an alternative to primary. Bordered, not filled.
 *   quiet        housekeeping. Reads as a link that happens to be a button.
 *   destructive  quiet until you are pointing at it -- see below.
 *
 * `destructive` is deliberately *not* a red fill. Every `ScheduleBuilder` row ended in
 * one, so a list of two schedules drew the eye twice to its most irreversible action; the
 * loudest thing on the screen was the thing you least wanted to hit. It is ink-coloured at
 * rest and only turns red on hover, focus or press, which is the moment the warning is
 * actually useful. The confirmation carries the weight instead, and `Dialog`'s `confirm`
 * is where that lives.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'destructive';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps {
  children: ComponentChildren;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: (e: JSX.TargetedMouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  /**
   * Renders an `<a>` instead of a `<button>`.
   *
   * Not a styling convenience: `ShotLogPanel`'s Download *is* a link -- same origin, the
   * firmware sets `Content-Disposition`, and a plain anchor is the whole implementation.
   * Making it a button to get the look would mean reimplementing a download.
   */
  href?: string;
  download?: boolean;
  /** Where the label alone is not the accessible name, or there is no visible label. */
  ariaLabel?: string;
  /**
   * For a disclosure control -- a Details toggle, a collapsing panel header.
   *
   * Without it the arrow glyph is the only indication of state, which is finding 08 in
   * miniature: a control whose meaning is carried entirely by a `▶`. Setting it also makes
   * the button announce as expanded or collapsed rather than as a plain button.
   */
  ariaExpanded?: boolean;
  /** The id of the region this control discloses, where there is one. */
  ariaControls?: string;
  /** Fills the width of its container -- for a single action at the foot of a card. */
  block?: boolean;
  type?: 'button' | 'submit';
  title?: string;
}

interface Skin {
  background: string;
  color: string;
  border: string;
}

function skinFor(variant: ButtonVariant, hot: boolean): Skin {
  switch (variant) {
    case 'primary':
      return {
        background: hot ? tokens.color.infoStrong : tokens.color.info,
        color: tokens.color.surfaceRaised,
        border: `1px solid ${hot ? tokens.color.infoStrong : tokens.color.info}`,
      };
    case 'secondary':
      return {
        background: hot ? tokens.color.surface : tokens.color.surfaceRaised,
        color: tokens.color.ink,
        border: `1px solid ${tokens.color.border}`,
      };
    case 'quiet':
      return {
        background: hot ? tokens.color.surface : 'transparent',
        color: hot ? tokens.color.ink : tokens.color.inkMuted,
        border: '1px solid transparent',
      };
    case 'destructive':
      // Ink at rest, `danger` the moment it is pointed at. The tint rather than a fill
      // even when hot: a filled red still reads as "press me", which is the opposite of
      // what this button wants to communicate.
      return {
        background: hot ? tokens.color.dangerSurface : 'transparent',
        color: hot ? tokens.color.dangerInk : tokens.color.ink,
        border: `1px solid ${hot ? tokens.color.dangerBorder : 'transparent'}`,
      };
  }
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  onClick,
  disabled = false,
  href,
  download,
  ariaLabel,
  ariaExpanded,
  ariaControls,
  block = false,
  type = 'button',
  title,
}: ButtonProps) {
  const { hovered, focusRing, pressed, handlers } = useInteractive();
  const hot = !disabled && (hovered || focusRing || pressed);
  const skin = skinFor(variant, hot);

  const style: JSX.CSSProperties = {
    display: block ? 'flex' : 'inline-flex',
    width: block ? '100%' : undefined,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.xs,
    padding: size === 'sm' ? `${tokens.space.xs} ${tokens.space.sm}` : '0.5rem 0.75rem',
    fontFamily: tokens.font.sans,
    fontSize: size === 'sm' ? '0.8rem' : '0.9rem',
    fontWeight: variant === 'primary' ? 500 : 400,
    lineHeight: 1.2,
    borderRadius: tokens.radius.sm,
    background: skin.background,
    color: skin.color,
    border: skin.border,
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    // Not `visibility` and not a lighter colour: a disabled control still has to be
    // readable, because finding 05 is about a user who needs to know *what* is
    // unavailable, not just that something is.
    opacity: disabled ? 0.55 : 1,
    ...(focusRing && !disabled ? focusRingStyle(tokens.color.info) : {}),
  };

  if (href !== undefined) {
    return (
      <a
        href={disabled ? undefined : href}
        download={download}
        style={style}
        aria-label={ariaLabel}
        aria-disabled={disabled ? 'true' : undefined}
        title={title}
        {...handlers}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      title={title}
      {...handlers}
    >
      {children}
    </button>
  );
}
