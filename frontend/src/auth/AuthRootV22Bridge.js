import { buildAuthApi, resolveAuthRoute } from './AuthV22AppBridge.js';

export function getAuthV22Context({ req, api, pathname = '' }) {
  return {
    A: buildAuthApi(req, api),
    route: resolveAuthRoute(pathname)
  };
}
