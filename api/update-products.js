// api/update-products.js
import fetch from 'node-fetch';

const OWNER = 'YOUR_GITHUB_USERNAME';
const REPO = 'YOUR_REPO';
const PATH = 'data/products.json';
const BRANCH = 'main';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminPass = process.env.ADMIN_PASSWORD;
  const provided = req.headers['x-admin-password'] || req.body.adminPassword;
  if (!provided || provided !== adminPass) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'Server not configured (no token)' });

  const products = req.body.products;
  if (!products) return res.status(400).json({ error: 'Missing products' });

  try {
    // 1) Get current file SHA (if exists)
    const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`;
    const getRes = await fetch(getUrl, { headers: { Authorization: `token ${token}`, 'User-Agent': 'vercel' } });
    let sha = null;
    if (getRes.status === 200) {
      const js = await getRes.json();
      sha = js.sha;
    }

    const content = Buffer.from(JSON.stringify(products, null, 2)).toString('base64');

    const commitMsg = req.body.message || 'Update products via web UI';

    const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'vercel'
      },
      body: JSON.stringify({
        message: commitMsg,
        content,
        branch: BRANCH,
        sha: sha || undefined
      })
    });

    const putJson = await putRes.json();
    if (putRes.status >= 400) return res.status(putRes.status).json(putJson);
    return res.status(200).json({ ok: true, result: putJson });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
