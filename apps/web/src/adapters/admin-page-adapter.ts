export const adminPageAdapter = {
  page: 'admin',
  binding: 'admin',
  state: 'admin-state.json',
  dto: ['OverviewDto', 'UserDto', 'AuditRowDto'],
  loaders: ['loadOverview', 'loadUsers', 'loadAudit']
};
