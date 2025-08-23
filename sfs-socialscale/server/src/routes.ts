import { Router } from 'express';
import { DateTime } from 'luxon';
import { getDB } from './db.js';
import { uuid, ok, err } from './util.js';
import { generateViaPython } from './adapters/python.js';
import { generatePostsFallback } from './ai.js';

export const api = Router();

// Health
api.get('/health', (_req, res) => res.json(ok({ status: 'up' })));

// Accounts (mock connect)
api.get('/accounts', (req, res) => {
  const rows = getDB().prepare('SELECT * FROM accounts').all();
  res.json(ok(rows));
});
api.post('/accounts', (req, res) => {
  const { platform, handle, token_hint } = req.body ?? {};
  if (!platform || !handle) return res.status(400).json(err('platform+handle required'));
  const id = uuid();
  getDB().prepare('INSERT INTO accounts (id, platform, handle, connected, token_hint) VALUES (?,?,?,?,?)')
    .run(id, platform, handle, 1, token_hint ?? null);
  res.json(ok({ id }));
});

// Templates
api.get('/templates', (_req, res) => {
  const rows = getDB().prepare('SELECT * FROM templates').all();
  res.json(ok(rows));
});
api.post('/templates', (req, res) => {
  const { name, category, premium, body } = req.body ?? {};
  const id = uuid();
  getDB().prepare('INSERT INTO templates (id,name,category,premium,body) VALUES (?,?,?,?,?)')
    .run(id, name, category, premium?1:0, body);
  res.json(ok({ id }));
});

// Generator → Python or fallback
api.post('/generate_posts', async (req, res) => {
  const { topic, platform='x', count=3 } = req.body ?? {};
  try {
    const result = process.env.PYTHON_SERVICE_URL
      ? await generateViaPython({ topic, platform, count })
      : await generatePostsFallback({ topic, platform, count });
    res.json(result);
  } catch (e: any) {
    res.status(500).json(err(e.message));
  }
});

// Posts + scheduling
api.get('/posts', (_req, res) => {
  const rows = getDB().prepare('SELECT * FROM posts ORDER BY COALESCE(scheduled_at, posted_at) DESC').all();
  res.json(ok(rows));
});
api.post('/posts', (req, res) => {
  const { account_id, body, image_alt, hashtags, scheduled_at } = req.body ?? {};
  if (!account_id || !body) return res.status(400).json(err('account_id+body required'));
  const id = uuid();
  const status = scheduled_at ? 'scheduled' : 'draft';
  getDB().prepare('INSERT INTO posts (id,account_id,body,image_alt,hashtags,status,scheduled_at) VALUES (?,?,?,?,?,?,?)')
    .run(id, account_id, body, image_alt ?? null, Array.isArray(hashtags) ? hashtags.join(' ') : hashtags ?? null, status, scheduled_at ?? null);
  res.json(ok({ id }));
});
api.patch('/posts/:id', (req, res) => {
  const { id } = req.params;
  const { status, scheduled_at } = req.body ?? {};
  getDB().prepare('UPDATE posts SET status=?, scheduled_at=? WHERE id=?').run(status, scheduled_at ?? null, id);
  res.json(ok({ id }));
});

// Analytics (basic)
api.get('/analytics/:postId', (req, res) => {
  const { postId } = req.params;
  const rows = getDB().prepare('SELECT metric,value,ts FROM analytics WHERE post_id=? ORDER BY ts').all(postId);
  res.json(ok(rows));
});

// Admin: seed demo data
api.post('/admin/seed', (req, res) => {
  const key = req.header('x-api-key');
  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) return res.status(401).json(err('unauthorized', 401));
  const a1 = uuid(); const a2 = uuid();
  const db = getDB();
  db.prepare('INSERT OR IGNORE INTO accounts (id,platform,handle,connected) VALUES (?,?,?,1)')
    .run(a1, 'x', '@smartflow');
  db.prepare('INSERT OR IGNORE INTO accounts (id,platform,handle,connected) VALUES (?,?,?,1)')
    .run(a2, 'linkedin', 'SmartFlow');
  db.prepare('INSERT OR IGNORE INTO templates (id,name,category,premium,body) VALUES (?,?,?,?,?)')
    .run(uuid(), 'Product Launch', 'Marketing', 0, 'Announce our new {{product}} with benefits {{benefits}}');
  res.json(ok({ done: true }));
});