const routeDispatch = require('./route-dispatch');
const handlerMap = require('./handler-map');

module.exports = {
  routeDispatch,
  handlerMap,
  resolveDomain(url) {
    return routeDispatch[url] || null;
  },
  resolveHandler(url) {
    const domain = routeDispatch[url];
    return domain ? handlerMap[domain] || null : null;
  }
};
