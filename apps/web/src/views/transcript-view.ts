export const transcriptView = {
  shell: 'rightPanelShell',
  loader: 'transcriptLoader',
  sections: ['transcriptHeader', 'transcriptList', 'speakerLabels', 'summaryBlock'],
  actions: ['openTranscript', 'labelSpeaker', 'buildSummary'],
  runtime: {
    page: 'transcript',
    execute: 'executeTranscriptPanel',
    hydrate: '/api/transcripts'
  }
};
