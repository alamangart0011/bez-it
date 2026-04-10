export const callsLoader = {
  domain: 'calls',
  queries: ['listCalls', 'getCallState'],
  outputs: ['currentCall', 'participants', 'devices'],
  next: ['hydrateTranscript', 'hydrateAssistant']
};
