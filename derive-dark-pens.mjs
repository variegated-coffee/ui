/*
 * The dark pen ramp, derived rather than chosen.
 *
 * `tokens.pen` was built by taking the sketch's hues and *darkening* each one until it
 * cleared 3:1 against `surfaceRaised`. The dark ramp is that same rule run the other way:
 * hold the hue, keep as much saturation as lightening allows, and raise lightness until the
 * pen clears its threshold on the dark raised surface -- then stop, so the palette keeps the
 * luminance separation that made nine simultaneous traces readable.
 *
 * The threshold is 4.5 rather than the 3:1 a graphical object needs, because a pen that
 * merely passes on a dark ground reads as dim next to its light-mode self.
 *
 * This is what produced the literals in `tokens.darkPen`. It reads them out of
 * `src/tokens.ts` rather than keeping a second copy, so re-running it after a light pen
 * changes shows what the dark one should become. `test/tokens.test.ts` is what holds the
 * committed values honest; this script is how they were arrived at.
 *
 * Usage: node derive-dark-pens.mjs [<dark raised surface>] [<threshold>]
 *   node derive-dark-pens.mjs
 *   node derive-dark-pens.mjs '#232120' 4.5
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const against = process.argv[2] ?? '#232120';
const threshold = Number(process.argv[3] ?? 4.5);

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'src', 'tokens.ts'), 'utf8');

// The `pen:` group only -- `darkPen:` below it is the output of this script, and reading it
// back in would derive the ramp from itself.
const block = /\n  pen: \{([\s\S]*?)\n  \},/.exec(source);
if (!block) throw new Error('could not find the `pen:` group in src/tokens.ts');

const pens = [...block[1].matchAll(/(\w+): '(#[0-9a-fA-F]{6})'/g)].map((m) => [m[1], m[2]]);
if (pens.length === 0) throw new Error('found the `pen:` group but no pens in it');

function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
}

function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0'))
      .join('')
  );
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function rgbToHsl(r, g, b) {
  [r, g, b] = [r / 255, g / 255, b / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return [h, s, l];
}

function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0]
    : h < 120 ? [x, c, 0]
    : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c]
    : h < 300 ? [x, 0, c]
    : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/**
 * Hold the hue. Cap saturation, because a fully saturated hue cannot also be light. Floor
 * lightness so a very dark pen does not need dozens of steps to arrive. Then climb in 1%
 * steps until the threshold is met, and stop at the first value that meets it.
 */
function lightenForDark(hex) {
  const [h, s0, l0] = rgbToHsl(...hexToRgb(hex));
  const s = Math.min(s0 * 0.94, 0.82);
  let l = Math.max(l0, 0.46);
  let out = hslToHex(h, s, l);
  // The ceiling matters: without it a hue that cannot reach the threshold walks to white
  // and loses the identity the swatch is carrying.
  while (contrastRatio(out, against) < threshold && l < 0.88) {
    l += 0.01;
    out = hslToHex(h, s, l);
  }
  return out;
}

const width = Math.max(...pens.map(([name]) => name.length));
console.log(`# derived against ${against} at ${threshold}:1\n`);
for (const [name, light] of pens) {
  const dark = lightenForDark(light);
  const ratio = contrastRatio(dark, against);
  const flag = ratio < threshold ? '  <-- short of threshold, hue has no more room' : '';
  console.log(
    `${name.padEnd(width)}: '${dark}', // ${ratio.toFixed(2)}:1 on ${against}, was ${light}${flag}`
  );
}
