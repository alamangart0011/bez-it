module.exports = {
  domain: 'assistant',
  handlers: {
    startAssistantSession: 'startAssistantSession',
    buildRoomSummary: 'buildRoomSummary',
    extractActions: 'extractActions',
    answerWithContext: 'answerWithContext'
  },
  handle(req, res, ctx) {
    if (req.method !== 'GET') {
      return ctx.runtimeResponse.methodNotAllowed(res, 'Method not allowed for assistant');
    }

    return ctx.runtimeResponse.ok(res, {
      page: 'assistant',
      binding: 'assistant',
      state: {
        answer: {
          headline: 'Runtime chain is connected',
          body: 'Rooms and calls now provide live runtime payloads. Transcript and assistant can consume the same flow next.'
        },
        actionItems: [
          { id: 'item-1', title: 'Verify rooms payload in web shell', owner: 'runtime' },
          { id: 'item-2', title: 'Bind calls runtime to transcript panel', owner: 'runtime' },
          { id: 'item-3', title: 'Finish cleanup and merge review', owner: 'api' }
        ],
        nextSteps: ['rooms', 'calls', 'transcripts', 'assistant']
      },
      ui: {
        isLoading: false,
        canCopy: true
      },
      actions: {
        openAssistant: '/api/assistant',
        extractActions: '/api/assistant/actions',
        copySummary: '/api/assistant/summary'
      },
      flow: {
        current: 'assistant',
        next: ['merge-review']
      }
    });
  }
};
