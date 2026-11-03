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

const post = (db: ReturnType<typeof openDatabase>, body: unknown) =>
  handle(
    new Request('http://test/api/links', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    db,
  );
const list = async (db: ReturnType<typeof openDatabase>) =>
  (await (await handle(new Request('http://test/api/links'), db)).json()) as {links: {url: string; title: string}[]};

test('links starts empty', async () => {
  expect(await (await get('/api/links')).json()).toEqual({links: []});
});

test('a saved link is listed newest first', async () => {
  const db = openDatabase(':memory:');
  const res = await post(db, {url: 'https://a.example', title: 'A'});
  expect(res.status).toBe(201);
  expect(await res.json()).toMatchObject({url: 'https://a.example', title: 'A'});
  await post(db, {url: 'https://b.example'});
  expect((await list(db)).links.map((l) => l.url)).toEqual(['https://b.example', 'https://a.example']);
});

test('an invalid address is refused and nothing is stored', async () => {
  const db = openDatabase(':memory:');
  for (const body of [{url: 'ftp://x.example'}, {url: ''}, 'not json']) {
    const res = await post(db, body);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({field: 'url'});
  }
  expect((await list(db)).links).toEqual([]);
});

test('other methods on links are rejected', async () => {
  expect((await get('/api/links', 'DELETE')).status).toBe(405);
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
