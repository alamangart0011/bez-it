const serverRuntime = require('./server-runtime');
const runtimeResponse = require('./runtime-response');

module.exports = {
  dispatch(req, res) {
    const domain = serverRuntime.resolveDomain(req.url || '/');
    const handler = serverRuntime.resolveHandler(req.url || '/');

    if (!domain) {
      return false;
    }

    if (!handler || typeof handler.handle !== 'function') {
      return runtimeResponse.ok(res, {
        routed: true,
        domain,
        runtime: 'pending'
      });
    }

    handler.handle(req, res, {
      domain,
      runtime: serverRuntime,
      runtimeResponse
    });

    return true;
  }
};
