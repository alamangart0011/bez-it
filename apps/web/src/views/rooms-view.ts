export const roomsView = {
  shell: 'roomShell',
  adapter: 'roomsPageAdapter',
  loader: 'roomsLoader',
  sections: ['roomHeader', 'messageList', 'composer', 'membersPanel'],
  actions: ['selectRoom', 'sendMessage', 'openCall']
};
