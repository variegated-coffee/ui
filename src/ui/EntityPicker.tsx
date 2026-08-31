import { useEffect, useRef, useState } from 'preact/hooks';
import { tokens } from '../tokens.js';

/**
 * Which machine you are looking at, answered the same way everywhere.
 *
 * The machines page stacked every machine as a card with nine buttons each, the routines
 * page used per-machine tabs, and the schedules page used a select. Three answers to one
 * question, and only the tabs scaled past about three machines.
 *
 * One picker in the header instead: the page is about one machine at a time, and switching
 * is a navigation rather than a filter.
 *
 * # It shows a stat per entity, and that is what makes it a picker rather than a select
 *
 * `renderStat` puts a line of live figures under each name -- `93.0 °C · 1.20 bar · on`, or
 * `never reported`. A native `<select>` cannot, and that line is most of why you open this:
 * you are usually checking on a machine rather than choosing one blind.
 *
 * # Unreachable entities stay selectable
 *
 * A machine that has never reported is shown muted with its stat saying so, not disabled.
 * You may well want to look at it -- to see its settings, or to find out why -- and a
 * disabled row answers a question nobody asked.
 */
export interface PickerEntity {
  id: string;
  name: string;
  /** Muted, and its stat is what says why. Never removed from the list. */
  unavailable?: boolean;
}

export interface EntityPickerProps<T extends PickerEntity> {
  entities: T[];
  selected: string;
  onSelect: (id: string) => void;
  /** A line of figures under the name. Keep it to one line. */
  renderStat?: (entity: T) => string;
  /** What this picks, for a screen reader -- "Machine". Also the label on the button. */
  label: string;
}

export function EntityPicker<T extends PickerEntity>({
  entities,
  selected,
  onSelect,
  renderStat,
  label,
}: EntityPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const current = entities.find((entity) => entity.id === selected) ?? entities[0];

  /*
   * Dismissal, deliberately not the native `popover` attribute.
   *
   * Where `popover` is unsupported the attribute is ignored and the panel renders inline,
   * mid-page -- a worse failure than the two listeners it saves. The same reasoning the pen
   * menu records at length.
   */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      // Escape should leave the keyboard where it started, not at the top of the document.
      trigger.current?.focus();
    };
    // `pointerdown` rather than `click`, so the panel closes as the gesture begins and a drag
    // that starts outside it to scroll the page dismisses it too.
    const onPointerDown = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  if (!current) return null;

  return (
    <div ref={root} style={{ position: 'relative' }}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.space.sm,
          minHeight: '44px',
          padding: `${tokens.space.xs} ${tokens.space.sm}`,
          fontFamily: 'inherit',
          cursor: 'pointer',
          background: tokens.color.surfaceRaised,
          border: `1px solid ${open ? tokens.color.info : tokens.color.hairlineStrong}`,
          borderRadius: tokens.radius.md,
        }}
      >
        <span style={{ ...tokens.type.caption, color: tokens.color.inkMuted }}>{label}</span>
        <span style={{ ...tokens.type.row, color: tokens.color.ink }}>{current.name}</span>
        <span aria-hidden="true" style={{ fontSize: '10px', color: tokens.color.inkMuted }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          style={{
            position: 'absolute',
            top: '100%',
            // Anchored right: this sits at the right of a header, and a left-anchored panel
            // would hang off the screen on a phone.
            right: 0,
            marginTop: tokens.space.xs,
            width: 'max(288px, 100%)',
            maxWidth: `calc(100vw - ${tokens.space.xl})`,
            zIndex: 10,
            background: tokens.color.surfaceRaised,
            border: `1px solid ${tokens.color.hairline}`,
            borderRadius: tokens.radius.lg,
            boxShadow: '0 14px 34px rgba(0, 0, 0, 0.16)',
            overflow: 'hidden',
          }}
        >
          {entities.map((entity) => {
            const isCurrent = entity.id === current.id;
            return (
              <button
                key={entity.id}
                type="button"
                role="option"
                aria-selected={isCurrent}
                onClick={() => {
                  onSelect(entity.id);
                  setOpen(false);
                  trigger.current?.focus();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.space.sm,
                  width: '100%',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  minHeight: '58px',
                  padding: tokens.space.sm,
                  cursor: 'pointer',
                  border: 'none',
                  borderBottom: `0.5px solid ${tokens.color.hairline}`,
                  background: isCurrent ? tokens.color.infoSurface : tokens.color.surfaceRaised,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: '22px',
                    height: '22px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: tokens.radius.pill,
                    fontSize: '12px',
                    color: tokens.color.onFill,
                    background: isCurrent ? tokens.color.info : 'transparent',
                    border: isCurrent ? 'none' : `1px solid ${tokens.color.hairline}`,
                  }}
                >
                  {isCurrent ? '✓' : ''}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      ...tokens.type.row,
                      display: 'block',
                      color: entity.unavailable ? tokens.color.inkMuted : tokens.color.ink,
                    }}
                  >
                    {entity.name}
                  </span>
                  {renderStat && (
                    <span
                      style={{
                        ...tokens.type.figure,
                        display: 'block',
                        color: tokens.color.inkMuted,
                        marginTop: '2px',
                      }}
                    >
                      {renderStat(entity)}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
