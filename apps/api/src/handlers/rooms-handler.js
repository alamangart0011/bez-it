function buildRooms(roomId) {
  const generatedAt = new Date().toISOString();
  const rooms = [
    { id: 'room-ops', code: 'ops', title: 'General Control', kind: 'chat', unreadCount: 2, membersCount: 4, callAvailable: true, lastActivityAt: generatedAt },
    { id: 'room-voice', code: 'voice', title: 'Voice Control', kind: 'voice', unreadCount: 0, membersCount: 3, callAvailable: true, lastActivityAt: generatedAt },
    { id: 'room-meeting', code: 'meeting', title: 'Meeting Hall', kind: 'meeting', unreadCount: 1, membersCount: 6, callAvailable: true, lastActivityAt: generatedAt }
  ];
  const activeRoom = rooms.find((item) => item.id === roomId || item.code === roomId) || rooms[0];
  const membersByRoom = {
    'room-ops': [
      { id: 'user-admin', displayName: 'Administrator', role: 'owner', presence: 'online', voiceState: 'ready' },
      { id: 'user-voice', displayName: 'Voice Coordinator', role: 'moderator', presence: 'online', voiceState: 'speaking' },
      { id: 'user-ai', displayName: 'AI Assistant', role: 'assistant', presence: 'online', voiceState: 'listening' }
    ],
    'room-voice': [
      { id: 'user-admin', displayName: 'Administrator', role: 'owner', presence: 'online', voiceState: 'ready' },
      { id: 'user-voice', displayName: 'Voice Coordinator', role: 'moderator', presence: 'online', voiceState: 'speaking' },
      { id: 'user-observer', displayName: 'Observer', role: 'member', presence: 'online', voiceState: 'muted' }
    ],
    'room-meeting': [
      { id: 'user-admin', displayName: 'Administrator', role: 'host', presence: 'online', voiceState: 'ready' },
      { id: 'user-ai', displayName: 'AI Assistant', role: 'assistant', presence: 'online', voiceState: 'listening' }
    ]
  };
  const messagesByRoom = {
    'room-ops': [
      { id: 'msg-1', authorId: 'user-admin', authorName: 'Administrator', body: 'Runtime dispatch is now serving rooms state.', createdAt: generatedAt },
      { id: 'msg-2', authorId: 'user-voice', authorName: 'Voice Coordinator', body: 'Next step is calls, transcripts and assistant flow.', createdAt: generatedAt }
    ],
    'room-voice': [
      { id: 'msg-3', authorId: 'user-voice', authorName: 'Voice Coordinator', body: 'Voice room is ready for calls runtime.', createdAt: generatedAt }
    ],
    'room-meeting': [
      { id: 'msg-4', authorId: 'user-admin', authorName: 'Administrator', body: 'Meeting room is waiting for transcript runtime.', createdAt: generatedAt }
    ]
  };
  return {
    page: 'rooms',
    binding: 'rooms',
    state: {
      rooms: rooms,
      activeRoom: { id: activeRoom.id, code: activeRoom.code, title: activeRoom.title, kind: activeRoom.kind, unreadCount: activeRoom.unreadCount, membersCount: activeRoom.membersCount, callAvailable: activeRoom.callAvailable, lastActivityAt: activeRoom.lastActivityAt, topic: 'Voice-first coordination', nextCallEndpoint: '/api/calls?roomId=' + activeRoom.id },
      members: membersByRoom[activeRoom.id] || [],
      messages: messagesByRoom[activeRoom.id] || []
    },
    ui: {
      isLoading: false,
      isConnecting: false,
      composerState: { draft: '', canSend: true, placeholder: 'Write a message to ' + activeRoom.title }
    },
    actions: {
      selectRoom: '/api/rooms?roomId={roomId}',
      refreshRoom: '/api/rooms?roomId={roomId}',
      openCall: '/api/calls?roomId={roomId}',
      sendMessage: '/api/rooms/{roomId}/messages'
    },
    flow: { current: 'rooms', next: ['calls', 'transcripts', 'assistant'] },
    meta: { handler: 'listRooms', generatedAt: generatedAt }
  };
}

module.exports = {
  domain: 'rooms',
  handlers: {
    listRooms: 'listRooms',
    getRoom: 'getRoom',
    createRoom: 'createRoom',
    joinRoom: 'joinRoom',
    leaveRoom: 'leaveRoom'
  },
  handle(req, res, ctx) {
    if (req.method !== 'GET') {
      return ctx.runtimeResponse.methodNotAllowed(res, 'Method not allowed for /api/rooms');
    }
    const requestUrl = new URL(req.url, 'http://signalum.local');
    const roomId = requestUrl.searchParams.get('roomId');
    return ctx.runtimeResponse.ok(res, buildRooms(roomId));
  }
};
