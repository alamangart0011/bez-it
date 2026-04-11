import { runtimeWiredPages } from '../runtime/runtime-wired-pages';

export const callsPageNext = {
  ...runtimeWiredPages.calls,
  sections: ['Текущий звонок', 'История', 'Устройства'],
  actions: ['Начать звонок', 'Присоединиться', 'Завершить'],
  states: ['idle', 'connecting', 'active'],
  migration: {
    from: 'callsPage',
    strategy: 'switch-entry-to-runtime-wired-page'
  }
};
