export const profilePageAdapter = {
  page: 'profile',
  binding: 'profile',
  state: 'profile-state.json',
  dto: ['ProfileDto', 'SessionDto'],
  loaders: ['loadProfile', 'loadSessions']
};
