import { tokens } from '../tokens';
import { Button } from './Button';

/**
 * What a panel says when it has nothing to show, put where it will actually be read.
 *
 * The audit's finding is about position more than wording. "No SD card inserted." and "No
 * shots recorded yet." were 13px grey sentences *below* the entire control block -- the
 * one fact that explains why the panel is useless, sitting in the panel's least prominent
 * spot, styled as a footnote. A user scanning the screen reads the controls first, tries
 * one, and only then finds the sentence saying why nothing happened.
 *
 * Two rules follow, and they are why this is a component rather than a `<p>`:
 *
 * - **It goes above the controls it explains**, not after them. That is the caller's
 *   placement, but there is nothing else this component is for, so it is worth saying.
 * - **It carries the next step.** `action` is not decoration. "No schedules configured"
 *   with an Add Schedule button is a screen you can use; the same sentence alone is a
 *   dead end. Where there is genuinely nothing to do -- "This machine has no SD card
 *   storage" is a fact about the hardware -- omit it rather than invent one.
 */
export interface EmptyStateProps {
  /** The fact, in a sentence. "No shots recorded yet." */
  title: string;
  /** Why, or what would change it. Optional -- the title is often the whole story. */
  detail?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, detail, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: tokens.space.sm,
        padding: tokens.space.xl,
        textAlign: 'center',
        background: tokens.color.surfaceSunken,
        // Dashed, because the border is describing an absence -- a container waiting for
        // content rather than a card with content in it.
        border: `1px dashed ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
      }}
    >
      <div style={{ font: `1rem ${tokens.font.sans}`, color: tokens.color.ink }}>{title}</div>
      {detail && (
        <div
          style={{
            font: `0.875rem ${tokens.font.sans}`,
            lineHeight: 1.5,
            color: tokens.color.inkMuted,
            maxWidth: '46ch',
          }}
        >
          {detail}
        </div>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
