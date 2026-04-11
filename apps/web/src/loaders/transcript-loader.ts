export const transcriptLoader = {
  domain: 'transcripts',
  queries: ['listTranscript', 'buildSummary'],
  outputs: ['transcript', 'chunks', 'summary'],
  next: ['hydrateAssistant']
};
