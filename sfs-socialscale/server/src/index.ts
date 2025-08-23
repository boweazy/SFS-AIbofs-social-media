import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { api } from './routes.js';
import { initRealtime } from './realtime.js';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));

app.use('/api', api);

const server = http.createServer(app);
initRealtime(server);

const port = Number(process.env.PORT || 8787);
server.listen(port, () => console.log(`[server] listening on :${port}`));