import type { ComponentChildren } from 'preact';
import { statusColors, tokens, type StatusRole } from '../tokens';
import { Button } from './Button';

/**
 * The component the missing token roles were being hand-rolled into.
 *
 * The Bootstrap alert palette appears inline in 57 places across the comms frontend --
 * `#f8d7da`/`#721c24` for an error, `#d4edda`/`#155724` for a success, `#fff3cd`/`#856404`
 * for a warning -- because `tokens.color` offered `ok`, `info` and `idle` and no way to
 * say "danger" or "warn" at all. Each of those 57 sites also re-derived its own padding,
 * radius and border, so no two are quite the same size.
 *
 * Two things this adds that none of the 57 had:
 *
 * - **A way out.** `ShotLogPanel`'s "Not connected to the machine" states a problem and
 *   hands back nothing. An alert about a recoverable failure takes an `action`.
 * - **Announcement.** `role="alert"` for the two roles that report a failure, so an error
 *   that appears after a button press is heard as well as seen. `ok` and `info` get
 *   `role="status"` instead: polite, because a success does not warrant interrupting
 *   whatever is being read.
 */
export interface AlertProps {
  role?: StatusRole;
  /** Short, and the first thing read. */
  title?: string;
  children: ComponentChildren;
  /** The way out: Retry, Reconnect, Insert a card. */
  action?: { label: string; onClick: () => void };
  /** Renders a dismiss control. Omit for an alert the user cannot make go away. */
  onDismiss?: () => void;
}

export function Alert({ role = 'info', title, children, action, onDismiss }: AlertProps) {
  const colors = statusColors[role];
  const urgent = role === 'danger' || role === 'warn';

  return (
    <div
      role={urgent ? 'alert' : 'status'}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: tokens.space.sm,
        padding: `${tokens.space.sm} ${tokens.space.md}`,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: tokens.radius.sm,
        color: colors.ink,
        font: `0.875rem ${tokens.font.sans}`,
        lineHeight: 1.5,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <strong style={{ display: 'block' }}>{title}</strong>}
        {children}
      </div>

      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}

      {onDismiss && (
        // A real label, not a bare "×". The glyph is the visible affordance; the name is
        // what a screen reader and a touch user's accessibility inspector get, and this
        // is one of the 58 places the frontend was relying on a `title` tooltip that does
        // not exist on the tablet these machines are driven from.
        <Button variant="quiet" size="sm" onClick={onDismiss} ariaLabel="Dismiss">
          <span aria-hidden="true">×</span>
        </Button>
      )}
    </div>
  );
}
