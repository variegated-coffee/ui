import type { ComponentChildren } from 'preact';
import { useId, useState } from 'preact/hooks';
import { tokens } from '../tokens';
import { focusRingStyle, useInteractive } from './useInteractive';

/**
 * A titled region that collapses, with one affordance for doing so.
 *
 * Finding 08 is this component's absence. `ConfigurationPanel` collapsed offers a `▶`
 * glyph; expanded, the same toggle becomes a bordered *Collapse* button in the opposite
 * corner -- two controls, two positions, one action. `StatusDisplay` has four more
 * disclosure headers, each rebuilt by hand, and none of them tells assistive technology
 * anything: the state lives entirely in whether the glyph is `▶` or `▼`.
 *
 * So: the whole header is the control, in one place, in both states. `aria-expanded` says
 * which state it is in and `aria-controls` says what it governs, and the glyph becomes
 * decoration rather than the only signal.
 *
 * The body is unmounted when collapsed rather than hidden. These panels hold live
 * readouts fed by a 5 Hz status push; keeping a collapsed one mounted means re-rendering
 * cards nobody is looking at.
 */
export interface SectionProps {
  title: string;
  children: ComponentChildren;
  /** A count, a capacity, a state -- rendered beside the title, not inside it. */
  annotation?: ComponentChildren;
  defaultOpen?: boolean;
  /** For a section whose open state belongs to the caller. */
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

export function Section({
  title,
  children,
  annotation,
  defaultOpen = true,
  open,
  onToggle,
}: SectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const { hovered, focusRing, handlers } = useInteractive();
  const bodyId = useId();

  const isOpen = open ?? internalOpen;
  const toggle = () => {
    const next = !isOpen;
    if (open === undefined) setInternalOpen(next);
    onToggle?.(next);
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={bodyId}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: tokens.space.sm,
          padding: tokens.space.sm,
          background: hovered ? tokens.color.surface : tokens.color.surfaceSunken,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.sm,
          font: `1rem ${tokens.font.sans}`,
          fontWeight: 500,
          color: tokens.color.ink,
          textAlign: 'left',
          cursor: 'pointer',
          ...(focusRing ? focusRingStyle(tokens.color.info) : {}),
        }}
        {...handlers}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: tokens.space.sm }}>
          {title}
          {annotation}
        </span>
        {/* Decoration. `aria-expanded` above is what actually announces the state, which
            is what these headers were missing entirely. */}
        <span aria-hidden="true" style={{ fontSize: '0.8rem', color: tokens.color.inkMuted }}>
          {isOpen ? '▼' : '▶'}
        </span>
      </button>

      {isOpen && (
        <div id={bodyId} style={{ marginTop: tokens.space.md }}>
          {children}
        </div>
      )}
    </div>
  );
}
