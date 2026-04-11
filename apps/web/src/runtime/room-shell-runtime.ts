function buildRoomHeader(pagePayload) {
  const header = pagePayload && pagePayload.header ? pagePayload.header : {};
  const content = pagePayload && pagePayload.content ? pagePayload.content : {};
  const activeRoom = content.activeRoom || null;

  return {
    title: header.title || (activeRoom ? activeRoom.title : 'Rooms'),
    subtitle: header.subtitle || (activeRoom ? activeRoom.topic || '' : 'Room workspace'),
    roomId: activeRoom ? activeRoom.id : null
  };
}

function buildRoomTimeline(pagePayload) {
  const content = pagePayload && pagePayload.content ? pagePayload.content : {};

  return {
    messages: content.messages || [],
    total: Array.isArray(content.messages) ? content.messages.length : 0
  };
}

function buildRoomMembers(pagePayload) {
  const rightPanel = pagePayload && pagePayload.rightPanel ? pagePayload.rightPanel : {};
  const sections = rightPanel.sections || {};
  const members = sections.members || {};

  return {
    items: members.items || [],
    counters: members.counters || { total: 0 }
  };
}

export function composeRoomShellRuntime(pagePayload = {}) {
  const content = pagePayload.content || {};

  return {
    shell: 'roomShell',
    header: buildRoomHeader(pagePayload),
    sections: {
      roomHeader: buildRoomHeader(pagePayload),
      messageList: buildRoomTimeline(pagePayload),
      composer: content.composer || {},
      membersPanel: buildRoomMembers(pagePayload)
    },
    rightPanel: pagePayload.rightPanel || {},
    summary: pagePayload.summary || {}
  };
}
