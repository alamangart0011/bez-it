export const appFlowMap = {
  home: ['rooms', 'calls', 'profile'],
  rooms: ['calls', 'messages', 'profile'],
  calls: ['transcript', 'assistant', 'profile'],
  profile: ['settings', 'rooms'],
  admin: ['rooms', 'profile', 'audit']
};
