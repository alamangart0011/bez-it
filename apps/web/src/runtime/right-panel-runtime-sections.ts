function buildTranscriptSection(transcript) {
  if (!transcript) return null;

  return {
    title: transcript.viewModel ? transcript.viewModel.title : 'Transcript',
    subtitle: transcript.viewModel ? transcript.viewModel.subtitle : '',
    chunks: transcript.state ? transcript.state.chunks || [] : [],
    summaryBullets: transcript.viewModel ? transcript.viewModel.summaryBullets || [] : [],
    counters: transcript.viewModel ? transcript.viewModel.counters || {} : transcript.state ? transcript.state.counters || {} : {}
  };
}

function buildAssistantSection(assistant) {
  if (!assistant) return null;

  return {
    title: assistant.viewModel ? assistant.viewModel.title : 'Assistant',
    subtitle: assistant.viewModel ? assistant.viewModel.subtitle : '',
    answer: assistant.state ? assistant.state.answer || null : null,
    actionItems: assistant.viewModel ? assistant.viewModel.actionItems || [] : [],
    nextSteps: assistant.viewModel ? assistant.viewModel.nextSteps || [] : [],
    counters: assistant.viewModel ? assistant.viewModel.counters || {} : assistant.state ? assistant.state.counters || {} : {}
  };
}

function buildMembersSection(rooms, calls) {
  if (rooms && rooms.state && Array.isArray(rooms.state.members) && rooms.state.members.length > 0) {
    return {
      source: 'rooms',
      items: rooms.state.members,
      counters: {
        total: rooms.state.members.length
      }
    };
  }

  if (calls && calls.state && Array.isArray(calls.state.participants)) {
    return {
      source: 'calls',
      items: calls.state.participants,
      counters: {
        total: calls.state.participants.length,
        speaking: calls.state.counters ? calls.state.counters.speaking || 0 : 0,
        connected: calls.state.counters ? calls.state.counters.connected || 0 : 0
      }
    };
  }

  return {
    source: 'none',
    items: [],
    counters: {
      total: 0
    }
  };
}

export function buildRightPanelRuntimeSections({ page, rooms = null, calls = null, transcript = null, assistant = null } = {}) {
  const members = buildMembersSection(rooms, calls);

  return {
    page,
    mode: page === 'calls' ? 'transcript' : rooms && rooms.viewModel ? rooms.viewModel.rightPanelMode || 'members' : 'members',
    sections: {
      members,
      transcript: buildTranscriptSection(transcript),
      assistant: buildAssistantSection(assistant)
    }
  };
}
