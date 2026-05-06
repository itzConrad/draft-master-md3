import { createServer } from 'http';
import { createServerEntry } from './dist/server/index.js';

const port = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  try {
    const response = await createServerEntry({
      request: new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
      }),
    });

    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
