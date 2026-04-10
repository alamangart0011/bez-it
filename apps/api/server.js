const http = require('http');
const serverDispatch = require('./src/runtime/server-dispatch');
const runtimeResponse = require('./src/runtime/runtime-response');

const port = process.env.PORT || 3001;

function getPath(url = '/') {
  return url.split('?')[0] || '/';
}

const server = http.createServer((req, res) => {
  const path = getPath(req.url || '/');

  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, service: 'signalum-api', port }));
    return;
  }

  if (path === '/api/meta') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      product: 'SIGNALUM Voice AI Portal',
      mode: 'voice-first foundation',
      modules: ['auth', 'rooms', 'messages', 'calls', 'transcripts', 'assistants']
    }));
    return;
  }

  if (path.startsWith('/api/')) {
    const handled = serverDispatch.dispatch(req, res);
    if (handled) {
      return;
    }
  }

  runtimeResponse.notFound(res, `Route not found: ${path}`);
});

server.listen(port, () => {
  console.log(`signalum api listening on ${port}`);
});
