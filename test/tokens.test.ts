import { describe, expect, it } from 'vitest';
import { contrastRatio, statusColors, tokens, type StatusRole } from '../src/tokens.js';

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
    expect(contrastRatio(tokens.color.surfaceRaised, tokens.color.info)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tokens.color.surfaceRaised, tokens.color.infoStrong))
      .toBeGreaterThanOrEqual(4.5);
    // Hover must be the darker of the two. Reversed, the button lightens under the
    // pointer, which reads as going disabled.
    expect(contrastRatio(tokens.color.infoStrong, tokens.color.surfaceRaised))
      .toBeGreaterThan(contrastRatio(tokens.color.info, tokens.color.surfaceRaised));
  });

  it('keeps the one blue', () => {
    // The drift this palette exists to close was two blues in service at once: #0066cc in
    // 58 places and #007bff in 7. Only the first clears 4.5:1, and it is the one `info`
    // now names. A future edit that reintroduces the other fails here.
    expect(tokens.color.info).toBe('#0066cc');
    expect(contrastRatio(tokens.color.info, tokens.color.surfaceRaised)).toBeGreaterThanOrEqual(4.5);
  });
});
