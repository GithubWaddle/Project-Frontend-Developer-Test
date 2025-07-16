export default async function handler(req, res) {
  const fetch = (await import('node-fetch')).default;

  const query = new URLSearchParams(req.query).toString();
  const url = `https://suitmedia-backend.suitdev.com/api/ideas?${query}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' }
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching ideas:", err);
    res.status(500).json({ error: 'Failed to fetch ideas' });
  }
}
