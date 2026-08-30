import type { ComponentChildren } from 'preact';
import { tokens } from '../tokens.js';

/**
 * What a screen is, said once, the same way on every screen.
 *
 * Six pages had six title treatments: one put its title inside a card, one gave its action a
 * filled blue button where the next used a bordered one, one had no subtitle at all. None of
 * those were decisions -- they were what each page happened to grow. The cost is that the
 * largest thing on a page, which is what tells you where you are, was a different size
 * depending on where you were.
 *
 * # The title is the biggest thing on the page
 *
 * `tokens.type.display` here and nowhere in the navigation, which is the other half of the
 * same decision: the nav bar drops to caption size so it stops competing for first read.
 * Rendered as an `<h1>`, because it is the page's heading and a screen reader's document
 * outline is built out of exactly this.
 *
 * # One primary action
 *
 * `primary` is the thing this page is for; `secondary` is the one beside it. The tiers do
 * the ranking, so a page with only a `secondary` is a page with nothing urgent on it rather
 * than a page missing its button. Passing three actions is not possible on purpose -- the
 * third one belongs in a row menu or a section, and every page that grew a third had stopped
 * being about one thing.
 *
 * # Tabs are a slot
 *
 * `tabs` takes rendered children rather than a tab model, so this composes with the existing
 * `Tabs` primitive instead of owning a second implementation of the ARIA pattern, its roving
 * tabindex and its arrow keys.
 */
export interface PageHeaderProps {
  title: string;
  /** A small label above the title -- a roaster's name over a coffee's. */
  eyebrow?: string;
  /** One line saying what this page holds. Counts belong here, not in the title. */
  subtitle?: string;
  /** A line of figures under the subtitle -- "roasted 30 Jun · opened 29 Aug · 250 g". */
  meta?: string;
  /** Quantities and states, as pills. See `Badge`. */
  chips?: ComponentChildren;
  /** The one action this page is for. */
  primary?: ComponentChildren;
  secondary?: ComponentChildren;
  /** Rendered below the header, flush with it. Compose with `Tabs`. */
  tabs?: ComponentChildren;
}

export function PageHeader({
  title,
  eyebrow,
  subtitle,
  meta,
  chips,
  primary,
  secondary,
  tabs,
}: PageHeaderProps) {
  return (
    <header style={{ marginBottom: tokens.space.lg }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          // Wraps rather than crushing the title: on a phone the actions drop below it, which
          // is the one thing that must not squeeze the heading to nothing.
          flexWrap: 'wrap',
          gap: tokens.space.md,
        }}
      >
        <div style={{ minWidth: 0 }}>
          {eyebrow && (
            <div style={{ ...tokens.type.eyebrow, color: tokens.color.inkMuted }}>{eyebrow}</div>
          )}
          <h1
            style={{
              ...tokens.type.display,
              color: tokens.color.ink,
              margin: eyebrow ? `${tokens.space.xs} 0 0` : 0,
              textWrap: 'pretty',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                ...tokens.type.caption,
                color: tokens.color.inkMuted,
                margin: `${tokens.space.xs} 0 0`,
              }}
            >
              {subtitle}
            </p>
          )}
          {meta && (
            <p
              style={{
                ...tokens.type.figure,
                color: tokens.color.inkMuted,
                margin: `${tokens.space.xs} 0 0`,
              }}
            >
              {meta}
            </p>
          )}
          {chips && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: tokens.space.xs,
                marginTop: tokens.space.sm,
              }}
            >
              {chips}
            </div>
          )}
        </div>

        {(primary || secondary) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.sm }}>
            {secondary}
            {primary}
          </div>
        )}
      </div>

      {tabs && <div style={{ marginTop: tokens.space.md }}>{tabs}</div>}
    </header>
  );
}
