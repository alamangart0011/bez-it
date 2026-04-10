export const callsBinding = {
  page: 'calls',
  domain: 'calls',
  endpoint: '/api/calls',
  queries: ['getCallState', 'listCalls'],
  commands: ['openCall'],
  buildRequest(params = {}) {
    const roomId = params.roomId ? '?roomId=' + params.roomId : '';
    return this.endpoint + roomId;
  }
};
