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
 * Still not runtime-themeable, and still for the same reason: making these CSS custom
 * properties would change both consumers, neither of which has a stylesheet to put them in.
 * A dark scheme is therefore a second set of values under `darkColor` / `darkPen` /
 * `darkPhase` rather than a theming mechanism -- `themeFor()` picks between them, and a
 * consumer that never calls it renders exactly as it did before. `tokens.color` and its
 * siblings are the light scheme and are unchanged.
 *
 * Every ratio quoted below was produced by `measure-contrast.mjs` at the repo root, and
 * `test/tokens.test.ts` is what keeps them true.
 */
/*
 * The two stacks, hoisted out of `tokens.font` so `tokens.type` below can name them.
 *
 * An object literal cannot refer to itself while it is being built, and every type role
 * carries a family -- so either these are consts or each role restates the stack.
 */
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, " +
  'Cantarell, sans-serif';
const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace";

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

    /*
     * Two roles that light mode does not need to name, because in light they are values it
     * already has. They exist so the sites that use them can be written once and be correct
     * in both schemes -- see `darkColor` for what each becomes.
     */

    /**
     * `info` as *text* -- a link, a glyph, an accent label -- rather than as a fill.
     *
     * One blue does both jobs in light. It cannot in dark, where a fill has to stay dark
     * enough for a white label while text has to be lighter than the surface behind it.
     */
    accentInk: '#0066cc', // identical to `info` here, by design

    /**
     * The label on a filled accent or status block.
     *
     * White in *both* schemes, which is why it is not `surfaceRaised`. Reaching for the
     * surface token here is the mistake that makes an inverted palette look right until a
     * filled button turns up: the surface flips to dark and takes the label with it.
     */
    onFill: '#ffffff',

    /**
     * The label on a block filled with `ink`.
     *
     * Unlike `onFill` this one *does* flip, and that is the whole reason it is a token
     * rather than another `#ffffff`. `ink` is near-black in light and near-white in dark,
     * so a label on it has to go the other way in each -- writing white here and reusing it
     * in dark would put white text on a `#ebe8e2` block.
     */
    onInk: '#ffffff',

    /*
     * Grouping lines, as distinct from edges.
     *
     * `border` is a solid `#dddddd` and is the single heaviest thing about the current
     * screens: a card, an input, a table cell and a button all draw the same 1px, so twelve
     * nested boxes shout equally and nothing reads as more clickable than anything else.
     *
     * The split is by job, not by weight:
     *
     *   hairline        divides rows *inside* one outline. Drawn at 0.5px, so grouped rows
     *                   share a single edge instead of each being boxed one by one.
     *   hairlineStrong  the edge of something you can click -- a bordered button, a picker.
     *
     * Ink at low alpha rather than a grey literal, because a grey is only correct over the
     * one surface it was picked against. These composite correctly on a status tint too,
     * which `#dddddd` does not.
     */
    hairline: 'rgba(60, 60, 67, 0.13)',
    hairlineStrong: 'rgba(60, 60, 67, 0.22)',

    /**
     * A track, a meter groove, a hover state.
     *
     * `surfaceSunken` was doing this job and is the wrong shape for it: it is opaque
     * `#f8f9fa`, so a groove drawn on a status tint punches a white hole in it. Alpha
     * composites where an opaque value covers.
     */
    fill: 'rgba(60, 60, 67, 0.055)',
  },
  /*
   * The refinement asked for `xxs: 4px` and `xxl: 32px` here. Both already exist: `xs` is
   * 0.25rem and `xl` is 2rem, which are those two sizes written in the unit this scale uses.
   *
   * Adding them would have given every row-internal gap and every page gutter two spellings,
   * and adding them *in px* would additionally have dropped the rem scaling -- these track
   * the reader's browser font size, and a hard 4px does not.
   */
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
    /** Cards. `sm`/`md` stop at 8px, which reads as a box rather than a card. */
    lg: '14px',
    /** Chips and pills. Large enough to always be a full semicircle at any row height. */
    pill: '999px',
  },
  font: {
    sans: SANS,
    /**
     * Numeric readouts only, and for a functional reason rather than a stylistic one:
     * scrubbing a chart whose numbers change width as they update is unpleasant to read.
     */
    mono: MONO,
  },

  /**
   * The eight things text is on these screens, named.
   *
   * Seven sizes were already in use across both frontends with no name, so every component
   * hard-coded its own and no two pages agreed. Naming them is what makes the density a
   * system decision rather than a per-page one.
   *
   * Two roles carry keys the other six do not, and both are functional rather than
   * decorative:
   *
   * - `reading` and `figure` set `variantNumeric: 'tabular-nums'`, for the reason
   *   `font.mono` exists at all -- a value whose digits change width while it updates is
   *   unpleasant to read, and a column of them stops lining up at the decimal point.
   * - `eyebrow` sets `textTransform`, because it is a label rather than a sentence and is
   *   the one role whose casing is part of its identity.
   *
   * The keys are **CSS property names**, so a role spreads straight into a style object:
   *
   *   <div style={{ ...tokens.type.reading, color: tokens.color.ink }}>
   *
   * The refinement specified them as `{size, weight, lineHeight, letterSpacing, family}`.
   * Renamed deliberately: everything in both frontends is an inline style object, and
   * `style={{ ...role }}` with a key called `size` is a silent no-op -- it sets nothing and
   * reports nothing. A shape that cannot be spread would be a shape nobody here can use.
   */
  type: {
    /** A page title. The largest thing on any screen, and what says where you are. */
    display: {
      fontSize: '30px',
      fontWeight: 600,
      lineHeight: 1.16,
      letterSpacing: '-0.85px',
      fontFamily: SANS,
    },
    /** A card or section title. */
    title: {
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.4px',
      fontFamily: SANS,
    },
    /** The first line of a list row -- the thing the row is about. */
    row: {
      fontSize: '15px',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.2px',
      fontFamily: SANS,
    },
    /** Prose. */
    body: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: 'normal',
      fontFamily: SANS,
    },
    /** A subtitle, a second line, an explanation under a heading. */
    caption: {
      fontSize: '13px',
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: 'normal',
      fontFamily: SANS,
    },
    /** A small capitalised label over a group. Mono, so it reads as a label, not a word. */
    eyebrow: {
      fontSize: '11px',
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: '0.13em',
      fontFamily: MONO,
      textTransform: 'uppercase',
    },
    /** A headline measurement -- a boiler's current temperature. */
    reading: {
      fontSize: '30px',
      fontWeight: 400,
      lineHeight: '32px',
      letterSpacing: '-1px',
      fontFamily: MONO,
      fontVariantNumeric: 'tabular-nums',
    },
    /** A measurement in a row or a metadata line. */
    figure: {
      fontSize: '13px',
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: 'normal',
      fontFamily: MONO,
      fontVariantNumeric: 'tabular-nums',
    },
  },

  /**
   * Density, as numbers rather than as a habit.
   *
   * Leaving these per-page is why no two current pages agree on them: the shot table
   * stretches to the window, so at 2200px the beans column ends up 900px from the duration
   * it belongs to, and nothing tells the eye which row it is on.
   *
   * Numbers, not CSS strings, because several of these are arithmetic -- a row's height
   * decides how many fit above the fold, and a gutter is subtracted from a width.
   */
  layout: {
    /** Past this, a row is wider than the eye can track across. */
    contentMax: 1120,
    gutter: 32,
    /** A single-line row. Comfortably past the 44px a fingertip needs. */
    rowMin: 52,
    /** A row with a title over a subtitle. */
    rowMinTwoLine: 66,
    /** The navigation bar. Chrome, so it is fixed and it is not tall. */
    barHeight: 52,
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

  /**
   * The dark scheme's surfaces, ink and status roles.
   *
   * Four rules, and they are worth stating because the values look arbitrary otherwise:
   *
   * 1. **Warm neutrals, not blue-black.** The light palette is warm -- `#f5f5f5` paper.
   *    Inverting to a cool grey would make the two schemes look like different products,
   *    so these carry the same slight warmth.
   * 2. **Three surfaces, same order.** Sunken sits below raised sits below the page, in
   *    dark as in light. Nothing inverts its stacking, which is what keeps a card legible
   *    as a card without leaning on shadows.
   * 3. **A status role is still four values, not a colour.** Each role's tint and hairline
   *    drop to roughly 8% lightness and its ink rises until it clears 4.5:1 on both that
   *    tint and the raised surface -- the same contract the light roles hold, so no
   *    component logic changes.
   * 4. **The accent splits in two.** `info` is the fill and `accentInk` is the text, which
   *    in light are the same literal and here are not.
   *
   * `infoStrong` is the one value the iOS design this palette came from could not settle,
   * because a phone has no hover. The invariant the light palette actually states is that
   * the *label* gets more readable on hover, not that the fill gets lighter -- so this
   * deepens, as light does. There is no room to go the other way: `info` already sits at
   * 4.63:1 against the white label it carries, and any lightening drops it below 4.5.
   */
  darkColor: {
    surface: '#191817',
    surfaceRaised: '#232120',
    surfaceSunken: '#121110',
    border: '#3a3733',
    ink: '#ebe8e2', // 13.11:1 on surfaceRaised, 15.42:1 on surfaceSunken
    inkMuted: '#a29d93', // 5.94:1 on surfaceRaised, 6.99:1 on surfaceSunken

    ok: '#4f9e64', // 4.89:1 on surfaceRaised
    okSurface: '#16241a',
    okBorder: '#2a4531',
    okInk: '#8ed6a3', // 9.45:1 on okSurface, 9.39:1 on surfaceRaised

    info: '#1f6feb', // 3.46:1 on surfaceRaised, 4.63:1 against onFill
    infoStrong: '#1a56c4', // 6.62:1 against onFill, against info's own 4.63:1
    infoSurface: '#14232e',
    infoBorder: '#26485a',
    infoInk: '#8ed0ec', // 9.46:1 on infoSurface, 9.45:1 on surfaceRaised

    warn: '#c8912f', // 5.76:1 on surfaceRaised
    warnSurface: '#2a2210',
    warnBorder: '#4d4018',
    warnInk: '#e6c672', // 9.50:1 on warnSurface, 9.68:1 on surfaceRaised

    danger: '#c9484f', // 3.45:1 on surfaceRaised
    dangerSurface: '#2c1517',
    dangerBorder: '#52262a',
    dangerInk: '#f2a5ac', // 8.77:1 on dangerSurface, 8.21:1 on surfaceRaised

    /*
     * 4.70:1 against `onFill`, and 3.41:1 on surfaceRaised.
     *
     * Both matter, because `idle` is a solid that carries a label -- the "didn't notice" key
     * on the tasting sheet is a block of it. The first dark value tried was a lighter warm
     * grey, on which neither a white label (3.66:1) nor a dark one (4.38:1) cleared 4.5, so
     * it is darkened here until white does, which is the contract the light value already
     * held at 4.69:1.
     */
    idle: '#797369',

    accentInk: '#6fb3ff', // 7.30:1 on surfaceRaised
    onFill: '#ffffff', // the same white as light -- see `color.onFill`

    /**
     * The one "on" colour that inverts.
     *
     * `ink` here is `#ebe8e2`, so a block filled with it is near-white and its label has to
     * be dark. This is `surface` rather than pure black for the same reason the surfaces are
     * warm: a true black label on a warm off-white reads colder than anything else in the
     * scheme. 15.75:1 against `ink`.
     */
    onInk: '#191817',

    /*
     * The hairlines, inverted the only way they can be.
     *
     * Light draws them as ink at low alpha over a light ground. Reusing those values here
     * would compose near-black over near-black and disappear -- so these are the *dark*
     * scheme's ink at the same alphas, which is the same relationship the other way up.
     *
     * `hairline` at 0.13 over `surfaceRaised` lands within a shade of `border` (`#3a3733`),
     * which is what says the two schemes are drawing the same line rather than two
     * different ones that happen to both be subtle.
     */
    hairline: 'rgba(235, 232, 226, 0.13)',
    hairlineStrong: 'rgba(235, 232, 226, 0.22)',
    fill: 'rgba(235, 232, 226, 0.055)',
  },

  /**
   * The dark trace colours.
   *
   * Derived, not chosen. `derive-dark-pens.mjs` at the repo root runs the light palette's
   * own rule backwards -- hold the hue, keep as much saturation as lightening allows, raise
   * lightness until the pen clears its threshold on `darkColor.surfaceRaised`, then stop --
   * so the ramp keeps the luminance separation that made nine simultaneous traces readable.
   * Re-run it after changing a light pen and paste the line it prints.
   *
   * The threshold is 4.5 rather than the 3:1 a graphical object needs, because a pen that
   * merely passes on a dark ground reads as dim beside its light-mode self.
   *
   * Two things the light palette says about its pens survive the derivation unchanged,
   * because holding the hue is what preserves them: `flowIn` is still the tightest case,
   * amber being inherently pale in either direction, and the pens closest together in
   * greyscale are still the closest together. So the rule stands -- nothing identifies a
   * pen by colour alone.
   */
  darkPen: {
    pressure: '#de6259', // 4.58:1 on darkColor.surfaceRaised
    flowIn: '#d59115', // 6.02:1
    flowOut: '#1ba9d0', // 5.83:1
    weight: '#51a447', // 5.15:1
    waterIn: '#6284e5', // 4.54:1
    outputVolume: '#d254de', // 4.63:1
    conductivity: '#7987cf', // 4.72:1
    extractionRate: '#c66a9c', // 4.54:1
    outputTemperature: '#31baa5', // 6.64:1
    extractedSolids: '#908984', // 4.65:1
    pumpDuty: '#748aa9', // 4.54:1
    pumpRpm: '#d5c815', // 9.24:1
    brewBoiler: '#e95b20', // 4.57:1
    steamBoiler: '#a075e3', // 4.69:1
  },

  /**
   * The dark phase bands, which invert the rule the pens follow.
   *
   * A pen has to clear its threshold to be seen; a band has to stay well under it or the
   * traces drawn on top stop reading. So these are *not* lightened with the pens -- they
   * are re-darkened to sit just above the plot ground, which is the same relationship the
   * light bands have to white. 1.02:1 to 1.04:1 against `darkColor.surfaceRaised`.
   */
  darkPhase: {
    headspaceFill: '#1b2530',
    saturation: '#1a2620',
    postFirstDrop: '#2a2418',
    unknown: '#26241f',
  },
} as const;

/** Which set of values `themeFor` hands back. */
export type ColorScheme = 'light' | 'dark';

/**
 * The colour, pen and phase groups for one scheme.
 *
 * The two schemes carry the same keys, so a caller reads `theme.color.ink` without knowing
 * which it was given. Nothing here reaches into `tokens.darkColor` directly except this
 * function -- a component that wants to be scheme-aware takes a `ColorScheme` and calls
 * this, and one that does not stays on `tokens.color` and remains light.
 *
 * Note what this deliberately is *not*: it does not retheme the primitives. They capture
 * their palette at module-init time, so a component only follows a scheme once it is
 * threaded one. That work is not done, and is why adding a dark palette is not by itself a
 * dark mode for this package's consumers.
 */
export function themeFor(scheme: ColorScheme) {
  const { color, pen, phase } = tokensFor(scheme);
  return { color, pen, phase };
}

/**
 * Everything a component needs to draw itself in one scheme.
 *
 * A superset of {@link themeFor}, which now projects out of it. The scheme-invariant groups
 * are carried along deliberately: a component that reaches for `theme.color.ink` almost
 * always also wants `theme.space.md` and `theme.type.row` in the same style object, and
 * making it import `tokens` separately for those is how half a style object ends up
 * following the scheme and the other half not.
 *
 * # Why this exists
 *
 * The palette has had two schemes for a while and none of it reached the screen, because a
 * dozen objects across four packages captured their colours at module-init:
 *
 *   export const statusColors = { ok: { solid: tokens.color.ok, ... } };  // frozen
 *
 * Those are *copies*. Mutating `tokens` rethemes nothing, and threading a scheme through the
 * components is the only thing that ever could. Each of those captures now has an
 * `xFor(scheme)` beside it, with the original name kept as the light-scheme call so no
 * existing consumer changes.
 *
 * # Two invariants worth keeping
 *
 * **Referential identity.** `tokensFor('dark').color` *is* `tokens.darkColor`, not a copy of
 * it. Spreading here would break the identity assertions in `test/tokens.test.ts` and, worse,
 * would quietly decouple the two so a later edit to one stopped reaching the other.
 *
 * **Two results, built once.** `tokensFor('dark') === tokensFor('dark')`. The return value
 * lands in `useMemo` dependency arrays and in style objects rebuilt per row; a fresh object
 * per call turns every one of those into a guaranteed re-render.
 */
export interface Theme {
  scheme: ColorScheme;
  color: typeof tokens.color | typeof tokens.darkColor;
  pen: typeof tokens.pen | typeof tokens.darkPen;
  phase: typeof tokens.phase | typeof tokens.darkPhase;
  space: typeof tokens.space;
  radius: typeof tokens.radius;
  font: typeof tokens.font;
  type: typeof tokens.type;
  layout: typeof tokens.layout;
}

const THEMES: Record<ColorScheme, Theme> = {
  light: Object.freeze({
    scheme: 'light',
    color: tokens.color,
    pen: tokens.pen,
    phase: tokens.phase,
    space: tokens.space,
    radius: tokens.radius,
    font: tokens.font,
    type: tokens.type,
    layout: tokens.layout,
  }),
  dark: Object.freeze({
    scheme: 'dark',
    color: tokens.darkColor,
    pen: tokens.darkPen,
    phase: tokens.darkPhase,
    space: tokens.space,
    radius: tokens.radius,
    font: tokens.font,
    type: tokens.type,
    layout: tokens.layout,
  }),
};

export function tokensFor(scheme: ColorScheme = 'light'): Theme {
  return THEMES[scheme];
}

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
export interface StatusColor {
  solid: string;
  surface: string;
  border: string;
  ink: string;
}

/**
 * The four status roles in one scheme.
 *
 * This is the capture the whole scheme refactor turns on: `statusColors` below used to read
 * `tokens.color.*` once, at module-init, and hand every consumer a copy. `Alert` and `Badge`
 * read that copy, so both were light for good however the palette was set.
 *
 * Built per scheme and cached, so `statusColorsFor('dark') === statusColorsFor('dark')` for
 * the reason {@link tokensFor} gives.
 */
const STATUS_COLORS: Record<ColorScheme, Record<StatusRole, StatusColor>> = {
  light: buildStatusColors('light'),
  dark: buildStatusColors('dark'),
};

function buildStatusColors(scheme: ColorScheme): Record<StatusRole, StatusColor> {
  const { color } = tokensFor(scheme);
  return Object.freeze({
    ok: { solid: color.ok, surface: color.okSurface, border: color.okBorder, ink: color.okInk },
    info: {
      solid: color.info,
      surface: color.infoSurface,
      border: color.infoBorder,
      ink: color.infoInk,
    },
    warn: {
      solid: color.warn,
      surface: color.warnSurface,
      border: color.warnBorder,
      ink: color.warnInk,
    },
    danger: {
      solid: color.danger,
      surface: color.dangerSurface,
      border: color.dangerBorder,
      ink: color.dangerInk,
    },
  });
}

export function statusColorsFor(scheme: ColorScheme = 'light'): Record<StatusRole, StatusColor> {
  return STATUS_COLORS[scheme];
}

/**
 * The light scheme's status roles.
 *
 * Kept under its original name, and kept exported, because every current consumer reads it
 * and none of them knows about a scheme yet. Retiring the name would turn a no-op commit
 * into a breaking change for two frontends at once.
 */
export const statusColors: Record<StatusRole, StatusColor> = statusColorsFor('light');

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
