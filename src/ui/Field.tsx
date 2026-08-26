import type { ComponentChildren, JSX } from 'preact';
import { useId } from 'preact/hooks';
import { tokens } from '../tokens.js';
import { focusRingStyle, useInteractive } from './useInteractive.js';

/**
 * A labelled control, and the reason the label is not optional.
 *
 * Across the 62 components the audit counted one `htmlFor`. Not one per screen -- one in
 * total. The routine-name input at the top of `RoutineEditor` has a placeholder and
 * nothing else, so a screen reader announces an edit box with no name; twelve near-
 * identical PID inputs per boiler are told apart only by a `<label>` sitting above them
 * with no association to any of them. That is not a styling gap, it is the control being
 * unusable without sight of the layout.
 *
 * So the id is generated here and wired to both ends, and there is no prop that turns the
 * label off. A control that genuinely has no visible label passes `hideLabel`, which moves
 * the text out of view but leaves it attached -- the accessible name survives, which is
 * the part that was missing.
 *
 * Three other things live here because they were being done badly per-screen:
 *
 * - **Help text below the control, never inside the label.** "Upper Limit (empty = no
 *   limit)" wrapped onto two lines and pushed the label away from its own input.
 * - **Units.** Twelve PID fields per boiler and not one said whether it was degrees, bar
 *   or a dimensionless gain. `unit` renders inside the control's trailing edge, so it
 *   reads as part of the value rather than as more label.
 * - **Errors, announced.** `role="alert"` on the message and `aria-invalid` on the
 *   control, so a rejected value is not something you have to be looking at to notice.
 */
export interface FieldProps {
  label: string;
  children: (control: ControlProps) => ComponentChildren;
  /** Guidance. Rendered under the control, in muted ink. */
  help?: string;
  /** A validation failure. Replaces `help` while present, and is announced. */
  error?: string;
  /** °C, bar, g, s -- whatever the firmware is actually parsing. */
  unit?: string;
  /** Keeps the label as the accessible name but takes it out of the layout. */
  hideLabel?: boolean;
  required?: boolean;
}

/**
 * What `Field` hands back to whatever it wraps.
 *
 * A render prop rather than `Field` owning an `<input>`, because the controls that need
 * labelling are not all inputs -- `EntitySelector` is a `<select>`, the curve editors are
 * canvases, and `ParameterValueEditor` is a group of radios. Owning the input would have
 * covered about half of them and left the other half inventing labels again.
 */
export interface ControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': 'true' | undefined;
  required: boolean;
}

export function Field({
  label,
  children,
  help,
  error,
  unit,
  hideLabel = false,
  required = false,
}: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? help;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.xs }}>
      <label
        for={id}
        style={
          hideLabel
            ? // The standard visually-hidden clip. Not `display: none` and not
              // `visibility: hidden`, both of which take the element out of the
              // accessibility tree along with the layout -- which would leave the control
              // exactly as nameless as it was before.
              {
                position: 'absolute',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
                clip: 'rect(0 0 0 0)',
                clipPath: 'inset(50%)',
                whiteSpace: 'nowrap',
              }
            : {
                font: `0.85rem ${tokens.font.sans}`,
                color: tokens.color.inkMuted,
              }
        }
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: tokens.color.danger }}>
            {' '}
            *
          </span>
        )}
      </label>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {children({
          id,
          'aria-describedby': message ? messageId : undefined,
          'aria-invalid': error ? 'true' : undefined,
          required,
        })}
        {unit && (
          // `aria-hidden` because the unit belongs in the label for a screen reader, not
          // read out after every keystroke of the value. Callers put it in `label` too --
          // "Upper limit (°C)" -- and this is the visible half of the same fact.
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: tokens.space.sm,
              font: `0.8rem ${tokens.font.mono}`,
              color: tokens.color.inkMuted,
              pointerEvents: 'none',
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {message && (
        <div
          id={messageId}
          role={error ? 'alert' : undefined}
          style={{
            font: `0.8rem ${tokens.font.sans}`,
            lineHeight: 1.4,
            color: error ? tokens.color.dangerInk : tokens.color.inkMuted,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}

/**
 * The text input `Field` is usually wrapping.
 *
 * Separate from `Field` so the render prop stays the general case, but exported because
 * the alternative is every caller re-deriving the same padding, border and focus ring --
 * which is how there came to be four spellings of an input border (`#ccc`, `#ddd`,
 * `#e0e0e0`, `#dddddd`) across the frontend.
 *
 * `type` deliberately does not accept `"number"`. See `numeric` below.
 */
export interface TextInputProps extends ControlProps {
  value: string;
  onInput: (value: string) => void;
  onBlur?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /**
   * Right-aligned monospace with tabular figures, and `inputMode="decimal"` for a touch
   * keypad -- but still `type="text"`.
   *
   * `type="number"` is what put `1,4` and `0,05` into the PID editor beside limits reading
   * `100` and `0`: the browser renders and parses that control in the *browser's* locale,
   * so the same firmware value displays differently on two machines in the same kitchen.
   * A field whose contents the firmware parses cannot be rendered by something that
   * reformats it. Formatting stays on the display side, where this package can see it.
   */
  numeric?: boolean;
  /**
   * Monospace, without the numeric keypad.
   *
   * For a value that is read character by character but is not a number -- a base64 key
   * being compared against another one. `numeric` would be the wrong tool: it asks a
   * tablet for a decimal keypad, which cannot type a key.
   */
  mono?: boolean;
  /**
   * The input type, for the cases where it changes the browser's behaviour usefully:
   * `password` masks, `url` and `email` pick a keyboard on a tablet.
   *
   * `number` is deliberately not in this union, and that is the whole point of the union
   * existing rather than a free-form `type` prop -- it is what makes the rule above a
   * compile error instead of a convention.
   */
  kind?: 'text' | 'password' | 'url' | 'email';
  /** Turns off the browser's autofill, for a field holding a secret. */
  autoComplete?: string;
  spellcheck?: boolean;
  width?: string;
  /**
   * The id of a `<datalist>` to suggest from.
   *
   * Here because it is the one input attribute this package cannot express any other way:
   * the timezone field suggests from the browser's IANA list, and without a way to pass
   * this through, adopting `TextInput` would silently orphan the datalist and drop the
   * suggestions.
   */
  list?: string;
  maxLength?: number;
}

export function TextInput({
  value,
  onInput,
  onBlur,
  placeholder,
  disabled = false,
  numeric = false,
  mono = false,
  kind = 'text',
  autoComplete,
  spellcheck,
  width,
  list,
  maxLength,
  ...control
}: TextInputProps) {
  const { focusRing, handlers } = useInteractive();

  const style: JSX.CSSProperties = {
    width: width ?? '100%',
    padding: `0.4rem ${tokens.space.sm}`,
    font: numeric || mono ? `0.9rem ${tokens.font.mono}` : `0.9rem ${tokens.font.sans}`,
    fontVariantNumeric: numeric ? 'tabular-nums' : undefined,
    color: tokens.color.ink,
    background: disabled ? tokens.color.surface : tokens.color.surfaceRaised,
    border: `1px solid ${control['aria-invalid'] ? tokens.color.danger : tokens.color.border}`,
    borderRadius: tokens.radius.sm,
    cursor: disabled ? 'not-allowed' : 'text',
    ...(focusRing ? focusRingStyle(tokens.color.info) : {}),
  };

  return (
    <input
      {...control}
      type={kind}
      inputMode={numeric ? 'decimal' : undefined}
      value={value}
      placeholder={placeholder}
      list={list}
      maxLength={maxLength}
      autoComplete={autoComplete}
      spellcheck={spellcheck}
      disabled={disabled}
      style={style}
      onInput={(e) => onInput(e.currentTarget.value)}
      {...handlers}
      onBlur={(e) => {
        handlers.onBlur();
        onBlur?.(e.currentTarget.value);
      }}
    />
  );
}
