import {expect, test} from 'bun:test';
import {handle} from './app';
import {openDatabase} from './storage';

const get = (path: string, method = 'GET') =>
  handle(new Request(`http://test${path}`, {method}), openDatabase(':memory:'));

test('health returns ok', async () => {
  const res = await get('/api/health');
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ok: true});
});

test('links reports the stored count', async () => {
  const res = await get('/api/links');
  expect(await res.json()).toEqual({count: 0});
});

test('unknown api paths are 404', async () => {
  expect((await get('/api/nope')).status).toBe(404);
});

test('non-GET requests are rejected', async () => {
  expect((await get('/', 'POST')).status).toBe(405);
});

test('root serves the Link stash page with its empty state', async () => {
  const res = await get('/');
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain('<title>Link stash</title>');
  expect(html).toContain('No links saved yet');
});

test('static assets are served from public', async () => {
  expect((await get('/style.css')).status).toBe(200);
});

test('missing files and path traversal are 404', async () => {
  expect((await get('/missing.txt')).status).toBe(404);
  expect((await get('/../package.json')).status).toBe(404);
});
