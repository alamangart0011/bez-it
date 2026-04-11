export const assistantBinding = {
  page: 'assistant',
  domain: 'assistant',
  endpoint: '/api/assistant',
  queries: ['answerWithContext', 'extractActions'],
  commands: ['openAssistant'],
  buildRequest() {
    return this.endpoint;
  }
};
