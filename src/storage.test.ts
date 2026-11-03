import {expect, test} from 'bun:test';
import {countLinks, migrate, openDatabase} from './storage';

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
  expect((db.query('PRAGMA user_version').get() as {user_version: number}).user_version).toBe(1);
});
