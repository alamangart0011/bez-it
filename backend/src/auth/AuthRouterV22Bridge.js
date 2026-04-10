import { authRouter as baseAuthRouter } from '../routes/auth.js';
import { attachPhoneAuthRoutes } from '../routes/auth.phone.attach.js';

export function getAuthRouterV22() {
  return attachPhoneAuthRoutes(baseAuthRouter);
}
