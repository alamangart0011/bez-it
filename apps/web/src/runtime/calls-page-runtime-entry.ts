import { executeCallsPage } from './calls-runtime-execution';
import { executeTranscriptPanel } from './transcript-runtime-execution';
import { executeAssistantPanel } from './assistant-runtime-execution';
import { buildRightPanelRuntimeSections } from './right-panel-runtime-sections';

function buildChainedParams(params, callsExecution) {
  const currentCall = callsExecution && callsExecution.state ? callsExecution.state.currentCall || null : null;

  return {
    ...params,
    callId: params.callId || (currentCall ? currentCall.id : null),
    roomId: params.roomId || (currentCall ? currentCall.roomId || null : null)
  };
}

function buildControlsModel(callsExecution) {
  const payloadActions = callsExecution && callsExecution.payload && callsExecution.payload.data ? callsExecution.payload.data.actions || {} : {};

  return {
    transcriptMode: callsExecution && callsExecution.viewModel ? callsExecution.viewModel.transcriptMode : 'off',
    assistantMode: callsExecution && callsExecution.viewModel ? callsExecution.viewModel.assistantMode : 'off',
    selectedDevices: callsExecution && callsExecution.viewModel ? callsExecution.viewModel.selectedDevices || {} : {},
    actions: payloadActions
  };
}

export async function loadCallsPageRuntime(params = {}, fetcher = fetch) {
  const calls = await executeCallsPage(params, fetcher);
  const chainedParams = buildChainedParams(params, calls);

  const [transcript, assistant] = await Promise.all([
    executeTranscriptPanel(chainedParams, fetcher),
    executeAssistantPanel(chainedParams, fetcher)
  ]);

  return {
    page: 'calls',
    shell: 'callShell',
    execution: {
      calls,
      transcript,
      assistant
    },
    header: {
      title: calls && calls.viewModel ? calls.viewModel.title : 'Calls',
      subtitle: calls && calls.viewModel ? calls.viewModel.subtitle : 'idle'
    },
    content: {
      currentCall: calls && calls.state ? calls.state.currentCall || null : null,
      participants: calls && calls.state ? calls.state.participants || [] : [],
      devices: calls && calls.state ? calls.state.devices || {} : {},
      controls: buildControlsModel(calls),
      transcript: transcript && transcript.state ? transcript.state : {},
      assistant: assistant && assistant.state ? assistant.state : {}
    },
    rightPanel: buildRightPanelRuntimeSections({
      page: 'calls',
      calls,
      transcript,
      assistant
    }),
    summary: {
      participants: calls && calls.viewModel ? calls.viewModel.participantSummary || {} : {},
      transcript: transcript && transcript.viewModel ? transcript.viewModel.counters || {} : {},
      assistant: assistant && assistant.viewModel ? assistant.viewModel.counters || {} : {}
    }
  };
}
