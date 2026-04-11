export const assistantView = {
  shell: 'rightPanelShell',
  loader: 'assistantLoader',
  sections: ['assistantHeader', 'assistantAnswer', 'actionItems', 'nextSteps'],
  actions: ['openAssistant', 'extractActions', 'copySummary'],
  runtime: {
    page: 'assistant',
    execute: 'executeAssistantPanel',
    hydrate: '/api/assistant'
  }
};
