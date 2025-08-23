import express from 'express';
import compression from 'compression';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- App setup
const app = express();
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(cors());

// --- Health check
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// --- (KEEP YOUR EXISTING API ROUTES HERE) ---
// If you already have server routes like /api/generate_posts, etc., DO NOT delete them.
// This file only ensures SPA hosting + fallback. Example placeholder:
app.get('/api/_example', (_req, res)=> res.json({ ok: true, msg: 'API alive' }));

// --- Static hosting of React build (client/dist)
const DIST = path.join(__dirname, 'client', 'dist');
const HAS_BUILD = fs.existsSync(DIST);

// Serve static if built, else show a friendly status page
if (HAS_BUILD) {
  app.use(express.static(DIST, { extensions: ['html'] }));
  // SPA fallback
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
} else {
  app.get('*', (_req, res) => {
    res.set('Content-Type','text/html').status(200).send(`
      <!doctype html><html><head>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"/>
      <title>SocialScale / SmartFlow — Setup</title>
      <style>
        body{font-family:system-ui;background:#0b0b0b;color:#f5f5f5;margin:0;padding:40px}
        .card{max-width:760px;margin:0 auto;background:#111;border:1px solid #222;border-radius:12px;padding:20px}
        code{background:#151515;border:1px solid #2a2a2a;border-radius:6px;padding:2px 6px}
      </style></head><body>
      <div class="card">
        <h1>Build required</h1>
        <p>Your React UI isn't built yet. Run:</p>
        <pre><code>npm run build</code></pre>
        <p>Then <code>npm start</code> to serve <code>client/dist/</code> from Express on a single public port.</p>
        <p>Health: <a href="/health" style="color:#f5d67b">/health</a></p>
      </div>
      </body></html>
    `);
  });
}

// --- Port
const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`✅ Server up on :${PORT} — SPA hosting ${HAS_BUILD ? 'ENABLED' : 'PENDING BUILD'}`);
});