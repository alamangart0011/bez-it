export const roomsCallFlow = {
  entry: 'rooms',
  transitions: [
    'selectRoom',
    'openCall',
    'joinCall',
    'openTranscript',
    'openAssistant'
  ],
  exit: 'profile',
  runtime: {
    execute: 'executeRoomsCallFlow',
    chain: ['rooms', 'calls', 'transcript', 'assistant']
  }
};
