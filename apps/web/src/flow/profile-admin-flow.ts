export const profileAdminFlow = {
  entry: 'profile',
  transitions: [
    'openSettings',
    'openSessions',
    'openAdmin',
    'openAudit'
  ],
  exit: 'rooms'
};
