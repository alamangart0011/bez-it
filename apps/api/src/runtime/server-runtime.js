const routeDispatch = require('./route-dispatch');
const handlerMap = require('./handler-map');

function normalizeUrl(url = '/') {
  const [pathname] = url.split('?');

  if (!pathname) {
    return '/';
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function resolveRoute(url) {
  const normalized = normalizeUrl(url);

  const match = Object.entries(routeDispatch).find(([route]) => {
    return normalized === route || normalized.startsWith(`${route}/`);
  });

  return match || null;
}

module.exports = {
  routeDispatch,
  handlerMap,
  normalizeUrl,
  resolveRoute,
  resolveDomain(url) {
    const match = resolveRoute(url);
    return match ? match[1] : null;
  },
  resolveHandler(url) {
    const match = resolveRoute(url);
    return match ? handlerMap[match[1]] || null : null;
  }
};
