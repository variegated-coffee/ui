import type { ComponentChildren } from 'preact';
import { useId, useRef } from 'preact/hooks';
import { Badge } from './Badge';
import { tokens } from '../tokens';
import { focusRingStyle, useInteractive } from './useInteractive';

/**
 * A tab strip that can be driven from a keyboard.
 *
 * Both tab strips in the machine frontend were a row of `<button>`s with click handlers,
 * which is not a tab strip in any sense a keyboard or a screen reader can use: every tab
 * is its own tab stop, nothing announces which is selected, nothing announces that they
 * are alternatives, and the arrow keys do nothing. The audit's finding 03 names the
 * routine editor's; `RoutineBuilder` has a second one built the same way.
 *
 * What the ARIA tabs pattern actually requires, and what this implements:
 *
 * - `role="tablist"` / `role="tab"` / `role="tabpanel"`, wired together by id.
 * - **A roving tabindex**: the strip is *one* tab stop. Tab moves past the whole strip
 *   rather than through it, which is the point -- four tabs should not cost four
 *   keystrokes to skip.
 * - **Arrow keys move between tabs**, with Home and End for the ends, wrapping at both.
 * - Automatic activation: moving selects. That is the correct variant when every panel is
 *   already mounted, as they are here -- there is nothing to load, so making the user
 *   press Enter as well would be ceremony.
 */
export interface TabDefinition<Id extends string> {
  id: Id;
  label: string;
  /** A count, rendered as a badge. `2/8` reads fine here; pass it pre-formatted. */
  badge?: string | number;
}

export interface TabsProps<Id extends string> {
  /** Names the strip for a screen reader -- "Routine sections", not "Tabs". */
  label: string;
  tabs: TabDefinition<Id>[];
  active: Id;
  onChange: (id: Id) => void;
  children: ComponentChildren;
}

export function Tabs<Id extends string>({
  label,
  tabs,
  active,
  onChange,
  children,
}: TabsProps<Id>) {
  const baseId = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (delta === 0 && e.key !== 'Home' && e.key !== 'End') return;

    e.preventDefault();
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? tabs.length - 1
          : (index + delta + tabs.length) % tabs.length;

    const target = tabs[next];
    if (!target) return;
    onChange(target.id);
    refs.current[target.id]?.focus();
  };

  return (
    <>
      <div
        role="tablist"
        aria-label={label}
        style={{
          display: 'flex',
          borderBottom: `1px solid ${tokens.color.border}`,
          backgroundColor: tokens.color.surfaceSunken,
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={tab.id}
            innerRef={(node) => {
              refs.current[tab.id] = node;
            }}
            id={`${baseId}-tab-${tab.id}`}
            panelId={`${baseId}-panel-${tab.id}`}
            label={tab.label}
            badge={tab.badge}
            selected={active === tab.id}
            onSelect={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
          />
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-${active}`}
        aria-labelledby={`${baseId}-tab-${active}`}
        style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
      >
        {children}
      </div>
    </>
  );
}

/**
 * One tab.
 *
 * Its own component because it needs a ref and hover/focus state, and hooks cannot be
 * called from inside the parent's `map`.
 */
function Tab({
  innerRef,
  id,
  panelId,
  label,
  badge,
  selected,
  onSelect,
  onKeyDown,
}: {
  innerRef: (node: HTMLButtonElement | null) => void;
  id: string;
  panelId: string;
  label: string;
  badge?: string | number;
  selected: boolean;
  onSelect: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
}) {
  const { hovered, focusRing, handlers } = useInteractive();

  return (
    <button
      ref={innerRef}
      id={id}
      role="tab"
      type="button"
      aria-selected={selected}
      aria-controls={panelId}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: tokens.space.sm,
        padding: `${tokens.space.sm} ${tokens.space.md}`,
        background: selected
          ? tokens.color.surfaceRaised
          : hovered
            ? tokens.color.surface
            : 'transparent',
        border: 'none',
        // The selected tab is marked by an underline *and* by its weight and background,
        // never by colour alone.
        borderBottom: `3px solid ${selected ? tokens.color.info : 'transparent'}`,
        cursor: 'pointer',
        font: `0.95rem ${tokens.font.sans}`,
        fontWeight: selected ? 500 : 400,
        color: tokens.color.ink,
        whiteSpace: 'nowrap',
        ...(focusRing ? focusRingStyle(tokens.color.info) : {}),
      }}
      {...handlers}
    >
      {label}
      {badge !== undefined && <Badge numeric>{badge}</Badge>}
    </button>
  );
}
