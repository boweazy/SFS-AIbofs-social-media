import 'dotenv/config';
import { getDB } from './db.js';
import { randomUUID } from 'node:crypto';

const db = getDB();
const a1 = randomUUID();
const a2 = randomUUID();

// Seed accounts
db.prepare('INSERT OR REPLACE INTO accounts (id,platform,handle,connected) VALUES (?,?,?,1)').run(a1, 'x', '@smartflow');
db.prepare('INSERT OR REPLACE INTO accounts (id,platform,handle,connected) VALUES (?,?,?,1)').run(a2, 'linkedin', 'SmartFlow Systems');

// Seed templates
const templates = [
  { name: 'Product Launch', category: 'Marketing', premium: 0, body: 'Excited to announce our new {{product}}! {{benefits}} #innovation #startup' },
  { name: 'Company Update', category: 'News', premium: 0, body: 'Big news from our team: {{news}}. Thanks to everyone who {{action}}! #companyupdate' },
  { name: 'Industry Insight', category: 'Thought Leadership', premium: 1, body: 'The {{industry}} is evolving rapidly. Key trends: {{trends}}. What are your thoughts?' },
];

for (const t of templates) {
  db.prepare('INSERT OR REPLACE INTO templates (id,name,category,premium,body) VALUES (?,?,?,?,?)')
    .run(randomUUID(), t.name, t.category, t.premium, t.body);
}

// Seed some posts
const posts = [
  { account_id: a1, body: 'Just shipped a new feature! AI-powered social media scheduling is here. #AI #socialmedia', status: 'posted' },
  { account_id: a2, body: 'Excited to share our latest milestone - 1000+ active users! Thank you for the amazing support. #milestone', status: 'posted' },
  { account_id: a1, body: 'Coming soon: Advanced analytics dashboard with real-time insights. Stay tuned! #analytics', status: 'scheduled', scheduled_at: new Date(Date.now() + 24*60*60*1000).toISOString() },
];

for (const p of posts) {
  db.prepare('INSERT OR REPLACE INTO posts (id,account_id,body,status,scheduled_at,posted_at) VALUES (?,?,?,?,?,?)')
    .run(randomUUID(), p.account_id, p.body, p.status, p.scheduled_at || null, p.status === 'posted' ? new Date().toISOString() : null);
}

console.log('✅ Database seeded with accounts, templates, and posts');
console.log(`Account IDs: ${a1} (X), ${a2} (LinkedIn)`);