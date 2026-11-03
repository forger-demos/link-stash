import {Database} from 'bun:sqlite';

const migrations: readonly string[] = [
  `CREATE TABLE links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

export function migrate(db: Database): void {
  const current = (db.query('PRAGMA user_version').get() as {user_version: number}).user_version;
  for (let version = current; version < migrations.length; version++) {
    db.transaction(() => {
      db.run(migrations[version] as string);
      db.run(`PRAGMA user_version = ${version + 1}`);
    })();
  }
}

export function openDatabase(path: string): Database {
  const db = new Database(path);
  migrate(db);
  return db;
}

export function countLinks(db: Database): number {
  return (db.query('SELECT COUNT(*) AS n FROM links').get() as {n: number}).n;
}
