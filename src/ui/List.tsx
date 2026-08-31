import { createContext, type ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';
import { tokens } from '../tokens.js';

/**
 * The grid the rows of one list share.
 *
 * Context rather than a prop repeated on every row, because a row restating the template is
 * a row that can disagree with its list -- and that failure renders as a subtly broken
 * layout rather than as an error.
 */
const ListContext = createContext<{ columns: string; dense: boolean }>({
  columns: '1fr',
  dense: false,
});

/**
 * A list of things, sharing one outline.
 *
 * Replaces three shapes that were doing the same job differently: the shot table, the
 * "things you own" tables, and the hand-rolled rows on the routine pages. The visible
 * difference is the borders -- every row used to be its own box with its own `1px #dddddd`,
 * so a list of eight read as eight cards rather than as one list.
 *
 * # One outline, hairlines inside
 *
 * The list draws a single border and the rows are divided by `hairline` at 0.5px. That is
 * the whole "grouping, not boxing" decision, and it is why `tokens.color.hairline` exists
 * separately from `border`.
 *
 * # Columns are the caller's
 *
 * `columns` is a grid template, because the alignment of a figure column is a property of
 * the list rather than of a row -- rows deciding their own widths is exactly how a column of
 * durations stops lining up. Header labels are set in `eyebrow`, which is what makes them
 * read as labels rather than as a first row of data.
 */
export interface ListProps {
  /** A CSS grid template. Every row in the list is laid out on it. */
  columns: string;
  /** Column labels, in order. Set in `eyebrow`; omit for a list that needs no header. */
  header?: string[];
  /**
   * Per-column alignment for the header labels, in the same order.
   *
   * A label has to sit over its column: `TIME` left-aligned above right-aligned durations
   * reads as a different column from the one it names. Defaults to all-left, which is what
   * a list of prose columns wants.
   */
  headerAlign?: ('left' | 'right')[];
  /** Single-line rows rather than two-line. See `tokens.layout`. */
  dense?: boolean;
  children: ComponentChildren;
  /** Announced to a screen reader, since the outline alone does not say what this is. */
  label?: string;
}

export function List({
  columns,
  header,
  headerAlign,
  dense = false,
  children,
  label,
}: ListProps) {
  return (
    <div
      role="list"
      aria-label={label}
      style={{
        background: tokens.color.surfaceRaised,
        border: `1px solid ${tokens.color.hairline}`,
        borderRadius: tokens.radius.lg,
        overflow: 'hidden',
      }}
    >
      {header && (
        <div
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: columns,
            // Wider than `sm`, because a right-aligned figure column sits hard against the
            // left-aligned label of the next one -- `DOSE` and `TASTE` ended up touching.
            gap: tokens.space.md,
            alignItems: 'center',
            padding: `${tokens.space.sm} ${tokens.space.md}`,
            background: tokens.color.fill,
            borderBottom: `0.5px solid ${tokens.color.hairline}`,
            ...tokens.type.eyebrow,
            color: tokens.color.inkMuted,
          }}
        >
          {header.map((cell, index) => (
            <span
              key={cell || index}
              // A blank label is a column that needs no name -- the menu column. Still
              // rendered, so the grid keeps its shape.
              style={{ minWidth: 0, textAlign: headerAlign?.[index] ?? 'left' }}
            >
              {cell}
            </span>
          ))}
        </div>
      )}
      <ListContext.Provider value={{ columns, dense }}>{children}</ListContext.Provider>
    </div>
  );
}

/**
 * One thing in a list.
 *
 * # Why the link is an overlay
 *
 * The refinement asks for two things that are in direct tension: the row is a link, and the
 * row's actions collapse into a menu on the row. A `<button>` inside an `<a>` is invalid
 * HTML -- browsers reparent it, and what a screen reader announces stops matching what is on
 * screen.
 *
 * So the anchor is a transparent overlay across the row, and anything interactive is lifted
 * above it. That keeps the whole row clickable, keeps the menu a real button, and keeps both
 * of them reachable in the tab order in the order they appear.
 *
 * The cost is that dragging across a row selects nothing, because the pointer is on the
 * anchor rather than on the text. That is a genuine loss and it is the smaller of the two:
 * the alternative is either invalid markup or a row where only the title is clickable, and
 * the title is not where the pointer goes.
 */
export interface ListRowProps {
  /** A swatch, an avatar, a day-over-time stamp. */
  leading?: ComponentChildren;
  /** The thing the row is about. Also the link's accessible name. */
  title: ComponentChildren;
  /** Read together with the title, never sorted apart from it. */
  subtitle?: ComponentChildren;
  /** Right-aligned columns of measured values. Compose with `Figure`. */
  figures?: ComponentChildren[];
  /** A verdict pill, a state. Not interactive. */
  trailing?: ComponentChildren;
  /** The row's actions. Compose with a menu; rendered above the row link. */
  menu?: ComponentChildren;
  /** Makes the whole row a link. */
  href?: string;
  /** Required when `href` is set and `title` is not a plain string. */
  linkLabel?: string;
  /**
   * Handles activation of the row link, for an app with client-side routing.
   *
   * The `href` stays real regardless, so middle-click, open-in-new-tab and the status-bar
   * preview keep working -- this is only for the plain left click. Call `preventDefault`
   * yourself; the row does not, because whether a click should navigate in-page is the
   * application's question rather than the list's.
   */
  onClick?: (event: MouseEvent) => void;
  /**
   * A tint across the whole row, for a kind of row rather than a state of one.
   *
   * Never the only signal. Every consumer of this pairs it with a word in the row, for the
   * reason the pen palette gives: colours that all clear their contrast thresholds cannot
   * also be far apart in luminance.
   */
  background?: string;
}

export function ListRow({
  leading,
  title,
  subtitle,
  figures,
  trailing,
  menu,
  href,
  linkLabel,
  onClick,
  background,
}: ListRowProps) {
  const { columns, dense } = useContext(ListContext);

  return (
    <div
      role="listitem"
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: columns,
        // Matches the header's, or the labels stop sitting over their columns.
        gap: tokens.space.md,
        alignItems: 'center',
        padding: `${tokens.space.sm} ${tokens.space.md}`,
        minHeight: dense ? tokens.layout.rowMin : tokens.layout.rowMinTwoLine,
        borderBottom: `0.5px solid ${tokens.color.hairline}`,
        background,
      }}
    >
      {href && (
        <a
          href={href}
          aria-label={linkLabel ?? (typeof title === 'string' ? title : undefined)}
          onClick={onClick}
          style={{
            position: 'absolute',
            inset: 0,
            // Below anything interactive in the row, so the menu button wins the pointer.
            zIndex: 0,
          }}
        />
      )}

      {leading !== undefined && <div style={{ minWidth: 0 }}>{leading}</div>}

      <div style={{ minWidth: 0 }}>
        <div style={{ ...tokens.type.row, color: tokens.color.ink }}>{title}</div>
        {subtitle && (
          <div
            style={{
              ...tokens.type.caption,
              color: tokens.color.inkMuted,
              marginTop: '2px',
              // Two lines per row is the budget; a long bean name truncates rather than
              // pushing every other row out of alignment.
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/*
       * The cell places its content and does not align it.
       *
       * Alignment is a property of the *column*, and the column is the caller's -- it wrote
       * the grid template. Forcing `flex-end` here meant a machine name and a duration had to
       * share one answer, so a left-aligned label ended up hard against the numbers. A figure
       * that wants to be right-aligned says so with `Figure align="right"`, which fills the
       * cell to do it.
       */}
      {figures?.map((figure, index) => (
        <div key={index} style={{ display: 'flex', minWidth: 0 }}>
          {figure}
        </div>
      ))}

      {trailing !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{trailing}</div>
      )}

      {menu !== undefined && (
        // Lifted above the row link. Without this the anchor swallows the click and the menu
        // never opens -- which is the failure the overlay pattern is prone to.
        <div style={{ position: 'relative', zIndex: 1, justifySelf: 'end' }}>{menu}</div>
      )}
    </div>
  );
}
