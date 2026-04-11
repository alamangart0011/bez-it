import { runtimeWiredAdapters } from '../runtime/runtime-wired-adapters';

export const roomsPageAdapterNext = {
  ...runtimeWiredAdapters.rooms,
  state: 'rooms-runtime-state',
  migration: {
    from: 'roomsPageAdapter',
    strategy: 'switch-adapter-to-runtime-wired-adapter'
  }
};
