/*
 * Клиентская подписка на Web Push.
 * Поток:  getConfig() → requestPermission() → subscribe() → POST /api/push/subscribe
 * iOS требует, чтобы сайт был установлен как PWA (Add to Home Screen).
 */

const CONFIG_URL      = '/api/push/config';
const SUBSCRIBE_URL   = '/api/push/subscribe';
const UNSUBSCRIBE_URL = '/api/push/unsubscribe';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const b64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function arrayBufferToBase64(buffer) {
  if (!buffer) return null;
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function isPushSupported() {
  return typeof window !== 'undefined'
      && 'serviceWorker' in navigator
      && 'PushManager' in window
      && 'Notification' in window;
}

async function getRegistration() {
  const reg = await navigator.serviceWorker.ready;
  return reg;
}

export async function getPushConfig(authHeader = null) {
  const headers = authHeader ? { Authorization: authHeader } : {};
  const res = await fetch(CONFIG_URL, { headers });
  if (!res.ok) throw new Error('PUSH_CONFIG_HTTP_' + res.status);
  return res.json();
}

export async function subscribePush({ accessToken }) {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'permission_' + permission };

  const config = await getPushConfig();
  if (!config?.ok || !config?.vapidPublicKey) {
    return { ok: false, reason: 'no_vapid' };
  }

  const registration = await getRegistration();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
    });
  }

  const keys = subscription.toJSON().keys || {};
  const payload = {
    subscription: {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: keys.p256dh || arrayBufferToBase64(subscription.getKey?.('p256dh')),
        auth:   keys.auth   || arrayBufferToBase64(subscription.getKey?.('auth'))
      }
    }
  };

  const res = await fetch(SUBSCRIBE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) return { ok: false, reason: 'subscribe_http_' + res.status };
  return { ok: true, endpoint: subscription.endpoint };
}

export async function unsubscribePush({ accessToken }) {
  if (!isPushSupported()) return { ok: true };
  const registration = await getRegistration();
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return { ok: true };
  await fetch(UNSUBSCRIBE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify({ endpoint: subscription.endpoint })
  }).catch(() => {});
  await subscription.unsubscribe().catch(() => {});
  return { ok: true };
}
