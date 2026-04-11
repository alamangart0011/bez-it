import { pageRuntimeAdapter } from './page-runtime-adapter';

function normalizeAssistantState(payload) {
  const data = payload && payload.data ? payload.data : {};
  const state = data.state || {};
  const answer = state.answer || null;
  const actionItems = state.actionItems || [];
  const nextSteps = state.nextSteps || [];

  return {
    answer,
    actionItems,
    nextSteps,
    counters: {
      actionItems: actionItems.length,
      nextSteps: nextSteps.length
    }
  };
}

export async function executeAssistantPanel(params = {}, fetcher = fetch) {
  const hydrated = await pageRuntimeAdapter.hydrate('assistant', params, fetcher);
  const normalized = normalizeAssistantState(hydrated.payload);

  return {
    page: 'assistant',
    plan: hydrated.plan,
    payload: hydrated.payload,
    state: normalized,
    viewModel: {
      title: normalized.answer ? normalized.answer.headline || 'Assistant' : 'Assistant',
      subtitle: normalized.answer ? normalized.answer.body || '' : '',
      actionItems: normalized.actionItems,
      nextSteps: normalized.nextSteps,
      counters: normalized.counters
    }
  };
}
