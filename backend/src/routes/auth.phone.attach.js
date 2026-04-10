import { authPhoneRouter } from './auth.phone.routes.js';

export function attachPhoneAuthRoutes(authRouter) {
  authRouter.use(authPhoneRouter);
  return authRouter;
}
