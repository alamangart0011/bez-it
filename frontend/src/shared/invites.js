/*
 * Клиентские утилиты для публичных приглашений в комнаты.
 * Принципы:
 *   - URL вида https://<домен>/invite/<token>
 *   - Если пользователь не авторизован — токен сохраняется в localStorage
 *     под ключом sg_pending_invite, после успешного входа App.jsx вызывает
 *     consumePendingInvite и пытается вступить в комнату.
 *   - Превью (roomName/kind) публично, accept — только с Bearer-токеном.
 */

const PENDING_KEY   = 'sg_pending_invite';
const INVITE_PREFIX = '/invite/';

export function parseInviteTokenFromLocation() {
  if (typeof window === 'undefined') return null;
  const { pathname } = window.location;
  if (!pathname || !pathname.startsWith(INVITE_PREFIX)) return null;
  const token = pathname.slice(INVITE_PREFIX.length).split('/')[0];
  return token && /^[A-Za-z0-9_-]{8,64}$/.test(token) ? token : null;
}

export function buildInviteUrl(token) {
  if (typeof window === 'undefined' || !token) return null;
  return `${window.location.origin}${INVITE_PREFIX}${encodeURIComponent(token)}`;
}

export function rememberPendingInvite(token) {
  if (!token || typeof window === 'undefined') return;
  try { window.localStorage.setItem(PENDING_KEY, token); } catch { /* ignore */ }
}

export function consumePendingInvite() {
  if (typeof window === 'undefined') return null;
  try {
    const token = window.localStorage.getItem(PENDING_KEY);
    if (token) window.localStorage.removeItem(PENDING_KEY);
    return token || null;
  } catch {
    return null;
  }
}

export async function fetchInvitePreview(token) {
  const res = await fetch(`/api/invites/${encodeURIComponent(token)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(text || `INVITE_PREVIEW_HTTP_${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function acceptInvite({ token, accessToken }) {
  if (!token) throw new Error('INVITE_TOKEN_REQUIRED');
  if (!accessToken) throw new Error('AUTH_REQUIRED');
  const res = await fetch(`/api/invites/${encodeURIComponent(token)}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(text || `INVITE_ACCEPT_HTTP_${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function createInvite({ roomId, accessToken, ttlSec = 86400, maxUses = null, note = null }) {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/invites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ ttlSec, maxUses, note })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(text || `INVITE_CREATE_HTTP_${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function listInvites({ roomId, accessToken }) {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/invites`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error(`INVITE_LIST_HTTP_${res.status}`);
  const data = await res.json();
  return data.items || [];
}

export async function revokeInvite({ inviteId, accessToken }) {
  const res = await fetch(`/api/invites/${encodeURIComponent(inviteId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error(`INVITE_REVOKE_HTTP_${res.status}`);
  return res.json();
}

export function inviteQrImageUrl(token) {
  if (!token) return null;
  return `/api/invites/${encodeURIComponent(token)}/qr.svg`;
}

/*
 * Авто-принятие отложенного приглашения после логина.
 * Лёгкий polling: каждые 1500мс смотрим в localStorage.
 * Когда появляется accessToken (ключ 'sg_token') — принимаем приглашение
 * и перезагружаем страницу, чтобы App.jsx увидел новую комнату.
 * Останавливаемся после успеха, ошибки или 60 секунд.
 */
export function initInviteAutoAccept({ tokenStorageKey = 'sg_token', intervalMs = 1500, timeoutMs = 60000 } = {}) {
  if (typeof window === 'undefined') return () => {};
  const started = Date.now();
  let timer = null;
  const tick = async () => {
    try {
      const pending = window.localStorage.getItem(PENDING_KEY);
      const accessToken = window.localStorage.getItem(tokenStorageKey);
      if (!pending) return stop();
      if (Date.now() - started > timeoutMs) return stop();
      if (!accessToken) return;
      stop();
      try {
        await acceptInvite({ token: pending, accessToken });
        window.localStorage.removeItem(PENDING_KEY);
        window.location.assign('/');
      } catch (error) {
        console.warn('[invite] accept failed:', error?.message || error);
        window.localStorage.removeItem(PENDING_KEY);
      }
    } catch { /* ignore */ }
  };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  timer = setInterval(tick, intervalMs);
  tick();
  return stop;
}
