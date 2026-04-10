export const callsPageAdapter = {
  page: 'calls',
  binding: 'calls',
  state: 'calls-state.json',
  dto: ['CallSessionDto', 'ParticipantStateDto'],
  loaders: ['loadCalls', 'loadCurrentCall']
};
