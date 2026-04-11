const http = require('http');
const serverDispatch = require('./src/runtime/server-dispatch');
const runtimeResponse = require('./src/runtime/runtime-response');

const port = process.env.PORT || 3001;
const releaseVersion = process.env.RELEASE_VERSION || 'runtime-shadow';
const releaseChannel = process.env.RELEASE_CHANNEL || 'runtime-shadow';

function getPath(url = '/') {
  return url.split('?')[0] || '/';
}

function writeJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function writeHealth(res, path) {
  writeJson(res, 200, {
    ok: true,
    service: 'signalum-api',
    path,
    port,
    releaseVersion,
    releaseChannel
  });
}

const server = http.createServer((req, res) => {
  const path = getPath(req.url || '/');

  if (path === '/health' || path === '/api/health' || path === '/api/live' || path === '/api/ready') {
    writeHealth(res, path);
    return;
  }

  if (path === '/api/release') {
    writeJson(res, 200, {
      ok: true,
      product: 'SIGNALUM Voice AI Portal',
      releaseVersion,
      releaseChannel,
      transport: 'runtime-shadow'
    });
    return;
  }

  if (path === '/api/meta') {
    writeJson(res, 200, {
      product: 'SIGNALUM Voice AI Portal',
      mode: 'voice-first foundation',
      modules: ['auth', 'rooms', 'messages', 'calls', 'transcripts', 'assistants']
    });
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
