import { appRuntimeIndex } from './app-runtime-index';
import { roomsPageAdapter } from '../adapters/rooms-page-adapter';
import { callsPageAdapter } from '../adapters/calls-page-adapter';
import { profilePageAdapter } from '../adapters/profile-page-adapter';
import { adminPageAdapter } from '../adapters/admin-page-adapter';
import { roomsBinding } from '../api/bindings/rooms';
import { callsBinding } from '../api/bindings/calls';
import { profileBinding } from '../api/bindings/profile';
import { adminBinding } from '../api/bindings/admin';
import { transcriptBinding } from '../api/bindings/transcript';
import { assistantBinding } from '../api/bindings/assistant';
import { roomsLoader } from '../loaders/rooms-loader';
import { callsLoader } from '../loaders/calls-loader';
import { profileLoader } from '../loaders/profile-loader';
import { adminLoader } from '../loaders/admin-loader';
import { transcriptLoader } from '../loaders/transcript-loader';
import { assistantLoader } from '../loaders/assistant-loader';

const pageAdapters = {
  rooms: roomsPageAdapter,
  calls: callsPageAdapter,
  profile: profilePageAdapter,
  admin: adminPageAdapter,
  transcript: {
    page: 'transcript',
    binding: 'transcript',
    state: 'transcript-state.json',
    dto: ['TranscriptDto', 'TranscriptChunkDto', 'SummaryDto'],
    loaders: ['loadTranscript', 'loadSummary']
  },
  assistant: {
    page: 'assistant',
    binding: 'assistant',
    state: 'assistant-state.json',
    dto: ['AssistantAnswerDto', 'ActionItemDto'],
    loaders: ['loadAssistant', 'loadActions']
  }
};

const pageBindings = {
  rooms: roomsBinding,
  calls: callsBinding,
  profile: profileBinding,
  admin: adminBinding,
  transcript: transcriptBinding,
  assistant: assistantBinding
};

const pageLoaders = {
  rooms: roomsLoader,
  calls: callsLoader,
  profile: profileLoader,
  admin: adminLoader,
  transcript: transcriptLoader,
  assistant: assistantLoader
};

export function buildPageRuntimePlan(page, params = {}) {
  const view = appRuntimeIndex[page];
  const adapter = pageAdapters[page];
  if (!view || !adapter) {
    return null;
  }

  const binding = pageBindings[adapter.binding] || pageBindings[page];
  const loader = pageLoaders[page];
  if (!binding || !loader) {
    return null;
  }

  const endpoint = typeof binding.buildRequest === 'function'
    ? binding.buildRequest(params)
    : binding.endpoint;

  return {
    page: page,
    shell: view.shell,
    sections: view.sections,
    viewActions: view.actions,
    binding: adapter.binding,
    domain: binding.domain,
    endpoint: endpoint,
    queries: binding.queries,
    commands: binding.commands,
    stateContract: adapter.state,
    dto: adapter.dto,
    adapterLoaders: adapter.loaders,
    loader: {
      domain: loader.domain,
      queries: loader.queries,
      outputs: loader.outputs,
      next: loader.next
    },
    params: params
  };
}
