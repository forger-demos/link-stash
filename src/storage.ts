import {Database} from 'bun:sqlite';

const migrations: readonly string[] = [
  `CREATE TABLE links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE link_tags (
    link_id INTEGER NOT NULL REFERENCES links(id),
    tag TEXT NOT NULL,
    PRIMARY KEY (link_id, tag)
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

export interface Link {
  id: number;
  url: string;
  title: string;
  created_at: string;
  tags: string[];
}

type LinkRow = Omit<Link, 'tags'>;

export function addLink(db: Database, url: string, title: string, tags: string[] = []): Link {
  return db.transaction(() => {
    const row = db
      .query('INSERT INTO links (url, title) VALUES (?, ?) RETURNING id, url, title, created_at')
      .get(url, title) as LinkRow;
    for (const tag of tags) db.query('INSERT INTO link_tags (link_id, tag) VALUES (?, ?)').run(row.id, tag);
    return {...row, tags: [...tags].sort()};
  })();
}

export function listLinks(db: Database, tag?: string): Link[] {
  const rows = (
    tag
      ? db
          .query(
            `SELECT id, url, title, created_at FROM links
             WHERE id IN (SELECT link_id FROM link_tags WHERE tag = ?) ORDER BY id DESC`,
          )
          .all(tag)
      : db.query('SELECT id, url, title, created_at FROM links ORDER BY id DESC').all()
  ) as LinkRow[];
  const byLink = new Map<number, string[]>();
  for (const t of db.query('SELECT link_id, tag FROM link_tags ORDER BY tag').all() as {link_id: number; tag: string}[]) {
    byLink.set(t.link_id, [...(byLink.get(t.link_id) ?? []), t.tag]);
  }
  return rows.map((r) => ({...r, tags: byLink.get(r.id) ?? []}));
}
