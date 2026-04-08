const ACCESS = 'corpchat_access_token';
const REFRESH = 'corpchat_refresh_token';
const PROFILE = 'corpchat_profile';
const SESSION = 'corpchat_session_id';

export const authStorage = {
  getAccessToken() { return localStorage.getItem(ACCESS); },
  getRefreshToken() { return localStorage.getItem(REFRESH); },
  getSessionId() { return localStorage.getItem(SESSION); },
  getProfile() {
    const raw = localStorage.getItem(PROFILE);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  setSession(payload) {
    if (payload.accessToken) localStorage.setItem(ACCESS, payload.accessToken);
    if (payload.refreshToken) localStorage.setItem(REFRESH, payload.refreshToken);
    if (payload.sessionId) localStorage.setItem(SESSION, payload.sessionId);
    if (payload.user) localStorage.setItem(PROFILE, JSON.stringify(payload.user));
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(SESSION);
    localStorage.removeItem(PROFILE);
  }
};
