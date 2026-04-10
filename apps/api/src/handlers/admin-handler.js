module.exports = {
  domain: 'actions',
  handlers: {
    getOverview: 'getOverview',
    listUsers: 'listUsers',
    listRooms: 'listRooms',
    listAudit: 'listAudit',
    inviteUser: 'inviteUser'
  },
  handle(req, res, ctx) {
    if (req.method !== 'GET') {
      return ctx.runtimeResponse.methodNotAllowed(res, 'Method not allowed for actions');
    }
    return ctx.runtimeResponse.ok(res, {
      page: 'admin',
      binding: 'actions',
      state: {
        overview: { usersCount: 8, roomsCount: 3, pendingInvitations: 2, activeCalls: 1 },
        users: [
          { id: 'user-admin', displayName: 'Administrator', role: 'super-admin', status: 'online' },
          { id: 'user-voice', displayName: 'Voice Coordinator', role: 'moderator', status: 'online' }
        ],
        rooms: [
          { id: 'room-ops', title: 'General Control', kind: 'chat' },
          { id: 'room-voice', title: 'Voice Control', kind: 'voice' }
        ],
        auditRows: [
          { id: 'audit-1', action: 'runtime.rooms.live', actor: 'system' },
          { id: 'audit-2', action: 'runtime.calls.live', actor: 'system' }
        ]
      },
      ui: { isLoading: false },
      actions: {
        openRoomCreate: '/api/actions/rooms/create',
        inviteUser: '/api/actions/invite',
        openAudit: '/api/actions/audit'
      },
      flow: { current: 'admin', next: ['rooms'] }
    });
  }
};
