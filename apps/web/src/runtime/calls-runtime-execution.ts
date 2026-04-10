import { pageRuntimeAdapter } from './page-runtime-adapter';

function normalizeCallsState(payload) {
  const data = payload && payload.data ? payload.data : {};
  const state = data.state || {};
  const currentCall = state.currentCall || null;
  const participants = state.participants || [];
  const devices = state.devices || {};

  return {
    currentCall,
    participants,
    devices,
    counters: {
      participants: participants.length,
      speaking: participants.filter((item) => item.mediaState === 'speaking').length,
      connected: participants.filter((item) => item.mediaState === 'connected' || item.mediaState === 'speaking').length
    }
  };
}

export async function executeCallsPage(params = {}, fetcher = fetch) {
  const hydrated = await pageRuntimeAdapter.hydrate('calls', params, fetcher);
  const normalized = normalizeCallsState(hydrated.payload);

  return {
    page: 'calls',
    plan: hydrated.plan,
    payload: hydrated.payload,
    state: normalized,
    viewModel: {
      title: normalized.currentCall ? normalized.currentCall.title : 'Calls',
      subtitle: normalized.currentCall ? normalized.currentCall.status : 'idle',
      transcriptMode: normalized.currentCall ? normalized.currentCall.transcriptMode : 'off',
      assistantMode: normalized.currentCall ? normalized.currentCall.assistantMode : 'off',
      participantSummary: normalized.counters,
      selectedDevices: {
        input: normalized.devices.selectedInput || null,
        output: normalized.devices.selectedOutput || null,
        camera: normalized.devices.selectedCamera || null
      }
    }
  };
}
