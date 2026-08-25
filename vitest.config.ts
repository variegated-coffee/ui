import { defineConfig } from 'vitest/config';

/**
 * `jsdom` rather than Node, which the plantlet workspace's config deliberately avoids.
 *
 * The reasoning there was that the components worth testing lived in `packages/shot-log`
 * and testing them would mean adding jsdom for one suite. Here they are the package, and
 * what these tests assert is exactly the part that has no non-DOM form: that a `Field`
 * emits an `id` its `<label>` actually points at, and that a `Dialog` is announced as one.
 * Those are the audit's findings; asserting them against a render tree rather than a
 * screenshot is the point.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    setupFiles: ['test/setup.ts'],
  },
  // Vitest 4 transforms with oxc, not esbuild, and silently ignores an `esbuild` block --
  // the warning it prints is the only sign. Setting it here rather than there is what
  // makes `.tsx` in this suite compile against Preact's runtime instead of React's.
  oxc: {
    jsx: {
      runtime: 'automatic',
      importSource: 'preact',
    },
  },
});
