export const adminBinding = {
  page: 'admin',
  domain: 'actions',
  endpoint: '/api/actions',
  queries: ['getOverview', 'listUsers', 'listRooms', 'listAudit'],
  commands: ['openAdmin'],
  buildRequest() {
    return this.endpoint;
  }
};
