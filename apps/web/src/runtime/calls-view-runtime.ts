import { loadCallsPageRuntime } from './calls-page-runtime-entry';
import { composeCallShellRuntime } from './call-shell-runtime';

export async function buildCallsRuntimeView(params = {}, fetcher = fetch) {
  const pagePayload = await loadCallsPageRuntime(params, fetcher);
  const shellPayload = composeCallShellRuntime(pagePayload);

  return {
    page: 'calls',
    view: 'callsView',
    pagePayload,
    shellPayload,
    sections: shellPayload.sections,
    rightPanel: shellPayload.rightPanel,
    summary: shellPayload.summary
  };
}
