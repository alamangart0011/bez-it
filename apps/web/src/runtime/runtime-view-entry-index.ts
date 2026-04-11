import { buildRoomsRuntimeView } from './rooms-view-runtime';
import { buildCallsRuntimeView } from './calls-view-runtime';

export const runtimeViewEntryIndex = {
  rooms: buildRoomsRuntimeView,
  calls: buildCallsRuntimeView
};
