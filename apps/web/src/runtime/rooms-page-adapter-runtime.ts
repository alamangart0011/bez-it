import { buildRoomsRuntimeView } from './rooms-view-runtime';

export async function adaptRoomsPageRuntime(params = {}, fetcher = fetch) {
  const runtimeView = await buildRoomsRuntimeView(params, fetcher);
  const shellSections = runtimeView.shellPayload ? runtimeView.shellPayload.sections || {} : {};

  return {
    page: 'rooms',
    adapter: 'roomsPageAdapter',
    runtimeView,
    shell: runtimeView.shellPayload ? runtimeView.shellPayload.shell : 'roomShell',
    header: shellSections.roomHeader || {},
    timeline: shellSections.messageList || {},
    composer: shellSections.composer || {},
    membersPanel: shellSections.membersPanel || {},
    rightPanel: runtimeView.rightPanel || {},
    summary: runtimeView.summary || {}
  };
}
