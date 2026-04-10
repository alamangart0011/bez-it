export const roomsCallFlow = {
  entry: 'rooms',
  transitions: [
    'selectRoom',
    'openCall',
    'joinCall',
    'openTranscript',
    'openAssistant'
  ],
  exit: 'profile'
};
