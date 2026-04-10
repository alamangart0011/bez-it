export const roomsBinding = {
  page: 'rooms',
  domain: 'rooms',
  endpoint: '/api/rooms',
  queries: ['listRooms', 'getRoom'],
  commands: ['createRoom', 'joinRoom', 'leaveRoom'],
  buildRequest(params = {}) {
    const roomId = params.roomId ? '?roomId=' + params.roomId : '';
    return this.endpoint + roomId;
  }
};
