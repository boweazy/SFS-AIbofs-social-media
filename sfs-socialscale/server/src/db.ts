import Database from 'better-sqlite3';

export type Account = { id: string; platform: 'x'|'linkedin'|'instagram'; handle: string; connected: number; token_hint?: string|null };
export type Template = { id: string; name: string; category: string; premium: number; body: string };
export type Post = { id: string; account_id: string; body: string; image_alt?: string|null; hashtags?: string|null; status: 'draft'|'scheduled'|'posted'|'failed'; scheduled_at?: string|null; posted_at?: string|null };
export type Analytics = { id: string; post_id: string; metric: string; value: number; ts: string };

let db: Database.Database | null = null;
export function getDB() {
  if (!db) {
    const url = process.env.DATABASE_URL || './data.sqlite';
    db = new Database(url);
    init(db);
  }
  return db!;
}

function init(d: Database.Database) {
  d.exec(`
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      handle TEXT NOT NULL,
      connected INTEGER NOT NULL DEFAULT 0,
      token_hint TEXT
    );
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      premium INTEGER NOT NULL DEFAULT 0,
      body TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      body TEXT NOT NULL,
      image_alt TEXT,
      hashtags TEXT,
      status TEXT NOT NULL,
      scheduled_at TEXT,
      posted_at TEXT,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );
    CREATE TABLE IF NOT EXISTS analytics (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      metric TEXT NOT NULL,
      value REAL NOT NULL,
      ts TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );
  `);
}