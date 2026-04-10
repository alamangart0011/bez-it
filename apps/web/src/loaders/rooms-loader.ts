export const roomsLoader = {
  domain: 'rooms',
  queries: ['listRooms', 'getRoom'],
  outputs: ['rooms', 'activeRoom', 'members'],
  next: ['hydrateMessages', 'hydratePresence']
};
