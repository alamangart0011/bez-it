import { runtimeWiredViews } from '../runtime/runtime-wired-views';

export const callsViewNext = {
  ...runtimeWiredViews.calls,
  adapter: 'callsPageAdapterNext',
  loader: 'callsRuntimeEntry',
  actions: ['joinCall', 'leaveCall', 'toggleMute', 'openAssistant'],
  migration: {
    from: 'callsView',
    strategy: 'switch-view-to-runtime-wired-view'
  }
};
