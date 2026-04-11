import { executeRoomsPage } from './rooms-runtime-execution';
import { executeCallsPage } from './calls-runtime-execution';
import { executeTranscriptPanel } from './transcript-runtime-execution';
import { executeAssistantPanel } from './assistant-runtime-execution';

export const runtimeExecutionIndex = {
  rooms: executeRoomsPage,
  calls: executeCallsPage,
  transcript: executeTranscriptPanel,
  assistant: executeAssistantPanel
};
