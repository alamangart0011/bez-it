function sanitizePath(originalUrl = '') {
  return String(originalUrl || '').replace(/(token=)[^&]+/gi, '$1***');
}

export function accessLog(req, res, next) {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const payload = {
      ts: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : 'info',
      requestId: req.requestId || null,
      method: req.method,
      path: sanitizePath(req.originalUrl || req.url),
      status: res.statusCode,
      durationMs,
      ip: String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim() || 'unknown',
      userId: req.user?.sub || null,
      userAgent: req.headers['user-agent'] || null
    };

    console.log(JSON.stringify(payload));
  });

  next();
}
