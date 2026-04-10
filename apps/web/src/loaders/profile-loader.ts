export const profileLoader = {
  domain: 'memberships',
  queries: ['getProfile', 'listSessions'],
  outputs: ['profile', 'sessions', 'settings'],
  next: ['hydrateMemberships', 'hydratePreferences']
};
