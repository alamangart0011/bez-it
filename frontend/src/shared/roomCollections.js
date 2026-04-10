import { ROOM_KINDS } from './runtimeConstants';

export function splitRoomsByKind(rooms = []) {
  const textRooms = rooms.filter(
    (room) =>
      room.kind === ROOM_KINDS.GROUP ||
      room.kind === 'dm' ||
      room.kind === 'text' ||
      !room.kind
  );

  const voiceRooms = rooms.filter((room) => room.kind === ROOM_KINDS.VOICE);
  const meetingRooms = rooms.filter((room) => room.kind === ROOM_KINDS.MEETING);

  return {
    textRooms,
    voiceRooms,
    meetingRooms,
  };
}

export function buildDepartmentMap(members = []) {
  return members.reduce((acc, member) => {
    const department = member.department || 'Сотрудники';
    if (!acc[department]) acc[department] = [];
    acc[department].push(member);
    return acc;
  }, {});
}
