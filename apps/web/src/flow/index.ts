import { appFlowMap } from './app-flow-map';
import { roomsCallFlow } from './rooms-call-flow';
import { profileAdminFlow } from './profile-admin-flow';
import { homeAdminFlow } from './home-admin-flow';

export const appFlows = {
  map: appFlowMap,
  roomsCall: roomsCallFlow,
  profileAdmin: profileAdminFlow,
  homeAdmin: homeAdminFlow
};
