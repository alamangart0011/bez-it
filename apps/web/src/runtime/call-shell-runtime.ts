function buildCallHeader(pagePayload) {
  const header = pagePayload && pagePayload.header ? pagePayload.header : {};
  const content = pagePayload && pagePayload.content ? pagePayload.content : {};
  const currentCall = content.currentCall || null;

  return {
    title: header.title || (currentCall ? currentCall.title : 'Calls'),
    subtitle: header.subtitle || (currentCall ? currentCall.status || '' : 'idle'),
    callId: currentCall ? currentCall.id : null
  };
}

function buildParticipantGrid(pagePayload) {
  const content = pagePayload && pagePayload.content ? pagePayload.content : {};
  const participants = content.participants || [];

  return {
    items: participants,
    total: Array.isArray(participants) ? participants.length : 0
  };
}

function buildTranscriptPanel(pagePayload) {
  const rightPanel = pagePayload && pagePayload.rightPanel ? pagePayload.rightPanel : {};
  const sections = rightPanel.sections || {};

  return sections.transcript || null;
}

export function composeCallShellRuntime(pagePayload = {}) {
  const content = pagePayload.content || {};

  return {
    shell: 'callShell',
    header: buildCallHeader(pagePayload),
    sections: {
      callHeader: buildCallHeader(pagePayload),
      participantGrid: buildParticipantGrid(pagePayload),
      controls: content.controls || {},
      transcriptPanel: buildTranscriptPanel(pagePayload)
    },
    rightPanel: pagePayload.rightPanel || {},
    summary: pagePayload.summary || {}
  };
}
