import { pageRuntimeAdapter } from './page-runtime-adapter';

function normalizeRoomsState(payload) {
  const data = payload && payload.data ? payload.data : {};
  const state = data.state || {};
  const rooms = state.rooms || [];
  const activeRoom = state.activeRoom || null;
  const members = state.members || [];
  const messages = state.messages || [];

  return {
    rooms,
    activeRoom,
    members,
    messages,
    counters: {
      rooms: rooms.length,
      members: members.length,
      messages: messages.length,
      unread: rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0)
    }
  };
}

export async function executeRoomsPage(params = {}, fetcher = fetch) {
  const hydrated = await pageRuntimeAdapter.hydrate('rooms', params, fetcher);
  const normalized = normalizeRoomsState(hydrated.payload);

  return {
    page: 'rooms',
    plan: hydrated.plan,
    payload: hydrated.payload,
    state: normalized,
    viewModel: {
      title: normalized.activeRoom ? normalized.activeRoom.title : 'Rooms',
      subtitle: normalized.activeRoom ? normalized.activeRoom.topic || 'Voice-first coordination' : 'Room workspace',
      canOpenCall: Boolean(hydrated.payload && hydrated.payload.data && hydrated.payload.data.actions && hydrated.payload.data.actions.openCall),
      rightPanelMode: 'members',
      summary: {
        rooms: normalized.counters.rooms,
        members: normalized.counters.members,
        messages: normalized.counters.messages,
        unread: normalized.counters.unread
      }
    }
  };
}
