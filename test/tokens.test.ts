import { describe, expect, it } from 'vitest';
import { contrastRatio, statusColors, themeFor, tokens, type StatusRole } from '../src/tokens.js';

describe('design tokens', () => {
  it('computes a known contrast ratio', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('keeps body text readable on the raised surface', () => {
    expect(contrastRatio(tokens.color.ink, tokens.color.surfaceRaised)).toBeGreaterThan(4.5);
  });

  it('keeps muted text readable too', () => {
    // Muted is for units and secondary readouts, which still have to be read.
    expect(contrastRatio(tokens.color.inkMuted, tokens.color.surfaceRaised)).toBeGreaterThan(4.5);
  });

  it('keeps body text readable on the sunken surface as well', () => {
    // An inset panel is where the PID fields live, so this is a text background too, not
    // just a plane.
    expect(contrastRatio(tokens.color.ink, tokens.color.surfaceSunken)).toBeGreaterThan(4.5);
    expect(contrastRatio(tokens.color.inkMuted, tokens.color.surfaceSunken)).toBeGreaterThan(4.5);
  });

  it('keeps every pen visible against the surface it is drawn on', () => {
    // The sketch chose its pens against #0E1619, where they are light. On white several
    // fall to about 1.9:1, so they are re-tuned rather than copied. 3:1 is the WCAG 2.1
    // threshold for a graphical object.
    for (const [name, colour] of Object.entries(tokens.pen)) {
      const ratio = contrastRatio(colour, tokens.color.surfaceRaised);
      expect(ratio, `pen "${name}" is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps the pens distinguishable from each other', () => {
    // Clearing 3:1 against the background is not enough on its own: two pens can both
    // pass and still be the same colour as each other.
    const entries = Object.entries(tokens.pen);
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [aName, a] = entries[i]!;
        const [bName, b] = entries[j]!;
        expect(a, `pens "${aName}" and "${bName}" are identical`).not.toBe(b);
      }
    }
  });

  it('keeps every phase band well under the threshold its pens have to clear', () => {
    // The inverse of the rule above, and the reason these are not in `tokens.pen`. A band
    // is drawn *behind* thirteen traces, so contrast against the surface is the thing to
    // limit rather than to guarantee. 1.25:1 is comfortably below the 3:1 a graphical
    // object needs to register as one.
    for (const [name, colour] of Object.entries(tokens.phase)) {
      const ratio = contrastRatio(colour, tokens.color.surfaceRaised);
      expect(ratio, `phase "${name}" is ${ratio.toFixed(2)}:1`).toBeLessThan(1.25);
    }
  });

  it('keeps every trace readable on top of every band', () => {
    // Pens are measured against the raised surface, but on these charts most of them are
    // drawn over a band instead. A pen that cleared 3:1 on white and vanished on a phase
    // would defeat the check above.
    for (const [penName, pen] of Object.entries(tokens.pen)) {
      for (const [phaseName, phase] of Object.entries(tokens.phase)) {
        const ratio = contrastRatio(pen, phase);
        expect(ratio, `pen "${penName}" on phase "${phaseName}" is ${ratio.toFixed(2)}:1`)
          .toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('gives each phase band its own fill', () => {
    const fills = Object.values(tokens.phase);
    expect(new Set(fills).size).toBe(fills.length);
  });

  it('rejects a colour it cannot measure', () => {
    // Silently returning a plausible ratio for a malformed colour would make the
    // thresholds above meaningless.
    expect(() => contrastRatio('#fff', '#ffffff')).toThrow();
  });
});

/*
 * The status roles.
 *
 * These exist because their absence is what let 57 inline Bootstrap tints into the comms
 * frontend, so the tests are the part that stops the same gap reopening: a fifth role
 * added without a readable ink, or an existing one lightened, fails here rather than in a
 * screenshot.
 */
describe('status roles', () => {
  const roles = Object.keys(statusColors) as StatusRole[];

  it('covers every role the type admits', () => {
    expect(roles.sort()).toEqual(['danger', 'info', 'ok', 'warn']);
  });

  it('keeps each role solid usable as a graphical object', () => {
    // 3:1 is what a fill, a border or a status dot has to clear to register as a shape.
    // Not 4.5:1 -- these are not text. `ok` at 3.13:1 is the tightest and is why `okInk`
    // exists separately rather than text reusing the solid.
    for (const role of roles) {
      const ratio = contrastRatio(statusColors[role].solid, tokens.color.surfaceRaised);
      expect(ratio, `${role} solid is ${ratio.toFixed(2)}:1 on surfaceRaised`)
        .toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps each role ink readable on its own tint', () => {
    for (const role of roles) {
      const { ink, surface } = statusColors[role];
      const ratio = contrastRatio(ink, surface);
      expect(ratio, `${role} ink is ${ratio.toFixed(2)}:1 on its own surface`)
        .toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps each role ink readable on the raised surface too', () => {
    // An alert is not the only place these are used: a validation message under a field
    // is `dangerInk` on white, with no tint behind it.
    for (const role of roles) {
      const ratio = contrastRatio(statusColors[role].ink, tokens.color.surfaceRaised);
      expect(ratio, `${role} ink is ${ratio.toFixed(2)}:1 on surfaceRaised`)
        .toBeGreaterThanOrEqual(4.5);
    }
  });

  it('gives every role four distinct values', () => {
    // A role whose surface and border are the same literal renders as a borderless block,
    // which reads as a different component rather than as a missing hairline.
    for (const role of roles) {
      const values = Object.values(statusColors[role]);
      expect(new Set(values).size, `${role} reuses a value`).toBe(values.length);
    }
  });

  it('does not let two roles share a solid', () => {
    const solids = roles.map((role) => statusColors[role].solid);
    expect(new Set(solids).size).toBe(solids.length);
  });

  it('keeps a filled primary button readable in both its states', () => {
    // `infoStrong` is only ever seen carrying a white label, so that pair is the whole
    // requirement -- and it has to hold in the resting state too, or the button becomes
    // readable only while the pointer is on it.
    //
    // Measured against `onFill` rather than `surfaceRaised`, though the two are the same
    // literal here. They are the same only in light, and writing the surface would make
    // this assertion silently change meaning under the dark palette.
    expect(contrastRatio(tokens.color.onFill, tokens.color.info)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tokens.color.onFill, tokens.color.infoStrong)).toBeGreaterThanOrEqual(4.5);
    // The label must get *more* readable under the pointer, never less -- a button that
    // loses contrast on hover reads as going disabled. In light that means hover is the
    // darker of the two; the dark scheme reaches the same end from the same rule.
    expect(contrastRatio(tokens.color.onFill, tokens.color.infoStrong))
      .toBeGreaterThan(contrastRatio(tokens.color.onFill, tokens.color.info));
  });

  it('lets the accent be text as well as a fill', () => {
    // `accentInk` is `info` here, so this is the same measurement the "one blue" test
    // makes. It is written separately because in dark they are different values and this
    // is the one that has to clear a *text* threshold.
    expect(contrastRatio(tokens.color.accentInk, tokens.color.surfaceRaised))
      .toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the one blue', () => {
    // The drift this palette exists to close was two blues in service at once: #0066cc in
    // 58 places and #007bff in 7. Only the first clears 4.5:1, and it is the one `info`
    // now names. A future edit that reintroduces the other fails here.
    expect(tokens.color.info).toBe('#0066cc');
    expect(contrastRatio(tokens.color.info, tokens.color.surfaceRaised)).toBeGreaterThanOrEqual(4.5);
  });
});

/*
 * The dark scheme.
 *
 * Every rule above, held against the dark surfaces. Written as a parallel suite rather than
 * by parameterising the light one, because two of the rules genuinely differ -- the pens
 * clear a higher threshold, and the bands are measured somewhere else -- and a parameterised
 * version would have to carry those exceptions as conditionals, which is how a threshold
 * quietly stops applying to one scheme.
 */
describe('the dark scheme', () => {
  const dark = themeFor('dark');
  const light = themeFor('light');

  it('hands back the dark groups', () => {
    expect(dark.color).toBe(tokens.darkColor);
    expect(dark.pen).toBe(tokens.darkPen);
    expect(dark.phase).toBe(tokens.darkPhase);
    expect(light.color).toBe(tokens.color);
  });

  it('names exactly the same things in both schemes', () => {
    // The failure this catches is a token added to one scheme and forgotten in the other,
    // which type-checks wherever it is read through `themeFor` and renders as `undefined`.
    expect(Object.keys(dark.color).sort()).toEqual(Object.keys(light.color).sort());
    expect(Object.keys(dark.pen).sort()).toEqual(Object.keys(light.pen).sort());
    expect(Object.keys(dark.phase).sort()).toEqual(Object.keys(light.phase).sort());
  });

  it('keeps a card standing off its page, and an inset receding into its card', () => {
    /*
     * The two relationships the grouped-inset layout is built on, held in both schemes so
     * the structure survives without reaching for a shadow.
     *
     * Note what is deliberately *not* asserted: a single three-way ordering. In light the
     * inset is lighter than the page (`#f8f9fa` against `#f5f5f5`) and in dark it is
     * darker (`#121110` against `#191817`), because in each scheme it steps *away from its
     * own card* and the card is on opposite sides of the page in the two. What has to hold
     * either way is that a raised surface reads above both of them.
     */
    const lum = (hex: string) => contrastRatio(hex, '#000000');
    for (const scheme of [light, dark]) {
      expect(lum(scheme.color.surfaceRaised)).toBeGreaterThan(lum(scheme.color.surface));
      expect(lum(scheme.color.surfaceRaised)).toBeGreaterThan(lum(scheme.color.surfaceSunken));
    }
  });

  it('keeps body and muted text readable on both dark surfaces', () => {
    for (const ground of [dark.color.surfaceRaised, dark.color.surfaceSunken]) {
      expect(contrastRatio(dark.color.ink, ground)).toBeGreaterThan(4.5);
      expect(contrastRatio(dark.color.inkMuted, ground)).toBeGreaterThan(4.5);
    }
  });

  it('keeps every dark pen visible against the surface it is drawn on', () => {
    // 4.5 rather than the 3:1 a graphical object needs, and deliberately so: a pen that
    // merely passes on a dark ground reads as dim beside its light-mode self. This is the
    // threshold `derive-dark-pens.mjs` stops at, so a pasted value that fell short of it
    // fails here rather than looking approximately right.
    for (const [name, colour] of Object.entries(dark.pen)) {
      const ratio = contrastRatio(colour, dark.color.surfaceRaised);
      expect(ratio, `dark pen "${name}" is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps the dark pens distinguishable from each other', () => {
    const values = Object.values(dark.pen);
    expect(new Set(values).size).toBe(values.length);
  });

  it('keeps every dark band well under the threshold its pens have to clear', () => {
    // Measured against the raised surface, because that is the plot ground in both schemes.
    for (const [name, colour] of Object.entries(dark.phase)) {
      const ratio = contrastRatio(colour, dark.color.surfaceRaised);
      expect(ratio, `dark phase "${name}" is ${ratio.toFixed(2)}:1`).toBeLessThan(1.25);
    }
  });

  it('keeps every dark trace readable on top of every dark band', () => {
    for (const [penName, pen] of Object.entries(dark.pen)) {
      for (const [phaseName, phase] of Object.entries(dark.phase)) {
        const ratio = contrastRatio(pen, phase);
        expect(ratio, `dark pen "${penName}" on "${phaseName}" is ${ratio.toFixed(2)}:1`)
          .toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('gives each dark band its own fill', () => {
    const fills = Object.values(dark.phase);
    expect(new Set(fills).size).toBe(fills.length);
  });

  it('keeps each dark role solid usable as a graphical object', () => {
    for (const role of ['ok', 'info', 'warn', 'danger'] as const) {
      const ratio = contrastRatio(dark.color[role], dark.color.surfaceRaised);
      expect(ratio, `dark ${role} solid is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps each dark role ink readable on its own tint and on the raised surface', () => {
    const roles = [
      ['ok', dark.color.okInk, dark.color.okSurface],
      ['info', dark.color.infoInk, dark.color.infoSurface],
      ['warn', dark.color.warnInk, dark.color.warnSurface],
      ['danger', dark.color.dangerInk, dark.color.dangerSurface],
    ] as const;
    for (const [name, ink, tint] of roles) {
      expect(contrastRatio(ink, tint), `dark ${name} ink on its tint`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(ink, dark.color.surfaceRaised), `dark ${name} ink on raised`)
        .toBeGreaterThanOrEqual(4.5);
    }
  });

  it('does not let two dark roles share a solid', () => {
    const solids = [dark.color.ok, dark.color.info, dark.color.warn, dark.color.danger];
    expect(new Set(solids).size).toBe(solids.length);
  });

  it('keeps a filled primary button readable in both its states', () => {
    // The same rule as light, and the reason `onFill` exists: the label stays white while
    // the surface underneath it does not. Written against `surfaceRaised` this would be
    // near-black text on blue.
    expect(contrastRatio(dark.color.onFill, dark.color.info)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.color.onFill, dark.color.infoStrong)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.color.onFill, dark.color.infoStrong))
      .toBeGreaterThan(contrastRatio(dark.color.onFill, dark.color.info));
  });

  it('splits the accent into a fill and an ink', () => {
    // The whole reason `accentInk` exists. In dark the fill is too dark to read as text
    // and the ink is too light to carry a white label, so one value cannot do both jobs.
    expect(contrastRatio(dark.color.accentInk, dark.color.surfaceRaised))
      .toBeGreaterThanOrEqual(4.5);
    expect(dark.color.accentInk).not.toBe(dark.color.info);
    // ...and light gets the same two names pointing at the one blue, so a site written
    // once is correct in both.
    expect(light.color.accentInk).toBe(light.color.info);
  });

  it('keeps the label on a fill white in both schemes', () => {
    expect(dark.color.onFill).toBe(light.color.onFill);
    expect(dark.color.onFill).toBe('#ffffff');
  });

  it('keeps `idle` able to carry a label in both schemes', () => {
    // `idle` is not only a disabled tint -- the tasting sheet's "didn't notice" key is a
    // filled block of it with a white label, in both schemes. So it is held to the text
    // threshold against `onFill`, and to the graphical-object one against the surface, which
    // is what pins it between being too light to read white on and too dark to see.
    for (const scheme of [light, dark]) {
      expect(contrastRatio(scheme.color.idle, scheme.color.onFill)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(scheme.color.idle, scheme.color.surfaceRaised))
        .toBeGreaterThanOrEqual(3);
    }
  });
});
