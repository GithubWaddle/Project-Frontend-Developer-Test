const express = require('express');
const path = require('path');

const expressApplication = express();
const serverPortNumber = process.env.PORT || 3000;

expressApplication.use(express.static(path.join(__dirname, '../public')));

expressApplication.use((httpRequest, httpResponse, nextMiddleware) => {
  httpResponse.setHeader('Access-Control-Allow-Origin', '*');
  nextMiddleware();
});

const fetchFromRemote = (...fetchArguments) =>
  import('node-fetch').then(fetchModule => fetchModule.default(...fetchArguments));

expressApplication.get('/api/ideas', async (httpRequest, httpResponse) => {
  const queryParameters = Object.entries(httpRequest.query)
  .flatMap(([queryKey, queryValue]) =>
    Array.isArray(queryValue)
      ? queryValue.map(value => [queryKey, value])
      : [[queryKey, queryValue]]
  );

  const queryString = new URLSearchParams(queryParameters).toString();
  const remoteApiUrl = `https://suitmedia-backend.suitdev.com/api/ideas?${queryString}`;

  try {
    const remoteApiResponse = await fetchFromRemote(remoteApiUrl, {
      headers: {
        Accept: 'application/json'
      }
    });

    const parsedApiResponseData = await remoteApiResponse.json();
    httpResponse.json(parsedApiResponseData);
  } catch (apiFetchError) {
    console.error("API fetch error:", apiFetchError);
    httpResponse.status(500).json({ error: 'Failed to fetch API data' });
  }
});

expressApplication.get('/proxy-image', async (httpRequest, httpResponse) => {
  const remoteImageUrl = httpRequest.query.url;

  if (!remoteImageUrl) {
    return httpResponse.status(400).send('Missing "url" query parameter');
  }

  try {
    const remoteImageResponse = await fetchFromRemote(remoteImageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://suitmedia-backend.suitdev.com',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://suitmedia-backend.suitdev.com'
      }
    });

    if (!remoteImageResponse.ok) {
      return httpResponse.status(remoteImageResponse.status).send('Failed to fetch image');
    }

    const contentTypeHeader = remoteImageResponse.headers.get('content-type');
    httpResponse.setHeader('Content-Type', contentTypeHeader);

    remoteImageResponse.body.pipe(httpResponse);
  } catch (error) {
    console.error('Error proxying image:', error);
    httpResponse.status(500).send('Failed to fetch image');
  }
});

/* LOCAL RUNNING */
expressApplication.listen(serverPortNumber, () => {
  console.log(`Proxy server is running at http://localhost:${serverPortNumber}`);
});
