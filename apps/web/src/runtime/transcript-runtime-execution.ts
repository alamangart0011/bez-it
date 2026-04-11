import { fetchRuntimePage } from './runtime-http-client';

function normalizeTranscriptState(payload) {
  const data = payload && payload.data ? payload.data : {};
  const state = data.state || {};
  const transcript = state.transcript || null;
  const chunks = state.chunks || [];
  const summary = state.summary || null;

  return {
    transcript,
    chunks,
    summary,
    counters: {
      chunks: chunks.length,
      speakers: Array.from(new Set(chunks.map((item) => item.speaker))).length
    }
  };
}

export async function executeTranscriptPanel(params = {}, fetcher = fetch) {
  const hydrated = await fetchRuntimePage('transcript', params, fetcher);
  const normalized = normalizeTranscriptState(hydrated.payload);

  return {
    page: 'transcript',
    plan: hydrated.plan,
    payload: hydrated.payload,
    state: normalized,
    viewModel: {
      title: normalized.summary ? normalized.summary.headline || 'Transcript' : 'Transcript',
      subtitle: normalized.transcript ? normalized.transcript.status : 'idle',
      summaryBullets: normalized.summary ? normalized.summary.bullets || [] : [],
      counters: normalized.counters
    }
  };
}
