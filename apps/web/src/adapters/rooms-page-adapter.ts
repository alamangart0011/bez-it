export const roomsPageAdapter = {
  page: 'rooms',
  binding: 'rooms',
  state: 'rooms-state.json',
  dto: ['RoomDto', 'RoomMemberDto'],
  loaders: ['loadRooms', 'loadActiveRoom']
};
