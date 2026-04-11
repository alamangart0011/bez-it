import { executeRoomsPage } from './rooms-runtime-execution';
import { buildRightPanelRuntimeSections } from './right-panel-runtime-sections';

function buildComposerModel(execution) {
  const activeRoom = execution && execution.state ? execution.state.activeRoom || null : null;
  const payloadActions = execution && execution.payload && execution.payload.data ? execution.payload.data.actions || {} : {};

  return {
    roomId: activeRoom ? activeRoom.id : null,
    canOpenCall: execution && execution.viewModel ? Boolean(execution.viewModel.canOpenCall) : false,
    actions: payloadActions
  };
}

export async function loadRoomsPageRuntime(params = {}, fetcher = fetch) {
  const execution = await executeRoomsPage(params, fetcher);
  const activeRoom = execution && execution.state ? execution.state.activeRoom || null : null;

  return {
    page: 'rooms',
    shell: 'roomShell',
    execution,
    header: {
      title: execution && execution.viewModel ? execution.viewModel.title : 'Rooms',
      subtitle: execution && execution.viewModel ? execution.viewModel.subtitle : 'Room workspace'
    },
    content: {
      rooms: execution && execution.state ? execution.state.rooms || [] : [],
      activeRoom,
      messages: execution && execution.state ? execution.state.messages || [] : [],
      composer: buildComposerModel(execution)
    },
    rightPanel: buildRightPanelRuntimeSections({
      page: 'rooms',
      rooms: execution
    }),
    summary: execution && execution.viewModel ? execution.viewModel.summary || {} : {}
  };
}
