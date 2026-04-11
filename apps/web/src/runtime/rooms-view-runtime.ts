import { loadRoomsPageRuntime } from './rooms-page-runtime-entry';
import { composeRoomShellRuntime } from './room-shell-runtime';

export async function buildRoomsRuntimeView(params = {}, fetcher = fetch) {
  const pagePayload = await loadRoomsPageRuntime(params, fetcher);
  const shellPayload = composeRoomShellRuntime(pagePayload);

  return {
    page: 'rooms',
    view: 'roomsView',
    pagePayload,
    shellPayload,
    sections: shellPayload.sections,
    rightPanel: shellPayload.rightPanel,
    summary: shellPayload.summary
  };
}
