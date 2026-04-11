import { runtimeWiredViews } from '../runtime/runtime-wired-views';

export const roomsViewNext = {
  ...runtimeWiredViews.rooms,
  adapter: 'roomsPageAdapterNext',
  loader: 'roomsRuntimeEntry',
  actions: ['selectRoom', 'sendMessage', 'openCall'],
  migration: {
    from: 'roomsView',
    strategy: 'switch-view-to-runtime-wired-view'
  }
};
