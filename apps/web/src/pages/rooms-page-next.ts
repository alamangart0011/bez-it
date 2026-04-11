import { runtimeWiredPages } from '../runtime/runtime-wired-pages';

export const roomsPageNext = {
  ...runtimeWiredPages.rooms,
  sections: ['Список комнат', 'Активная комната', 'Правая панель'],
  actions: ['Создать комнату', 'Войти в голос', 'Открыть чат'],
  states: ['empty', 'loaded', 'active'],
  migration: {
    from: 'roomsPage',
    strategy: 'switch-entry-to-runtime-wired-page'
  }
};
