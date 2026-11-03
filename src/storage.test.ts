import {expect, test} from 'bun:test';
import {addLink, countLinks, listLinks, migrate, openDatabase} from './storage';

test('opens an in-memory database with the schema migrated', () => {
  const db = openDatabase(':memory:');
  expect(countLinks(db)).toBe(0);
  db.run("INSERT INTO links (url) VALUES ('https://example.com')");
  expect(countLinks(db)).toBe(1);
});

test('migrating twice leaves the schema and data alone', () => {
  const db = openDatabase(':memory:');
  db.run("INSERT INTO links (url) VALUES ('https://example.com')");
  migrate(db);
  expect(countLinks(db)).toBe(1);
  expect((db.query('PRAGMA user_version').get() as {user_version: number}).user_version).toBe(2);
});

test('records stored before carry forward unchanged', () => {
  const db = openDatabase(':memory:');
  db.run("INSERT INTO links (url, title, created_at) VALUES ('https://old.example', 'Old', '2026-01-01 00:00:00')");
  migrate(db);
  expect(listLinks(db)).toEqual([{id: 1, url: 'https://old.example', title: 'Old', created_at: '2026-01-01 00:00:00', tags: []}]);
});

test('lists newest first', () => {
  const db = openDatabase(':memory:');
  addLink(db, 'https://a.example', '');
  addLink(db, 'https://b.example', 'B');
  expect(listLinks(db).map((l) => l.url)).toEqual(['https://b.example', 'https://a.example']);
});

test('a database at the first schema version gains tags and keeps its links', () => {
  const db = new (require('bun:sqlite').Database)(':memory:');
  db.run("CREATE TABLE links (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
  db.run("INSERT INTO links (url) VALUES ('https://old.example')");
  db.run('PRAGMA user_version = 1');
  migrate(db);
  expect(listLinks(db).map((l) => [l.url, l.tags])).toEqual([['https://old.example', []]]);
});

test('tags are stored per link and filter the list', () => {
  const db = openDatabase(':memory:');
  addLink(db, 'https://a.example', '', ['news', 'dev']);
  addLink(db, 'https://b.example', '', ['dev']);
  addLink(db, 'https://c.example', '');
  expect(listLinks(db)[2]?.tags).toEqual(['dev', 'news']);
  expect(listLinks(db, 'dev').map((l) => l.url)).toEqual(['https://b.example', 'https://a.example']);
  expect(listLinks(db, 'news').map((l) => l.url)).toEqual(['https://a.example']);
  expect(listLinks(db, 'none')).toEqual([]);
});
