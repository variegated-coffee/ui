import { useState } from 'preact/hooks';
import { tokens } from '../tokens.js';
import { Field, TextInput } from './Field.js';
import { Figure } from './Figure.js';

/**
 * A setpoint on a machine that is running, with two ways to change it.
 *
 * # Why this is not `NumberField`
 *
 * They look like the same control and their commit contracts are opposites, which is exactly
 * why both exist and why the difference is written down here rather than discovered later.
 *
 * `NumberField` reports every valid keystroke, because it edits a *form* that is saved as a
 * whole. This one reports on **blur, Enter, or a step button**, because every commit is a
 * command to a machine that heats water: a field that sent on input would send four commands
 * on the way from 9 to 93, one of which sets the boiler to 9 degrees.
 *
 * Reach for `NumberField` inside a configuration form with a Save. Reach for this where the
 * value *is* the control and the machine acts on it immediately.
 *
 * # What it keeps from `NumberField`
 *
 * Both of its hard-won decisions, because both were bugs first:
 *
 * - **Never `type="number"`.** The browser renders and parses that control in the browser's
 *   own locale, so `1.4` shows as `1,4` next to a limit reading `100` and the same firmware
 *   value looks different on two machines in the same kitchen. `TextInput`'s `numeric` gives
 *   `inputMode="decimal"` and tabular figures on a text input instead.
 * - **Never `parseFloat(x) || 0`.** An unparseable entry keeps the last good value rather
 *   than silently substituting zero -- which, on a setpoint, means a typo turning a boiler
 *   off while the field shows `0` as though that had been the intent.
 *
 * # Out of range is refused, not clamped
 *
 * A clamp hides that the entry was wrong: type 130 into a boiler capped at 125 and a
 * clamping field shows 125, which is a number you did not ask for presented as though you
 * had. Here the commit is refused and the box keeps your text, so the mistake stays visible.
 * The step buttons *do* stop at the ends, because a button that walks past a limit and then
 * refuses itself is just a broken button.
 *
 * # Pending is the machine's answer, not ours
 *
 * `pending` renders the value through {@link Figure}, greyed with a spinner, and it is the
 * caller's job to hold it true until the machine's *own* reading comes back. "Sent" is what
 * a resolved request means; "set" is what the next status message means, and only the second
 * one is worth showing as done.
 */
export interface StepperProps {
  value: number;
  /** How much one press of the buttons moves it. */
  step: number;
  min?: number;
  max?: number;
  unit?: string;
  /** How the value is displayed and re-formatted after a commit. */
  decimals?: number;
  /**
   * Called with a value that parsed, sits in range, and differs from the current one.
   *
   * Not called otherwise -- an unchanged commit is not a command worth sending, and a boiler
   * does not need to be told what it is already doing.
   */
  onCommit: (value: number) => void;
  /** Sent, waiting for the machine's own reading. Shows the value greyed with a spinner. */
  pending?: boolean;
  /** Sent to a machine that is not reachable. */
  queued?: boolean;
  disabled?: boolean;
  /** Names the control for a screen reader. The visible label is the caller's. */
  label: string;
}

export function Stepper({
  value,
  step,
  min,
  max,
  unit,
  decimals = 1,
  onCommit,
  pending = false,
  queued = false,
  disabled = false,
  label,
}: StepperProps) {
  const format = (n: number) => n.toFixed(decimals);
  /*
   * The typed text, or `null` when nothing is being typed.
   *
   * Nullable rather than seeded from `value`, and that is what removes the stale-draft
   * problem instead of patching it. The box renders `draft ?? format(value)`, so whenever
   * nobody is typing it shows the machine's own latest answer -- this component outlives the
   * re-read that follows every command, and a draft seeded at mount would overwrite that
   * answer on the next commit. Held as text for as long as focus lasts, because a half-typed
   * `0.` or `-` is not a number and reformatting it into one moves the caret.
   */
  const [draft, setDraft] = useState<string | null>(null);

  /* While a value is unsettled the box is not a box: there is nothing useful to type into
   * until the machine has answered, and a spinner inside an input reads as a stuck field. */
  if (pending || queued) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.sm }}>
        <Figure value={format(value)} unit={unit} pending={pending} queued={queued} />
      </div>
    );
  }

  const commit = (raw: string) => {
    setDraft(null);
    const parsed = Number.parseFloat(raw.trim());
    // Refused rather than coerced. See the header: `|| 0` on a setpoint turns a typo into a
    // command.
    if (!Number.isFinite(parsed)) return;
    if (min !== undefined && parsed < min) return;
    if (max !== undefined && parsed > max) return;
    if (parsed === value) return;
    onCommit(parsed);
  };

  const nudge = (direction: 1 | -1) => {
    // Rounded against the step, not accumulated: 1.20 + 0.05 is 1.2500000000000002 in binary
    // floating point, and a setpoint that drifts a digit per press is a setpoint nobody
    // trusts.
    const raw = value + direction * step;
    const snapped = Math.round(raw / step) * step;
    const bounded = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, snapped));
    const next = Number(bounded.toFixed(decimals));
    if (next === value) return;
    setDraft(null);
    onCommit(next);
  };

  const atMin = min !== undefined && value <= min;
  const atMax = max !== undefined && value >= max;

  /*
   * `Field` with the label hidden, rather than a bare `<input>`.
   *
   * It is what mints the id and the `aria-describedby`/`aria-invalid` wiring that
   * `TextInput` requires, so the control is announced properly without this component
   * reimplementing that. Hidden because a stepper sits under a caller's own heading -- the
   * boiler card says "Target" once, above both of them.
   */
  /*
   * The unit is rendered here, not handed to `Field`.
   *
   * `Field` positions it `absolute; right: sm` against the box holding its children, which is
   * exactly right when that box holds one input and exactly wrong here -- this one holds the
   * input *and* both step buttons, so the unit landed on top of the `+`.
   *
   * It still gets said once to a screen reader, through the accessible label rather than
   * after every keystroke of the value, which is the arrangement `Field` documents.
   */
  return (
    <Field label={unit ? `${label} (${unit})` : label} hideLabel>
      {(control) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.sm }}>
          <TextInput
            {...control}
            numeric
            width="6rem"
            disabled={disabled}
            value={draft ?? format(value)}
            onInput={setDraft}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                // Commit, rather than submitting whatever form this happens to sit in.
                event.preventDefault();
                (event.currentTarget as HTMLInputElement).blur();
              }
              // Up and down are what a keyboard user expects of a stepper; without them the
              // buttons are the only way to step one.
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                nudge(1);
              }
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                nudge(-1);
              }
            }}
          />
          {unit && (
            <span
              aria-hidden="true"
              style={{ ...tokens.type.figure, color: tokens.color.inkMuted }}
            >
              {unit}
            </span>
          )}
          <div style={{ display: 'flex', gap: tokens.space.xs }}>
            <StepButton
              label={`Decrease ${label}`}
              disabled={disabled || atMin}
              onPress={() => nudge(-1)}
            >
              &minus;
            </StepButton>
            <StepButton
              label={`Increase ${label}`}
              disabled={disabled || atMax}
              onPress={() => nudge(1)}
            >
              +
            </StepButton>
          </div>
        </div>
      )}
    </Field>
  );
}

function StepButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onPress}
      style={{
        // A fingertip is about 44px across and a cursor is one pixel. These are pressed
        // repeatedly to walk a setpoint, which is the case where a near miss is worst.
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontFamily: 'inherit',
        cursor: disabled ? 'default' : 'pointer',
        borderRadius: tokens.radius.md,
        border: `1px solid ${tokens.color.hairlineStrong}`,
        background: tokens.color.fill,
        color: disabled ? tokens.color.idle : tokens.color.accentInk,
      }}
    >
      {children}
    </button>
  );
}
