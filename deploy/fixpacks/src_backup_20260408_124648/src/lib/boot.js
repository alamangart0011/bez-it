import { api } from './api';
import { authStorage } from './auth';

export async function bootstrapSession() {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const tokens = await api.refresh(refreshToken);
    authStorage.setSession(tokens);
    return tokens;
  } catch {
    authStorage.clear();
    return null;
  }
}
