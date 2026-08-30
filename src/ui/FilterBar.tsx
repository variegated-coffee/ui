import { tokens } from '../tokens.js';

/**
 * The filters on a list, as the sentence they answer.
 *
 * Replaces a card of five labelled inputs. The old shape was 200px tall before the first row
 * of data, which is a filter row nobody scrolls past -- and it spent all of that height
 * saying "From", "To", "Machine", "Routine", "Beans" whether or not any of them was set.
 *
 * # A pill states its current value, not its name
 *
 * "All machines" rather than "Machine: Any". The label *is* the value, so an unset filter
 * reads as a plain statement about what you are looking at and a set one reads as a
 * narrowing. That is also what lets the row be scanned rather than read: the difference
 * between set and unset is a word, so you can see the whole query at a glance.
 *
 * Set pills additionally take an accent edge and ink text. Never colour alone -- the value
 * itself has changed, which is the real signal; the edge is what makes it findable among
 * five.
 *
 * # It cycles rather than opening a menu
 *
 * Each pill advances to the next option on click, which is right for two or three options
 * and wrong for fifty. A filter with a long list wants a picker, and a caller with one
 * should reach for `EntityPicker` instead of passing forty options here.
 */
export interface FilterSpec {
  /** Stable key, used for the change callback. */
  key: string;
  /** The options in cycle order. The first is the unset state. */
  options: string[];
  /** The current value. Must be one of `options`. */
  value: string;
}

export interface ToggleSpec {
  key: string;
  label: string;
  on: boolean;
}

export interface FilterBarProps {
  filters: FilterSpec[];
  /** Binary narrowings -- "Utility shots". Rendered to the right of the filters. */
  toggles?: ToggleSpec[];
  onChange: (key: string, value: string) => void;
  onToggle?: (key: string, on: boolean) => void;
  /** Announced to a screen reader, since a row of pills does not say what it filters. */
  label?: string;
}

export function FilterBar({ filters, toggles, onChange, onToggle, label }: FilterBarProps) {
  return (
    <div
      role="group"
      aria-label={label ?? 'Filters'}
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: tokens.space.sm,
      }}
    >
      {filters.map((filter) => {
        const set = filter.value !== filter.options[0];
        return (
          <button
            key={filter.key}
            type="button"
            onClick={() => {
              const at = filter.options.indexOf(filter.value);
              onChange(filter.key, filter.options[(at + 1) % filter.options.length]!);
            }}
            style={{
              ...pill,
              border: `1px solid ${set ? tokens.color.info : tokens.color.hairline}`,
              color: set ? tokens.color.ink : tokens.color.inkMuted,
              background: tokens.color.surfaceRaised,
            }}
          >
            {filter.value}
          </button>
        );
      })}

      {toggles && toggles.length > 0 && (
        <>
          {/* Pushes the toggles to the far end: they narrow what is *included*, where the
              filters narrow what is *matched*, and mixing the two reads as six filters. */}
          <div style={{ flex: 1 }} />
          {toggles.map((toggle) => (
            <button
              key={toggle.key}
              type="button"
              aria-pressed={toggle.on}
              onClick={() => onToggle?.(toggle.key, !toggle.on)}
              style={{
                ...pill,
                border: `1px solid ${toggle.on ? tokens.color.info : tokens.color.hairline}`,
                background: toggle.on ? tokens.color.info : tokens.color.surfaceRaised,
                color: toggle.on ? tokens.color.onFill : tokens.color.inkMuted,
              }}
            >
              {toggle.label}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

const pill = {
  ...tokens.type.caption,
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  gap: tokens.space.xs,
  padding: `${tokens.space.xs} ${tokens.space.md}`,
  /*
   * 44px, which is taller than the refinement drew these.
   *
   * A fingertip is about 44px across and a cursor is one pixel; the rest of this codebase
   * already settled on that number and a near miss here sets the *wrong* filter rather than
   * doing nothing, which is worse than a miss on an ordinary button. Shrinking the pills to
   * the drawn 31px would take back 13px of a row that was 200px too tall, so almost the whole
   * saving survives keeping them reachable.
   */
  minHeight: '44px',
  borderRadius: tokens.radius.pill,
  cursor: 'pointer',
} as const;
