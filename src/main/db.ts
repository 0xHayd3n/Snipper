import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db: Database.Database;

export function initDatabase(): Database.Database {
  const dbPath = path.join(app.getPath('userData'), 'snipper.db');
  db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      colour TEXT NOT NULL DEFAULT '#4ec9b0'
    );

    CREATE TABLE IF NOT EXISTS snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      language TEXT NOT NULL DEFAULT 'plaintext',
      collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS snippet_tags (
      snippet_id INTEGER NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (snippet_id, tag_id)
    );
  `);

  // Seed default "General" collection if none exist
  const count = db.prepare('SELECT COUNT(*) as count FROM collections').get() as { count: number };
  if (count.count === 0) {
    db.prepare('INSERT INTO collections (name) VALUES (?)').run('General');
  }

  return db;
}

export function getDatabase(): Database.Database {
  return db;
}
