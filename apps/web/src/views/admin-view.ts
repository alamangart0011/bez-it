export const adminView = {
  shell: 'contentShell',
  adapter: 'adminPageAdapter',
  loader: 'adminLoader',
  sections: ['adminHeader', 'overviewCards', 'usersTable', 'auditTable'],
  actions: ['openRoomCreate', 'inviteUser', 'openAudit']
};
