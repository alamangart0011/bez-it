import { loadRoomsPageRuntime } from './rooms-page-runtime-entry';
import { loadCallsPageRuntime } from './calls-page-runtime-entry';

export const runtimePageEntryIndex = {
  rooms: loadRoomsPageRuntime,
  calls: loadCallsPageRuntime
};
