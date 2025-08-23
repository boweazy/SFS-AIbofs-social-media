// Proxies to your existing Python generator if configured
import fetch from 'node-fetch';

export async function generateViaPython(input: {
  topic: string; platform: 'x'|'linkedin'; count: number;
}): Promise<any> {
  const base = process.env.PYTHON_SERVICE_URL;
  if (!base) throw new Error('PYTHON_SERVICE_URL not set');
  const res = await fetch(`${base.replace(/\/$/, '')}/api/generate_posts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Python service ${res.status}`);
  return res.json();
}