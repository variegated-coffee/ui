import type { JSX } from 'preact';
import { tokens } from '../tokens.js';
import type { ControlProps } from './Field.js';
import { focusRingStyle, useInteractive } from './useInteractive.js';

/**
 * A `<select>` with the design system's border, radius and focus ring.
 *
 * Native, not a custom listbox. A menu built out of divs has to reimplement type-ahead,
 * arrow keys, the mobile picker and the screen-reader semantics, and every one of those
 * already works here. What was missing was never the behaviour -- it was the label
 * association and a consistent border, which is what `Field` and this supply.
 *
 * Meant to be used inside `Field`, which passes it the `id` its label points at:
 *
 *     <Field label="Command type">
 *       {(control) => <Select {...control} value={type} onChange={setType} options={...} />}
 *     </Field>
 */
export interface SelectOption {
  value: string;
  label: string;
  /** Options are grouped under this heading when set. */
  group?: string;
}

export interface SelectProps extends ControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  width?: string;
}

export function Select({
  value,
  onChange,
  options,
  disabled = false,
  width,
  ...control
}: SelectProps) {
  const { focusRing, handlers } = useInteractive();

  // Grouped in source order, so an author controls where the headings fall by ordering the
  // array -- rather than by the accident of which group each option's key hashes near.
  const groups: { name: string | undefined; options: SelectOption[] }[] = [];
  for (const option of options) {
    const last = groups[groups.length - 1];
    if (last && last.name === option.group) {
      last.options.push(option);
    } else {
      groups.push({ name: option.group, options: [option] });
    }
  }

  const style: JSX.CSSProperties = {
    width: width ?? '100%',
    padding: `0.4rem ${tokens.space.sm}`,
    font: `0.9rem ${tokens.font.sans}`,
    color: tokens.color.ink,
    background: disabled ? tokens.color.surface : tokens.color.surfaceRaised,
    border: `1px solid ${control['aria-invalid'] ? tokens.color.danger : tokens.color.border}`,
    borderRadius: tokens.radius.sm,
    cursor: disabled ? 'not-allowed' : 'pointer',
    ...(focusRing ? focusRingStyle(tokens.color.info) : {}),
  };

  return (
    <select
      {...control}
      value={value}
      disabled={disabled}
      style={style}
      onChange={(e) => onChange(e.currentTarget.value)}
      {...handlers}
    >
      {groups.map((group, i) =>
        group.name === undefined ? (
          group.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        ) : (
          <optgroup key={`${group.name}-${i}`} label={group.name}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        )
      )}
    </select>
  );
}
