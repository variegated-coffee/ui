import { useCallback, useMemo, useState } from 'preact/hooks';

/**
 * Hover, focus and press state, tracked in JavaScript because there is no stylesheet.
 *
 * Neither consumer of this package has a CSS pipeline -- that is recorded as a decision in
 * `tokens.ts`, not an oversight -- so `:hover` and `:focus-visible` have no place to live.
 * Every interactive primitive here therefore needs the same four handlers, and writing
 * them per component is how the comms frontend ended up with one button that has a hover
 * effect (`ScheduleBuilder`'s *Optimize Storage*) and forty that do not.
 *
 * `:focus-visible` is matched rather than approximated. The distinction is the whole point
 * of the ring: a mouse user clicking a button should not get one, and a keyboard user
 * tabbing to it must. `Element.matches(':focus-visible')` is what the browser already
 * knows, so it is asked instead of guessed at from a "was the last input a key" heuristic.
 */
export interface Interactive {
  hovered: boolean;
  /** True only for focus the browser considers worth showing a ring for. */
  focusRing: boolean;
  pressed: boolean;
  handlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: (e: { currentTarget: Element }) => void;
    onBlur: () => void;
    onMouseDown: () => void;
    onMouseUp: () => void;
  };
}

export function useInteractive(): Interactive {
  const [hovered, setHovered] = useState(false);
  const [focusRing, setFocusRing] = useState(false);
  const [pressed, setPressed] = useState(false);

  const onFocus = useCallback((e: { currentTarget: Element }) => {
    // Guarded: `:focus-visible` is unsupported in a few embedded webviews, and `matches`
    // throws on a selector it cannot parse rather than returning false. Showing the ring
    // on all focus is the safe side of that -- a ring too many is a cosmetic problem, a
    // ring too few is finding 03 all over again.
    try {
      setFocusRing(e.currentTarget.matches(':focus-visible'));
    } catch {
      setFocusRing(true);
    }
  }, []);

  const handlers = useMemo(
    () => ({
      onMouseEnter: () => setHovered(true),
      // Also clears `pressed`: the pointer can go down on a control and up outside it,
      // which otherwise leaves the button stuck in its pressed colours.
      onMouseLeave: () => {
        setHovered(false);
        setPressed(false);
      },
      onFocus,
      onBlur: () => setFocusRing(false),
      onMouseDown: () => setPressed(true),
      onMouseUp: () => setPressed(false),
    }),
    [onFocus]
  );

  return { hovered, focusRing, pressed, handlers };
}

/**
 * The one focus ring, so every primitive draws the same one.
 *
 * `outline` rather than `boxShadow` so it follows the border radius without having to be
 * told it, and survives a control that is clipped by an ancestor's `overflow: hidden`.
 */
export function focusRingStyle(colour: string): Record<string, string> {
  return {
    outline: `2px solid ${colour}`,
    outlineOffset: '2px',
  };
}
