import { cleanup } from '@testing-library/preact';
import { afterEach } from 'vitest';

/*
 * Unmount between tests.
 *
 * `@testing-library/preact` registers this itself when a global `afterEach` is in scope,
 * which vitest only provides under `globals: true`. Without it every `render` leaves its
 * tree in the document and the next `getByRole` finds two matches -- which fails as
 * "multiple elements found", pointing at the query rather than at the leak.
 */
afterEach(cleanup);
