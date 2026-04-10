module.exports = {
  domain: 'transcripts',
  handlers: {
    startTranscript: 'startTranscript',
    appendChunk: 'appendChunk',
    listTranscript: 'listTranscript',
    buildSummary: 'buildSummary'
  },
  handle(req, res, ctx) {
    if (req.method !== 'GET') {
      return ctx.runtimeResponse.methodNotAllowed(res, 'Method not allowed for transcripts');
    }

    return ctx.runtimeResponse.ok(res, {
      page: 'transcripts',
      binding: 'transcripts',
      state: {
        transcript: {
          id: 'transcript-room-ops',
          status: 'streaming',
          roomId: 'room-ops'
        },
        chunks: [
          { id: 'chunk-1', speaker: 'Administrator', text: 'Runtime dispatch is live for rooms and calls.' },
          { id: 'chunk-2', speaker: 'AI Assistant', text: 'Transcript pipeline is ready for assistant summarization.' }
        ],
        summary: {
          headline: 'Runtime flow is connected',
          bullets: ['rooms state is live', 'calls state is live', 'assistant can consume transcript context']
        }
      },
      ui: {
        isLoading: false,
        isStreaming: true
      },
      actions: {
        openTranscript: '/api/transcripts',
        buildSummary: '/api/transcripts/summary'
      },
      flow: {
        current: 'transcripts',
        next: ['assistant']
      }
    });
  }
};
