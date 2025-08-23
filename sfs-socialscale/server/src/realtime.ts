import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { getDB } from './db.js';
import { DateTime } from 'luxon';
import { randomUUID } from 'node:crypto';

export function initRealtime(http: HTTPServer) {
  const io = new Server(http, { cors: { origin: process.env.CLIENT_ORIGIN || '*' } });
  setInterval(() => {
    // Demo: emit random engagement events
    const db = getDB();
    const posts = db.prepare('SELECT id FROM posts WHERE status IN ("posted","scheduled") ORDER BY RANDOM() LIMIT 1').all() as Array<{id: string}>;
    if (posts.length) {
      const postId = posts[0].id;
      const value = Math.floor(1 + Math.random() * 5);
      const ts = DateTime.utc().toISO();
      db.prepare('INSERT INTO analytics (id,post_id,metric,value,ts) VALUES (?,?,?,?,?)')
        .run(randomUUID(), postId, 'engagement', value, ts);
      io.emit('analytics:update', { postId, metric: 'engagement', value, ts });
    }
  }, 4000);
  return io;
}