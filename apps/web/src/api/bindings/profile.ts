export const profileBinding = {
  page: 'profile',
  domain: 'memberships',
  endpoint: '/api/profile',
  queries: ['getProfile', 'listSessions'],
  commands: ['saveProfile'],
  buildRequest() {
    return this.endpoint;
  }
};
