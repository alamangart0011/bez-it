import { runtimeViewEntryIndex } from './runtime-view-entry-index';

export const runtimeWiredViews = {
  rooms: {
    key: 'roomsView',
    shell: 'roomShell',
    entry: runtimeViewEntryIndex.rooms,
    sections: ['roomHeader', 'messageList', 'composer', 'membersPanel']
  },
  calls: {
    key: 'callsView',
    shell: 'callShell',
    entry: runtimeViewEntryIndex.calls,
    sections: ['callHeader', 'participantGrid', 'controls', 'transcriptPanel']
  }
};
