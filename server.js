import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Why helmet/compression: better security + perf out‑of‑the‑box.
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'", "'unsafe-inline'"],
      "connect-src": ["'self'", "https://api.openai.com"],
      "img-src": ["'self'", "data:"],
      "style-src": ["'self'", "'unsafe-inline'"]
    }
  }
}));
app.use(compression());
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// Why limit: prevent abuse / surprise bills.
const limiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Static
app.use('/static', express.static(path.join(__dirname, 'static')));

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// === SmartFlow System Prompt (short, sharp, brand-aligned) ===
// Why: consistent persona + safer outputs + task orientation.
const SMARTFLOW_SYSTEM_PROMPT = `
You are SmartFlow, a crisp, helpful AI that solves tasks quickly without fluff.
Style: concise, confident, premium. If code is requested, return complete, runnable code.
Safety: refuse disallowed content; suggest safe alternatives. Never invent facts.
UX: break down plans in short steps, then deliver the answer. Prefer readable, maintainable code.
Brand voice: clear, modern, respectful; avoid hype.`;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in environment.');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'gpt-4o-mini', temperature = 0.3, max_tokens = 800 } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Why sanitize: avoid prompt injection via user content.
    const trimmed = messages.map(m => ({
      role: m.role,
      content: String(m.content || '').slice(0, 4000)
    })).slice(-12); // keep last 12 turns to control cost

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens,
        messages: [
          { role: 'system', content: SMARTFLOW_SYSTEM_PROMPT },
          ...trimmed
        ]
      })
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      return res.status(openaiRes.status).json({ error: 'Upstream error', details: text });
    }

    const data = await openaiRes.json();
    const answer = data?.choices?.[0]?.message?.content ?? '';
    res.json({ answer, usage: data?.usage ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SmartFlow running → http://localhost:${PORT}`));