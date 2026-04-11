import { appFlowMap } from './app-flow-map';
import { roomsCallFlow } from './rooms-call-flow';
import { profileAdminFlow } from './profile-admin-flow';
import { homeAdminFlow } from './home-admin-flow';
import { executeRoomsCallFlow } from './rooms-call-runtime';

export const appFlows = {
  map: appFlowMap,
  roomsCall: roomsCallFlow,
  profileAdmin: profileAdminFlow,
  homeAdmin: homeAdminFlow,
  runtime: {
    executeRoomsCallFlow
  }
};
