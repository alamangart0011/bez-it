import { executeRoomsPage } from './rooms-runtime-execution';
import { executeCallsPage } from './calls-runtime-execution';

export const runtimeExecutionIndex = {
  rooms: executeRoomsPage,
  calls: executeCallsPage
};
