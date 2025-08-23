// Fallback AI generator if Python is not running (uses OpenAI when available)
import fetch from 'node-fetch';

export async function generatePostsFallback({ topic, platform, count }: { topic: string; platform: 'x'|'linkedin'; count: number; }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const items = [] as Array<{ text: string; alt_text: string; hashtags: string[] }>;
  for (let i = 0; i < count; i++) {
    if (!apiKey) {
      items.push({
        text: `${platform.toUpperCase()} post about ${topic} (${i+1})`,
        alt_text: `Illustration about ${topic}`,
        hashtags: ['#ai', '#social']
      });
      continue;
    }
    const prompt = `Write a ${platform==='x'?'concise tweet <=280 chars':'LinkedIn post ~2-3 sentences'} about: ${topic}. Provide 1 line of hashtags.`;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });
    const j = await res.json() as any;
    const content: string = j.choices?.[0]?.message?.content ?? '';
    const [text, hashLine=''] = content.split('\n').map((s: string)=>s.trim());
    const hashtags = hashLine.split(/\s+/).filter(Boolean);
    items.push({ text, alt_text: `Alt for ${topic}`, hashtags });
  }
  return { ok: true, data: items };
}