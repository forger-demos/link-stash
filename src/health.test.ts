import {expect, test} from 'bun:test';
import {health} from './health';

test('health reports ok', () => {
  expect(health()).toEqual({ok: true});
});
