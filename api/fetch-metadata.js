// api/fetch-metadata.js
import fetch from 'node-fetch';

function extractMeta(html, name) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=(?:'|")${name}(?:'|")[^>]*content=(?:'|")([^'"]+)(?:'|")`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    const html = await r.text();
    const title = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title') || (html.match(/<title>(.*?)<\/title>/i)||[])[1];
    const image = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image');
    // price heuristics — try to find meta itemprop price
    const priceMatch = html.match(/"price"\s*:\s*"?(\\d[\d.,]*)"?/i) || html.match(/itemprop="price" content="([^"]+)"/i);
    const price = priceMatch ? priceMatch[1] : null;
    return res.status(200).json({ title, image, price });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
