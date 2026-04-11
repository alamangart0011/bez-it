import { runtimeWiredAdapters } from '../runtime/runtime-wired-adapters';

export const callsPageAdapterNext = {
  ...runtimeWiredAdapters.calls,
  state: 'calls-runtime-state',
  migration: {
    from: 'callsPageAdapter',
    strategy: 'switch-adapter-to-runtime-wired-adapter'
  }
};
