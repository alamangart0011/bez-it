export const transcriptBinding = {
  page: 'transcript',
  domain: 'transcripts',
  endpoint: '/api/transcripts',
  queries: ['listTranscript', 'buildSummary'],
  commands: ['openTranscript'],
  buildRequest() {
    return this.endpoint;
  }
};
