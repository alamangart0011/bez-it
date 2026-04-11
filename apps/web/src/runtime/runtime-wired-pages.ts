import { runtimePageEntryIndex } from './runtime-page-entry-index';

export const runtimeWiredPages = {
  rooms: {
    key: 'rooms',
    title: 'Комнаты',
    shell: 'roomShell',
    entry: runtimePageEntryIndex.rooms,
    runtime: {
      mode: 'page-runtime-entry',
      hydrate: '/api/rooms'
    }
  },
  calls: {
    key: 'calls',
    title: 'Звонки',
    shell: 'callShell',
    entry: runtimePageEntryIndex.calls,
    runtime: {
      mode: 'page-runtime-entry',
      hydrate: '/api/calls'
    }
  }
};
