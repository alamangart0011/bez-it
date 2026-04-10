export const callsPage = {
  title: 'Звонки',
  sections: ['Текущий звонок', 'История', 'Устройства'],
  actions: ['Начать звонок', 'Присоединиться', 'Завершить'],
  states: ['idle', 'connecting', 'active'],
  runtime: {
    page: 'calls',
    execute: 'executeCallsPage',
    hydrate: '/api/calls'
  }
};
