/*
 * Web Push через VAPID. Реализация тонким слоем поверх web-push npm.
 * Если пакет не установлен — push деградирует до "логируем, ничего не шлём",
 * но /api/push/subscribe и /api/push/config продолжают работать. На VPS
 * при `npm ci` web-push подтянется и отправка оживёт автоматически.
 */

import { pushSubscriptionsRepository } from '../repositories/push-subscriptions.repository.js';

let webpushModule = null;
let webpushConfigured = false;
let webpushLoadAttempted = false;

async function loadWebPush({ vapidPublicKey, vapidPrivateKey, vapidSubject }) {
  if (webpushModule !== null || webpushLoadAttempted) {
    return webpushModule;
  }
  webpushLoadAttempted = true;
  try {
    const mod = await import('web-push');
    webpushModule = mod.default || mod;
    if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
      webpushModule.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      webpushConfigured = true;
    }
  } catch (error) {
    console.warn('[push] web-push package is not installed, push send is disabled:', error.message);
    webpushModule = null;
  }
  return webpushModule;
}

export function buildPushService({ vapidPublicKey, vapidPrivateKey, vapidSubject, defaultTtlSec = 86400 }) {
  const hasVapid = Boolean(vapidPublicKey && vapidPrivateKey && vapidSubject);

  return {
    isConfigured() {
      return hasVapid;
    },

    getPublicConfig() {
      return {
        ok: hasVapid,
        vapidPublicKey: hasVapid ? vapidPublicKey : null,
        message: hasVapid ? 'готов' : 'VAPID ключи не заданы в .env'
      };
    },

    async subscribe({ userId, subscription, userAgent }) {
      if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        throw new Error('PUSH_SUBSCRIPTION_INVALID');
      }
      return pushSubscriptionsRepository.upsert({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null
      });
    },

    async unsubscribe({ userId, endpoint }) {
      if (!endpoint) return { ok: true };
      await pushSubscriptionsRepository.deleteByEndpoint({ userId, endpoint });
      return { ok: true };
    },

    async sendToUsers({ userIds, payload, ttlSec = defaultTtlSec, urgency = 'normal' }) {
      if (!hasVapid) return { sent: 0, skipped: 0, failed: 0, reason: 'vapid_missing' };
      const subs = await pushSubscriptionsRepository.listActiveByUserIds(userIds || []);
      if (subs.length === 0) return { sent: 0, skipped: 0, failed: 0 };

      const webpush = await loadWebPush({ vapidPublicKey, vapidPrivateKey, vapidSubject });
      if (!webpush || !webpushConfigured) {
        return { sent: 0, skipped: subs.length, failed: 0, reason: 'web_push_module_missing' };
      }

      const payloadStr = JSON.stringify(payload);
      let sent = 0, failed = 0;

      await Promise.all(subs.map(async (sub) => {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          }, payloadStr, { TTL: ttlSec, urgency });
          await pushSubscriptionsRepository.markUsed(sub.id);
          sent += 1;
        } catch (error) {
          const status = error?.statusCode;
          const reason = status ? `http_${status}` : (error?.message || 'send_failed');
          await pushSubscriptionsRepository.markFailed({ id: sub.id, reason });
          failed += 1;
        }
      }));

      return { sent, skipped: 0, failed };
    }
  };
}
