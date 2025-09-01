import { strict as assert } from 'assert';
import { test } from 'node:test';
import { wow } from '../src/index.js';

test('wow function', (t) => {
  t.test('should add 1 to the input number', () => {
    assert.strictEqual(wow(1), 2);
    assert.strictEqual(wow(0), 1);
    assert.strictEqual(wow(-1), 0);
  });
});