import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useCallback, useContext, useEffect, useId, useRef, useState } from 'preact/hooks';
import { tokens } from '../tokens';
import { Button } from './Button';

/**
 * The modal shell, and the in-system replacement for `window.confirm` and `alert`.
 *
 * `JsonModal` was the only shared shell in the library, so every other modal -- the
 * routine editor, the step editor, the schedule item editor, the parameter editors --
 * rebuilt the same fixed backdrop, and every *confirmation* skipped the problem entirely
 * by calling `window.confirm`: 8 call sites, plus 19 `alert()`s. Those are unstyled,
 * unbranded and untranslatable, they are suppressible per-origin by the browser (so a
 * delete can silently proceed unconfirmed), and on the tablet these machines are driven
 * from they arrive as an OS sheet that looks like it came from somewhere else entirely.
 *
 * What the native ones did give, and what this therefore has to earn back:
 *
 * - **Focus goes into the dialog and cannot leave it.** Tab and Shift-Tab cycle inside.
 * - **Escape cancels**, and cancelling is what the backdrop click does too.
 * - **Focus returns** to whatever opened it. A confirm that dumps you at the top of the
 *   document has broken the keyboard user's place in the list they were working through.
 * - **It is announced as a dialog**, with its title as the accessible name.
 */

// Ordered as the browser tabs them, and `:not([disabled])` because a disabled control is
// not a tab stop -- trapping onto one would strand the focus ring on something inert.
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface DialogProps {
  /** The accessible name. Required -- an unnamed dialog announces as "dialog". */
  title: string;
  children: ComponentChildren;
  /** Escape, the backdrop, and the close control all route here. */
  onClose: () => void;
  /** Rendered bottom-right. Put the primary action last, where the eye lands. */
  footer?: ComponentChildren;
  width?: string;
}

export function Dialog({ title, children, onClose, footer, width = '32rem' }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    // Captured before focus moves, so it is the element that actually opened the dialog.
    const opener = document.activeElement as HTMLElement | null;

    const node = panel.current;
    if (node) {
      const first = node.querySelector<HTMLElement>(FOCUSABLE);
      // The panel itself as the fallback, via `tabindex="-1"` below: a dialog whose body
      // is a paragraph has nothing focusable in it, and leaving focus on the opener
      // outside the trap means the first Tab escapes.
      (first ?? node).focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;

      const stops = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (stops.length === 0) {
        // Nothing to cycle between, so the only correct move is to stay put.
        e.preventDefault();
        return;
      }
      const first = stops[0]!;
      const last = stops[stops.length - 1]!;
      const active = document.activeElement;

      // Wrap at both ends. Also catches focus that is somewhere outside the panel
      // entirely -- which is what happens when the dialog opens over a page that had
      // focus in it and something re-focuses asynchronously.
      if (e.shiftKey && (active === first || !panel.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      // Only if focus is still somewhere in the dialog. If something else has
      // deliberately taken it in the meantime, stealing it back is the more surprising
      // behaviour.
      if (opener && (!document.activeElement || document.activeElement === document.body)) {
        opener.focus();
      }
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.space.md,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
      }}
      onClick={(e) => {
        // Only the backdrop itself. Without the target check, a click that starts inside
        // the panel and drifts onto the backdrop closes the dialog mid-drag.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflow: 'hidden',
          background: tokens.color.surfaceRaised,
          borderRadius: tokens.radius.md,
          font: `0.9rem ${tokens.font.sans}`,
          color: tokens.color.ink,
        }}
      >
        <div style={{ padding: tokens.space.lg, borderBottom: `1px solid ${tokens.color.border}` }}>
          <h2 id={titleId} style={{ margin: 0, fontSize: '1.1rem' }}>
            {title}
          </h2>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: tokens.space.lg, lineHeight: 1.5 }}>
          {children}
        </div>

        {footer && (
          <div
            style={{
              display: 'flex',
              gap: tokens.space.sm,
              justifyContent: 'flex-end',
              padding: `${tokens.space.md} ${tokens.space.lg}`,
              borderTop: `1px solid ${tokens.color.border}`,
              background: tokens.color.surfaceSunken,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * What a caller asks for. `notify` is the same shape with no cancel, which is what the 19
 * `alert()` sites need.
 */
export interface ConfirmRequest {
  title: string;
  /**
   * Name the object. "Are you sure?" tells the user nothing they did not already know;
   * "Delete the 06:30 schedule?" lets them notice they clicked the wrong row.
   */
  body?: ComponentChildren;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Marks the confirming action as the irreversible one. */
  destructive?: boolean;
}

interface DialogApi {
  confirm: (request: ConfirmRequest) => Promise<boolean>;
  notify: (request: Omit<ConfirmRequest, 'cancelLabel' | 'destructive'>) => Promise<void>;
}

const DialogContext = createContext<DialogApi | null>(null);

/**
 * Mount once, near the root, beside whatever else wraps the app.
 *
 * One host rather than a dialog per call site, because two confirmations open at once is
 * not a state any of this has an answer for -- and because the promise has to be settled
 * by whichever button is pressed, which needs somewhere outside the caller to live.
 */
export function DialogHost({ children }: { children: ComponentChildren }) {
  const [request, setRequest] = useState<
    (ConfirmRequest & { resolve: (ok: boolean) => void; kind: 'confirm' | 'notify' }) | null
  >(null);

  const confirm = useCallback(
    (r: ConfirmRequest) =>
      new Promise<boolean>((resolve) => setRequest({ ...r, resolve, kind: 'confirm' })),
    []
  );

  const notify = useCallback(
    (r: Omit<ConfirmRequest, 'cancelLabel' | 'destructive'>) =>
      new Promise<void>((resolve) =>
        setRequest({ ...r, resolve: () => resolve(), kind: 'notify' })
      ),
    []
  );

  const settle = useCallback(
    (ok: boolean) => {
      // Read and cleared together, so a second Escape between the resolve and the
      // re-render cannot settle the same promise twice.
      setRequest((current) => {
        current?.resolve(ok);
        return null;
      });
    },
    []
  );

  return (
    <DialogContext.Provider value={{ confirm, notify }}>
      {children}
      {request && (
        <Dialog
          title={request.title}
          onClose={() => settle(false)}
          footer={
            <>
              {request.kind === 'confirm' && (
                <Button variant="secondary" onClick={() => settle(false)}>
                  {request.cancelLabel ?? 'Cancel'}
                </Button>
              )}
              <Button
                variant={request.destructive ? 'destructive' : 'primary'}
                onClick={() => settle(true)}
              >
                {request.confirmLabel ?? (request.kind === 'notify' ? 'OK' : 'Confirm')}
              </Button>
            </>
          }
        >
          {request.body}
        </Dialog>
      )}
    </DialogContext.Provider>
  );
}

/**
 * `confirm` and `notify`, as promises.
 *
 * Throws outside a host rather than falling back to `window.confirm`. A silent fallback
 * would mean the native dialogs come back wherever someone forgets the provider, and
 * they would come back in exactly the situation nobody tests.
 */
export function useDialogs(): DialogApi {
  const api = useContext(DialogContext);
  if (!api) {
    throw new Error('useDialogs() requires a <DialogHost> ancestor');
  }
  return api;
}
