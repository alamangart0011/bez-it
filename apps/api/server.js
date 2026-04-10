const http = require('http');

const port = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, service: 'signalum-api', port }));
    return;
  }

  if (url === '/api/meta') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      product: 'SIGNALUM Voice AI Portal',
      mode: 'voice-first foundation',
      modules: ['auth', 'rooms', 'messages', 'calls', 'transcripts', 'assistants']
    }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ message: 'SIGNALUM API skeleton is running' }));
});

server.listen(port, () => {
  console.log(`signalum api listening on ${port}`);
});
