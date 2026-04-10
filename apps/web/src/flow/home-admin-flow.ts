export const homeAdminFlow = {
  entry: 'home',
  transitions: [
    'openRooms',
    'openCalls',
    'openProfile',
    'openAdmin'
  ],
  exit: 'admin'
};
