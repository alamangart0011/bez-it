function send(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

module.exports = {
  send,
  ok(res, data) {
    return send(res, 200, { ok: true, data });
  },
  error(res, message, statusCode = 500, details = null) {
    return send(res, statusCode, {
      ok: false,
      error: message,
      details
    });
  },
  notFound(res, message = 'Route not found') {
    return send(res, 404, {
      ok: false,
      error: message
    });
  },
  methodNotAllowed(res, message = 'Method not allowed') {
    return send(res, 405, {
      ok: false,
      error: message
    });
  }
};
