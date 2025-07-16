export default async function handler(req, res) {
  const fetch = (await import('node-fetch')).default;

  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('Missing "url" parameter');

  try {
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://suitmedia-backend.suitdev.com',
        'Accept': 'image/webp,image/*,*/*;q=0.8'
      }
    });

    if (!imageResponse.ok) {
      return res.status(imageResponse.status).send('Failed to fetch image');
    }

    res.setHeader('Content-Type', imageResponse.headers.get('content-type'));
    imageResponse.body.pipe(res);
  } catch (err) {
    console.error("Image proxy error:", err);
    res.status(500).send('Failed to proxy image');
  }
}
