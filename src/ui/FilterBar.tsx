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
 * # A native select wearing a pill
 *
 * The design this comes from advances to the next option on click, which works for the three
 * it was drawn with and not for the fifty bags a real library has. So each pill is a real
 * `<select>` with its face styled: it opens the platform's own picker, types-to-search,
 * works from a keyboard, and gets the native wheel on a phone -- none of which a hand-rolled
 * menu would have without reimplementing all of it.
 *
 * The `<select>` is transparent and stretched across the pill rather than hidden, so the pill
 * *is* the control. Hiding it and syncing a fake face is how a filter ends up announcing one
 * value and applying another.
 */
export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSpec {
  /** Stable key, used for the change callback. */
  key: string;
  /** What this filters, for a screen reader. The visible text is the current value. */
  label: string;
  /** The options. `unsetLabel` is prepended as the empty-string choice. */
  options: FilterOption[];
  /** The current value, or `''` for unset. */
  value: string;
  /** What the pill reads when nothing is chosen -- "All machines", "Any beans". */
  unsetLabel: string;
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
        const set = filter.value !== '';
        const chosen = filter.options.find((option) => option.value === filter.value);
        return (
          <span
            key={filter.key}
            style={{
              ...pill,
              position: 'relative',
              border: `1px solid ${set ? tokens.color.info : tokens.color.hairline}`,
              color: set ? tokens.color.ink : tokens.color.inkMuted,
              background: tokens.color.surfaceRaised,
            }}
          >
            {/* The face. `aria-hidden` because the select beside it already announces both
                the label and the current value -- without this a screen reader reads the
                value twice. */}
            <span aria-hidden="true">{chosen?.label ?? filter.unsetLabel}</span>
            <span aria-hidden="true" style={{ opacity: 0.5, fontSize: '10px' }}>
              ▼
            </span>
            <select
              aria-label={filter.label}
              value={filter.value}
              onChange={(event) => onChange(filter.key, (event.target as HTMLSelectElement).value)}
              style={{
                // Stretched over the pill and transparent, so the pill is the control rather
                // than a picture of one.
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
                // 16px, or iOS Safari zooms the page in when the picker opens and does not
                // zoom back out.
                fontSize: '16px',
              }}
            >
              <option value="">{filter.unsetLabel}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </span>
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
