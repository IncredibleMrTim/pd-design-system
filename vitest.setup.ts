// Adds matchers such as toHaveValue to vitest's expect for the component tests.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only cleans up on its own when vitest globals are on, so
// without this each test would find the previous test's rendered input too.
afterEach(cleanup);
