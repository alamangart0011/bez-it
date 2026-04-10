export const adminLoader = {
  domain: 'actions',
  queries: ['getOverview', 'listUsers', 'listRooms', 'listAudit'],
  outputs: ['overview', 'users', 'rooms', 'auditRows'],
  next: ['hydrateRoles', 'hydrateInvitations']
};
