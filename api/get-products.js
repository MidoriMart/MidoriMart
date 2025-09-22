// api/get-products.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    // raw file URL trên GitHub (sửa YOUR_USER và REPO)
    const rawUrl = 'https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO/main/data/products.json';
    const r = await fetch(rawUrl);
    if (!r.ok) return res.status(500).json({ error: 'Cannot fetch products' });
    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
