/**
 * The design language of `variegated-comms-rs/frontend` and of the plantlet shot-log,
 * given names.
 *
 * A TypeScript object rather than a stylesheet, because neither consumer has a CSS
 * pipeline at all -- every value in both is an inline style object -- so these drop into
 * them without a build change, where importing a `.css` from a package would be a new
 * pattern for those repositories to absorb.
 *
 * Adopted for consistency and single-point-of-change, **not** to save bytes. That was
 * measured rather than assumed, since the comms frontend is flashed onto the device:
 * across its 1040 inline style objects (only 296 of them distinct), semantic CSS classes
 * cost 744 bytes gzipped and atomic utilities saved 18, against a 53.8 kB bundle. Gzip
 * already performs the deduplication a stylesheet would, because the objects repeat inside
 * its window. A token object is inlined at each use site and compresses exactly as today's
 * literals do.
 *
 * Not runtime-themeable, by choice. A dark mode would turn these into CSS custom
 * properties and change both consumers.
 *
 * Every ratio quoted below was produced by `measure-contrast.mjs` at the repo root, and
 * `test/tokens.test.ts` is what keeps them true.
 */
export const tokens = {
  color: {
    surface: '#f5f5f5',
    surfaceRaised: '#ffffff',
    /**
     * An inset panel *inside* a raised surface -- the box around a PID term, a summary
     * strip at the top of a card. 1.05:1 against `surfaceRaised`: enough to read as a
     * separate plane, not enough to read as a different component.
     */
    surfaceSunken: '#f8f9fa',
    border: '#dddddd',
    ink: '#333333',
    inkMuted: '#666666',

    /*
     * Status roles, each a set of four rather than a single colour.
     *
     * The single colour is what went wrong before: with only `ok`, `info` and `idle`
     * available and nothing paired, every alert in the comms frontend reached past the
     * token layer for the Bootstrap tint it needed -- `#f8d7da`/`#721c24` and their
     * siblings appear inline in 57 places. The four-part shape is what those 57 sites were
     * actually reconstructing by hand:
     *
     *   <role>         a solid, for a fill, a border, a dot, a chart mark. Clears WCAG
     *                  3:1 on `surfaceRaised`, the threshold for a graphical object.
     *   <role>Surface  a tint, for the body of an alert or a row.
     *   <role>Border   the hairline around that tint. Decorative -- it separates the tint
     *                  from the page, and carries no information of its own.
     *   <role>Ink      text, on either that tint or `surfaceRaised`. Clears 4.5:1 on both.
     *
     * Values are the Bootstrap ones already in use, kept wherever they pass and darkened
     * only where they do not, so the port is not also a re-skin. Two did not pass:
     *
     * - `info` was `#007bff`, which is 3.98:1 on white -- fine as a graphical object,
     *   short of the 4.5:1 it needed as the link and button colour it was actually used
     *   for. `#0066cc` is 5.57:1, and was already the majority spelling: 58 uses against
     *   7 for `#007bff`. The more-used value is also the one that passes.
     * - `warn` was `#ffc107`, which is 1.63:1 on white and fails 3:1 by a wide margin --
     *   there is no dark-enough yellow, only a dark amber. `#B07407` is 3.93:1. It is the
     *   same literal as `pen.flowIn` below, and for the same reason rather than by
     *   coincidence: that pen is amber darkened until it cleared exactly this threshold,
     *   and amber has one answer to that question.
     *
     * Nothing here is identified by colour alone, for the reason the pen palette records:
     * four hues that all clear their thresholds cannot also be far apart in luminance.
     * `Alert` pairs every one of these with a word.
     */
    ok: '#28a745', // 3.13:1 on surfaceRaised
    okSurface: '#d4edda',
    okBorder: '#c3e6cb',
    okInk: '#155724', // 6.99:1 on okSurface, 8.68:1 on surfaceRaised

    info: '#0066cc', // 5.57:1 on surfaceRaised
    /**
     * `info` under the pointer, for the one variant that is a filled block of it.
     *
     * The only role that needs a second solid, because it is the only one used as a
     * button fill -- `ok` and `danger` fill a badge, which nothing hovers. 8.42:1 against
     * the white label it carries, against `info`'s own 5.57:1, so the label gets *more*
     * readable on hover rather than less.
     */
    infoStrong: '#004c99',
    infoSurface: '#d1ecf1',
    infoBorder: '#bee5eb',
    infoInk: '#0c5460', // 6.92:1 on infoSurface, 8.56:1 on surfaceRaised

    warn: '#B07407', // 3.93:1 on surfaceRaised
    warnSurface: '#fff3cd',
    warnBorder: '#ffeeba',
    warnInk: '#856404', // 4.96:1 on warnSurface, 5.49:1 on surfaceRaised

    danger: '#dc3545', // 4.53:1 on surfaceRaised
    dangerSurface: '#f8d7da',
    dangerBorder: '#f5c6cb',
    dangerInk: '#721c24', // 8.25:1 on dangerSurface, 11.01:1 on surfaceRaised

    /** Not a status. A control that is off, or a row that is disabled. */
    idle: '#6c757d', // 4.69:1 on surfaceRaised
  },
  space: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  radius: {
    sm: '4px',
    md: '8px',
  },
  font: {
    sans:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, " +
      'Cantarell, sans-serif',
    /**
     * Numeric readouts only, and for a functional reason rather than a stylistic one:
     * scrubbing a chart whose numbers change width as they update is unpleasant to read.
     */
    mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
  },
  /**
   * Trace colours, taking the sketch's hues but not its values.
   *
   * `espresso-shot-log.html` chose them against `#0E1619`, where they are light. Measured
   * against `surfaceRaised`, six of the seven fail WCAG's 3:1 threshold for a graphical
   * object -- the lowest, its weight green `#86D67C`, sits at 1.74:1. Each is darkened
   * here until it clears 3:1, keeping the hue and the mutual separation that made nine
   * simultaneous series readable.
   *
   * Ratios on white: pressure 5.53, flowIn 3.93, flowOut 5.36, weight 5.04,
   * conductivity 5.61, extractionRate 5.31, outputTemperature 4.99, extractedSolids 4.80,
   * pumpDuty 10.35, pumpRpm 5.40, brewBoiler 5.18, steamBoiler 7.10. `flowIn` is the
   * tightest and has the least room to be lightened -- amber is inherently pale.
   * `tokens.test.ts` is what keeps all of them honest.
   *
   * Eleven colours that all clear 3:1 on white cannot also be far apart in luminance, so
   * hue carries most of the separation and several of these are close in greyscale. That
   * is why nothing identifies a pen by colour alone: the legend, the readout and the
   * toggles all pair a swatch with a label.
   *
   * `extractedSolids` and `pumpDuty` are the one pair that was deliberately pushed apart.
   * They are on different charts and never share an axis, but they sit next to each other
   * in the toggle list, and as first drawn they were 0.0009 apart in luminance -- two
   * greys indistinguishable to anyone not seeing colour.
   *
   * `pumpRpm` is the other pair that had to be reasoned about, and a harder case: it is
   * the only pen that shares a *chart* with another, drawn against `pumpDuty` on the Pump
   * effort panel's opposite axis. Their luminance gap is 0.0930 -- a hundred times the
   * figure above -- and the olive was chosen because roughly 70-110 degrees of hue was the
   * one wide gap left in the palette, between amber `flowIn` and green `weight`. It is 18
   * CIEDE2000 from either of those, against a palette whose closest existing pair
   * (`waterIn` and `conductivity`) sits at 6.3.
   */
  pen: {
    pressure: '#C62D22',
    flowIn: '#B07407',
    flowOut: '#0E7490',
    weight: '#3B7D33',
    waterIn: '#1D4ED8',
    outputVolume: '#A21CAF',
    conductivity: '#4C5FC4',
    extractionRate: '#B3407E',
    outputTemperature: '#1D7D6E',
    extractedSolids: '#78716C',
    pumpDuty: '#334155',
    pumpRpm: '#746C00',
    brewBoiler: '#C2410C',
    steamBoiler: '#6D28D9',
  },
  /**
   * Fills for the shot-phase bands the charts shade behind their traces.
   *
   * Deliberately **not** under `pen`, because the rule they answer to is the inverse of a
   * pen's. A pen has to clear 3:1 against the surface to be seen; a band has to stay well
   * under it, or the thirteen traces drawn on top of it stop being readable. Putting them
   * in `pen` would enrol them in a contrast test they are supposed to fail.
   *
   * Note that this is also why the `*Surface` tints above are not held to this rule:
   * nothing is drawn on top of an alert, so the only threshold that matters there is that
   * its own ink stays readable.
   *
   * Hue carries the identity, as with the pens, and the label on each band carries the
   * rest -- at this lightness no two of these are told apart by colour alone.
   *
   * `unknown` is the fallback for a state name this build has never seen. A future format
   * version's phase gets a neutral band rather than none, so it is visible that the
   * machine reported *something*.
   */
  phase: {
    headspaceFill: '#E8EFF6',
    saturation: '#E9F2E7',
    postFirstDrop: '#FAF1E2',
    unknown: '#F0F0F0',
  },
} as const;

/**
 * The four status roles, as a type, so a primitive can accept one without restating them.
 */
export type StatusRole = 'ok' | 'info' | 'warn' | 'danger';

/**
 * The four colours a status role names.
 *
 * Written as a lookup rather than by string-concatenating `${role}Surface` at each call
 * site, so a missing member is a type error rather than an `undefined` that renders as a
 * transparent background.
 */
export const statusColors: Record<
  StatusRole,
  { solid: string; surface: string; border: string; ink: string }
> = {
  ok: {
    solid: tokens.color.ok,
    surface: tokens.color.okSurface,
    border: tokens.color.okBorder,
    ink: tokens.color.okInk,
  },
  info: {
    solid: tokens.color.info,
    surface: tokens.color.infoSurface,
    border: tokens.color.infoBorder,
    ink: tokens.color.infoInk,
  },
  warn: {
    solid: tokens.color.warn,
    surface: tokens.color.warnSurface,
    border: tokens.color.warnBorder,
    ink: tokens.color.warnInk,
  },
  danger: {
    solid: tokens.color.danger,
    surface: tokens.color.dangerSurface,
    border: tokens.color.dangerBorder,
    ink: tokens.color.dangerInk,
  },
};

/**
 * WCAG 2.1 relative contrast between two `#rrggbb` colours.
 *
 * Here so the palette's tuning is a test rather than a claim in a comment: a colour
 * darkened by eye can be checked, and a future edit that lightens one fails.
 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  // Refused rather than guessed. A three-digit shorthand parsed as six would yield a
  // plausible number, which would quietly weaken every threshold measured against it.
  if (!/^[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`expected a #rrggbb colour, got "${hex}"`);
  }
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(value.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
