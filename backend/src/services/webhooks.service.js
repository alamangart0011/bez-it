/*
 * Исходящие вебхуки: доставка POST со стандартными заголовками и
 * HMAC-подписью тела (sha256). Ретраи с экспоненциальной задержкой
 * прямо в процессе через setTimeout — простое и надёжное решение для
 * умеренных объёмов. Все попытки пишутся в webhook_deliveries.
 *
 * Заголовки запроса:
 *   X-Kontur-Event:     <event type>
 *   X-Kontur-Delivery:  <uuid>
 *   X-Kontur-Signature: sha256=<hmac-hex>
 *   X-Kontur-Attempt:   <1..N>
 *   User-Agent:         Kontur-Webhook/1.0
 */

import crypto from 'crypto';
import { URL as NodeURL } from 'url';
import { badRequest, notFound } from '../lib/errors.js';

const ALLOWED_EVENTS = new Set([
  'message.created',
  'message.deleted',
  'room.created',
  'room.updated',
  'voice.session_started',
  'voice.session_stopped',
  'user.joined_room',
  'user.left_room'
]);

const RETRY_DELAYS_MS = [0, 5000, 30000, 120000, 600000]; // 0s, 5s, 30s, 2m, 10m
const REQUEST_TIMEOUT_MS = 10000;

function signBody(body, secret) {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function isValidHttpUrl(raw) {
  try {
    const u = new NodeURL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return true;
  } catch {
    return false;
  }
}

async function postJson(url, body, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
      signal: controller.signal
    });
    const text = await res.text().catch(() => '');
    return { ok: res.ok, status: res.status, text: (text || '').slice(0, 500) };
  } finally {
    clearTimeout(timer);
  }
}

export function buildWebhooksService({ webhooksRepository, webhookDeliveriesRepository, auditRepository }) {
  function normalizeEvents(events) {
    const list = Array.isArray(events) ? events : [];
    const cleaned = list
      .map((e) => String(e || '').trim())
      .filter((e) => e && ALLOWED_EVENTS.has(e));
    return Array.from(new Set(cleaned));
  }

  function validateCreatePayload(payload) {
    const name = String(payload?.name || '').trim();
    const url  = String(payload?.url  || '').trim();
    if (!name) throw badRequest('WEBHOOK_NAME_REQUIRED', 'Не указано название', 'Укажите имя вебхука.');
    if (!isValidHttpUrl(url)) throw badRequest('WEBHOOK_URL_INVALID', 'Неверный URL', 'URL должен быть http(s).');
    const events = normalizeEvents(payload?.events);
    if (events.length === 0) throw badRequest('WEBHOOK_EVENTS_REQUIRED', 'Не выбраны события', 'Выберите хотя бы одно событие.');
    const secret = String(payload?.secret || '').trim() || crypto.randomBytes(24).toString('hex');
    const roomId = payload?.roomId || null;
    return { name, url, events, secret, roomId };
  }

  async function deliverWithRetries({ webhook, eventType, deliveryRow, bodyStr }) {
    const signature = signBody(bodyStr, webhook.secret);
    const deliveryId = crypto.randomUUID();
    let attempt = 0;

    for (const delay of RETRY_DELAYS_MS) {
      attempt += 1;
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      try {
        const res = await postJson(webhook.url, bodyStr, {
          'X-Kontur-Event': eventType,
          'X-Kontur-Delivery': deliveryId,
          'X-Kontur-Signature': signature,
          'X-Kontur-Attempt': String(attempt),
          'User-Agent': 'Kontur-Webhook/1.0'
        });
        if (res.ok) {
          await webhookDeliveriesRepository.finish({
            id: deliveryRow.id, status: 'success', httpStatus: res.status, errorMessage: null, attempt
          });
          await webhooksRepository.markSuccess(webhook.id);
          return { ok: true, attempt, status: res.status };
        }
        if (attempt >= RETRY_DELAYS_MS.length) {
          await webhookDeliveriesRepository.finish({
            id: deliveryRow.id, status: 'giveup', httpStatus: res.status, errorMessage: res.text, attempt
          });
          await webhooksRepository.markFailure(webhook.id);
          return { ok: false, attempt, status: res.status };
        }
        // продолжаем с задержкой
      } catch (error) {
        const msg = String(error?.message || error).slice(0, 500);
        if (attempt >= RETRY_DELAYS_MS.length) {
          await webhookDeliveriesRepository.finish({
            id: deliveryRow.id, status: 'giveup', httpStatus: null, errorMessage: msg, attempt
          });
          await webhooksRepository.markFailure(webhook.id);
          return { ok: false, attempt, error: msg };
        }
      }
    }
    return { ok: false, attempt };
  }

  async function emit({ eventType, payload, roomId = null }) {
    if (!ALLOWED_EVENTS.has(eventType)) return { matched: 0 };
    let subs;
    try {
      subs = await webhooksRepository.listActiveForEvent(eventType, roomId);
    } catch (error) {
      console.warn('[webhooks] listActiveForEvent failed:', error?.message || error);
      return { matched: 0 };
    }
    if (!subs || subs.length === 0) return { matched: 0 };

    const envelope = {
      event: eventType,
      sentAt: new Date().toISOString(),
      data: payload
    };
    const bodyStr = JSON.stringify(envelope);

    for (const webhook of subs) {
      try {
        const deliveryRow = await webhookDeliveriesRepository.create({
          webhookId: webhook.id, eventType, payload: envelope
        });
        // fire-and-forget
        deliverWithRetries({ webhook, eventType, deliveryRow, bodyStr }).catch((error) => {
          console.warn('[webhooks] delivery pipeline crashed:', error?.message || error);
        });
      } catch (error) {
        console.warn('[webhooks] delivery schedule failed:', error?.message || error);
      }
    }
    return { matched: subs.length };
  }

  return {
    allowedEvents: Array.from(ALLOWED_EVENTS),

    async create({ actorUser, payload }) {
      const data = validateCreatePayload(payload);
      const created = await webhooksRepository.create({
        name: data.name,
        url:  data.url,
        secret: data.secret,
        events: data.events,
        roomId: data.roomId,
        createdBy: actorUser.sub,
        isActive: payload?.isActive !== false
      });
      await auditRepository.create({
        actorUserId: actorUser.sub, action: 'webhook.create', target: created.id,
        result: 'success', meta: { events: data.events, roomId: data.roomId || null }
      });
      return created;
    },

    async update({ id, actorUser, payload }) {
      const existing = await webhooksRepository.findById(id);
      if (!existing) throw notFound('WEBHOOK_NOT_FOUND', 'Вебхук не найден', 'Указанный вебхук не существует.');

      const patch = {};
      if (payload?.name !== undefined) {
        const n = String(payload.name).trim();
        if (!n) throw badRequest('WEBHOOK_NAME_REQUIRED', 'Не указано название', 'Название не может быть пустым.');
        patch.name = n;
      }
      if (payload?.url !== undefined) {
        const u = String(payload.url).trim();
        if (!isValidHttpUrl(u)) throw badRequest('WEBHOOK_URL_INVALID', 'Неверный URL', 'URL должен быть http(s).');
        patch.url = u;
      }
      if (payload?.events !== undefined) {
        const ev = normalizeEvents(payload.events);
        if (ev.length === 0) throw badRequest('WEBHOOK_EVENTS_REQUIRED', 'Не выбраны события', 'Оставьте хотя бы одно событие.');
        patch.events = ev;
      }
      if (payload?.secret !== undefined) {
        const s = String(payload.secret).trim();
        if (!s) throw badRequest('WEBHOOK_SECRET_INVALID', 'Секрет пустой', 'Задайте непустой секрет или оставьте поле пустым.');
        patch.secret = s;
      }
      if (payload?.isActive !== undefined) patch.isActive = Boolean(payload.isActive);
      if (payload?.roomId !== undefined) patch.roomId = payload.roomId || null;

      const updated = await webhooksRepository.update(id, patch);
      await auditRepository.create({
        actorUserId: actorUser.sub, action: 'webhook.update', target: id,
        result: 'success', meta: Object.keys(patch)
      });
      return updated;
    },

    async remove({ id, actorUser }) {
      const existing = await webhooksRepository.findById(id);
      if (!existing) throw notFound('WEBHOOK_NOT_FOUND', 'Вебхук не найден', 'Указанный вебхук не существует.');
      await webhooksRepository.delete(id);
      await auditRepository.create({
        actorUserId: actorUser.sub, action: 'webhook.delete', target: id, result: 'success'
      });
      return { ok: true };
    },

    async list() {
      return webhooksRepository.list();
    },

    async recentDeliveries({ webhookId, limit }) {
      return webhookDeliveriesRepository.listByWebhook(webhookId, limit);
    },

    async sendTest({ id, actorUser }) {
      const webhook = await webhooksRepository.findById(id);
      if (!webhook) throw notFound('WEBHOOK_NOT_FOUND', 'Вебхук не найден', 'Указанный вебхук не существует.');
      const envelope = {
        event: 'webhook.test',
        sentAt: new Date().toISOString(),
        data: { hello: 'world', actorUserId: actorUser.sub }
      };
      const bodyStr = JSON.stringify(envelope);
      const deliveryRow = await webhookDeliveriesRepository.create({
        webhookId: webhook.id, eventType: 'webhook.test', payload: envelope
      });
      return deliverWithRetries({ webhook, eventType: 'webhook.test', deliveryRow, bodyStr });
    },

    emit
  };
}
