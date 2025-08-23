import 'dotenv/config';
import { getDB } from './db.js';
import { randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';

const db = getDB();

// Get existing posts
const posts = db.prepare('SELECT id FROM posts WHERE status = "posted"').all() as Array<{id: string}>;

if (posts.length === 0) {
  console.log('⚠️  No posted content found. Run seed.ts first.');
  process.exit(1);
}

// Generate sample metrics for the last 30 days
const metrics = ['views', 'likes', 'shares', 'comments', 'clicks'];
const now = DateTime.utc();

for (const post of posts) {
  // Generate metrics for the last 30 days
  for (let day = 0; day < 30; day++) {
    const ts = now.minus({ days: day }).toISO();
    
    for (const metric of metrics) {
      const baseValue = metric === 'views' ? 100 : 10;
      const value = Math.floor(baseValue * (0.5 + Math.random()));
      
      db.prepare('INSERT INTO analytics (id,post_id,metric,value,ts) VALUES (?,?,?,?,?)')
        .run(randomUUID(), post.id, metric, value, ts);
    }
  }
}

console.log('✅ Analytics metrics seeded for 30 days');
console.log(`Generated metrics for ${posts.length} posts`);