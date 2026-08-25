/*
 * WCAG 2.1 contrast between colour pairs, from the command line.
 *
 * The palette in `src/tokens.ts` records a measured ratio next to every colour that has a
 * threshold to clear. This is what produces those numbers, so a value darkened by eye can
 * be checked before it is written down rather than after `npm test` rejects it.
 *
 * Usage: node measure-contrast.mjs <fg> <bg> [<fg> <bg> ...]
 *   node measure-contrast.mjs '#721c24' '#f8d7da' '#155724' '#d4edda'
 */
const args = process.argv.slice(2);
if (args.length === 0 || args.length % 2 !== 0) {
  console.error('usage: node measure-contrast.mjs <fg> <bg> [<fg> <bg> ...]');
  process.exit(2);
}

function relativeLuminance(hex) {
  const value = hex.replace('#', '');
  // Refused rather than guessed, matching `contrastRatio` in src/tokens.ts: a three-digit
  // shorthand parsed as six yields a plausible number, which would quietly weaken every
  // threshold measured against it.
  if (!/^[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`expected a #rrggbb colour, got "${hex}"`);
  }
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(value.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

for (let i = 0; i < args.length; i += 2) {
  const [fg, bg] = [args[i], args[i + 1]];
  console.log(`${fg} on ${bg}  ${contrastRatio(fg, bg).toFixed(2)}:1`);
}
