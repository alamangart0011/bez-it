import { extendAuthApi, getInviteRouteState } from './AuthV22Adapters.js';
import { extendPhoneAuthApi } from './AuthPhoneV22Adapters.js';

export function buildAuthApi(baseReq, baseApi) {
  return extendPhoneAuthApi(baseReq, extendAuthApi(baseReq, baseApi));
}

export function resolveAuthRoute(pathname = '') {
  const invite = getInviteRouteState(pathname);
  if (invite.isInviteRoute) {
    return { mode: 'invite', token: invite.token };
  }
  return { mode: 'default', token: '' };
}
