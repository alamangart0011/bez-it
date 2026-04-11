import { buildCallsRuntimeView } from './calls-view-runtime';

export async function adaptCallsPageRuntime(params = {}, fetcher = fetch) {
  const runtimeView = await buildCallsRuntimeView(params, fetcher);
  const shellSections = runtimeView.shellPayload ? runtimeView.shellPayload.sections || {} : {};

  return {
    page: 'calls',
    adapter: 'callsPageAdapter',
    runtimeView,
    shell: runtimeView.shellPayload ? runtimeView.shellPayload.shell : 'callShell',
    header: shellSections.callHeader || {},
    participantGrid: shellSections.participantGrid || {},
    controls: shellSections.controls || {},
    transcriptPanel: shellSections.transcriptPanel || {},
    rightPanel: runtimeView.rightPanel || {},
    summary: runtimeView.summary || {}
  };
}
