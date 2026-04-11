import { pageRuntimeAdapter } from '../runtime/page-runtime-adapter';

export async function executeRoomsCallFlow(params = {}, fetcher = fetch) {
  const rooms = await pageRuntimeAdapter.execute('rooms', params, fetcher);
  const activeRoomId = params.roomId || (rooms && rooms.state && rooms.state.activeRoom ? rooms.state.activeRoom.id : null);
  const calls = await pageRuntimeAdapter.execute('calls', { roomId: activeRoomId }, fetcher);
  const transcript = await pageRuntimeAdapter.execute('transcript', { roomId: activeRoomId }, fetcher);
  const assistant = await pageRuntimeAdapter.execute('assistant', { roomId: activeRoomId }, fetcher);

  return {
    flow: 'rooms-call',
    rooms,
    calls,
    transcript,
    assistant,
    ui: {
      activeRoomId,
      shell: 'callShell',
      rightPanel: ['transcript', 'assistant']
    },
    summary: {
      roomTitle: rooms && rooms.viewModel ? rooms.viewModel.title : null,
      callTitle: calls && calls.viewModel ? calls.viewModel.title : null,
      transcriptTitle: transcript && transcript.viewModel ? transcript.viewModel.title : null,
      assistantTitle: assistant && assistant.viewModel ? assistant.viewModel.title : null
    }
  };
}
