import { runtimeAdapterEntryIndex } from './runtime-adapter-entry-index';

export const runtimeWiredAdapters = {
  rooms: {
    key: 'roomsPageAdapter',
    entry: runtimeAdapterEntryIndex.rooms,
    shell: 'roomShell',
    outputs: ['header', 'timeline', 'composer', 'membersPanel', 'rightPanel', 'summary']
  },
  calls: {
    key: 'callsPageAdapter',
    entry: runtimeAdapterEntryIndex.calls,
    shell: 'callShell',
    outputs: ['header', 'participantGrid', 'controls', 'transcriptPanel', 'rightPanel', 'summary']
  }
};
