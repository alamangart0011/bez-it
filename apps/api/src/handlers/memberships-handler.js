module.exports = {
  domain: 'memberships',
  handlers: {
    getProfile: 'getProfile',
    listSessions: 'listSessions',
    updateProfile: 'updateProfile',
    openSettings: 'openSettings'
  },
  handle(req, res, ctx) {
    if (req.method !== 'GET') {
      return ctx.runtimeResponse.methodNotAllowed(res, 'Method not allowed for memberships');
    }
    return ctx.runtimeResponse.ok(res, {
      page: 'profile',
      binding: 'memberships',
      state: {
        profile: {
          id: 'user-admin',
          displayName: 'Administrator',
          title: 'System Owner',
          role: 'super-admin',
          status: 'online'
        },
        sessions: [
          { id: 'session-main', title: 'Main Session', status: 'active' },
          { id: 'session-backup', title: 'Backup Session', status: 'recent' }
        ],
        settings: {
          locale: 'en',
          theme: 'dark'
        }
      },
      ui: { isLoading: false },
      actions: {
        saveProfile: '/api/profile',
        openSettings: '/api/profile/settings'
      },
      flow: {
        current: 'profile',
        next: ['rooms']
      }
    });
  }
};
