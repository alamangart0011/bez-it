export const appFlowMap = {
  home: ['rooms', 'calls', 'profile'],
  rooms: ['calls', 'profile'],
  calls: ['transcript', 'assistant', 'profile'],
  profile: ['settings', 'rooms'],
  admin: ['rooms', 'profile', 'audit']
};
