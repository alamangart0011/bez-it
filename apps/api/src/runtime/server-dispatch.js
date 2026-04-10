const serverRuntime = require('./server-runtime');
const runtimeResponse = require('./runtime-response');

module.exports = {
  dispatch(req, res) {
    const url = req.url || '/';
    const domain = serverRuntime.resolveDomain(url);
    const handler = serverRuntime.resolveHandler(url);

    if (!domain || !handler) {
      return false;
    }

    return runtimeResponse.ok(res, {
      routed: true,
      domain,
      handler
    });
  }
};
