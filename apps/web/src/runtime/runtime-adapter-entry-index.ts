import { adaptRoomsPageRuntime } from './rooms-page-adapter-runtime';
import { adaptCallsPageRuntime } from './calls-page-adapter-runtime';

export const runtimeAdapterEntryIndex = {
  rooms: adaptRoomsPageRuntime,
  calls: adaptCallsPageRuntime
};
