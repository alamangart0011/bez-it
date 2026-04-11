export function composeContentShellRuntime(pagePayload = {}) {
  const header = pagePayload.header || {};
  const content = pagePayload.content || {};

  return {
    shell: 'contentShell',
    zones: {
      pageHeader: header,
      mainContent: {
        activeRoom: content.activeRoom || null,
        currentCall: content.currentCall || null,
        rooms: content.rooms || [],
        participants: content.participants || []
      },
      composer: content.composer || content.controls || {},
      timeline: {
        messages: content.messages || [],
        transcript: content.transcript || null,
        assistant: content.assistant || null
      }
    },
    summary: pagePayload.summary || {}
  };
}
