import { appRuntimeIndex } from './app-runtime-index';
import { buildPageRuntimePlan } from './runtime-page-plan';
import { fetchRuntimePage } from './runtime-http-client';

export const pageRuntimeAdapter = {
  resolve(page) {
    return appRuntimeIndex[page] || null;
  },
  bind(page, params = {}) {
    const view = appRuntimeIndex[page];
    const plan = buildPageRuntimePlan(page, params);
    if (!view || !plan) return null;

    return {
      shell: view.shell,
      loader: view.loader,
      actions: view.actions,
      runtime: plan
    };
  },
  resolvePlan(page, params = {}) {
    return buildPageRuntimePlan(page, params);
  },
  async hydrate(page, params = {}, fetcher = fetch) {
    return fetchRuntimePage(page, params, fetcher);
  }
};
