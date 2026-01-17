import { describe, it, expect } from 'vitest';
import { sum } from '../src/index.js'; // Note: NodeNext requires explicit extensions or specific resolution configs, but typically imports from src in tests resolve via TS. Let's stick to .js extension for NodeNext compliance if importing fully built files, but here we are importing source.

// However, with "module": "NodeNext", TypeScript expects imports to have extensions.
// When importing local files in src, we should ideally use .js extension in imports so the emitted code works,
// or rely on bundler/test runner resolution.
// Let's use .js to be strict NodeNext compliant for the source code compilation.

describe('sum', () => {
  it('adds two numbers', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
