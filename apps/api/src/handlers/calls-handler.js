function buildCalls(roomId) {
  const generatedAt = new Date().toISOString();
  const resolvedRoomId = roomId || 'room-ops';
  return {
    page: 'calls',
    binding: 'calls',
    state: {
      currentCall: {
        id: 'call-' + resolvedRoomId,
        roomId: resolvedRoomId,
        title: 'Active Voice Session',
        status: 'live',
        transcriptMode: 'stream',
        assistantMode: 'shadow'
      },
      participants: [
        { id: 'user-admin', displayName: 'Administrator', role: 'host', mediaState: 'connected' },
        { id: 'user-voice', displayName: 'Voice Coordinator', role: 'moderator', mediaState: 'speaking' },
        { id: 'user-ai', displayName: 'AI Assistant', role: 'assistant', mediaState: 'listening' }
      ],
      devices: {
        selectedInput: 'Primary Microphone',
        selectedOutput: 'Primary Speakers',
        selectedCamera: 'Virtual Camera',
        availableInputs: ['Primary Microphone', 'USB Headset'],
        availableOutputs: ['Primary Speakers', 'USB Headset']
      }
    },
    ui: { isConnecting: false, isMuted: false, isRecording: true },
    actions: {
      startCall: '/api/calls/start',
      joinCall: '/api/calls?roomId={roomId}',
      leaveCall: '/api/calls?roomId={roomId}',
      toggleMute: '/api/calls?roomId={roomId}&action=toggleMute'
    },
    flow: { current: 'calls', next: ['transcripts', 'assistant'] },
    meta: { handler: 'getCallState', generatedAt: generatedAt }
  };
}

module.exports = {
  domain: 'calls',
  handlers: {
    listCalls: 'listCalls',
    getCallState: 'getCallState',
    startCall: 'startCall',
    joinCall: 'joinCall',
    leaveCall: 'leaveCall'
  },
  handle(req, res, ctx) {
    if (req.method !== 'GET') {
      return ctx.runtimeResponse.methodNotAllowed(res, 'Method not allowed for /api/calls');
    }
    const requestUrl = new URL(req.url, 'http://signalum.local');
    const roomId = requestUrl.searchParams.get('roomId');
    return ctx.runtimeResponse.ok(res, buildCalls(roomId));
  }
};
