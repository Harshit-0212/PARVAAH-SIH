import http from 'node:http';
import { app } from './src/app.ts';

const server = http.createServer(app);
server.listen(0, '127.0.0.1', async () => {
  const port = (server.address() as any).port;
  const req = http.request(
    {
      host: '127.0.0.1',
      port,
      path: '/api/v1/integrations/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    },
    (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        console.log('STATUS', res.statusCode);
        console.log(raw);
        server.close();
      });
    }
  );

  req.on('error', (err) => {
    console.error(err);
    server.close();
  });

  req.end();
});
