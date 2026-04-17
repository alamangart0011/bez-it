import { bezItLeadsRepository } from '../repositories/bez-it-leads.repository.js';
import { bezItRouterService } from './bez-it-router.service.js';
import { badRequest, notFound } from '../lib/errors.js';

const PHONE_RX = /[0-9+()\s-]{7,}/;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEXT_LIMIT = 2000;
const SHORT_LIMIT = 200;

function trimOrNull(value, limit = SHORT_LIMIT) {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str) return null;
  return str.slice(0, limit);
}

function normalizePhone(value) {
  if (!value) return null;
  const cleaned = String(value).replace(/[^\d+]/g, '');
  if (!cleaned) return null;
  if (cleaned.length < 7 || cleaned.length > 20) return null;
  return cleaned;
}

function validatePayload(body) {
  if (!body || typeof body !== 'object') {
    throw badRequest('LEAD_INVALID', 'Некорректная заявка', 'Пустое тело запроса.');
  }

  const contactName = trimOrNull(body.contactName || body.name);
  const phoneRaw = trimOrNull(body.phone);
  const email = trimOrNull(body.email);
  const comment = trimOrNull(body.comment || body.message, TEXT_LIMIT);

  if (!contactName) {
    throw badRequest('LEAD_NAME_REQUIRED', 'Укажите имя', 'Пожалуйста, представьтесь.');
  }
  if (!phoneRaw && !email) {
    throw badRequest('LEAD_CONTACT_REQUIRED', 'Нужен контакт', 'Укажите телефон или e-mail для связи.');
  }
  if (phoneRaw && !PHONE_RX.test(phoneRaw)) {
    throw badRequest('LEAD_PHONE_INVALID', 'Неверный телефон', 'Проверьте номер телефона.');
  }
  const phone = normalizePhone(phoneRaw);
  if (email && !EMAIL_RX.test(email)) {
    throw badRequest('LEAD_EMAIL_INVALID', 'Неверный e-mail', 'Проверьте адрес e-mail.');
  }

  const quiz = body.quizAnswers && typeof body.quizAnswers === 'object' ? body.quizAnswers : {};
  const utm = body.utm && typeof body.utm === 'object' ? body.utm : {};

  return {
    source: trimOrNull(body.source) || 'bez-it.ru',
    channel: trimOrNull(body.channel) || 'form',
    segment: trimOrNull(body.segment),
    serviceKey: trimOrNull(body.serviceKey || body.service),
    routeTarget: ['oboron', 'cent', 'both'].includes((body.routeTarget || '').toLowerCase())
      ? body.routeTarget.toLowerCase()
      : 'both',
    companyName: trimOrNull(body.companyName),
    contactName,
    phone,
    email,
    city: trimOrNull(body.city),
    headCount: trimOrNull(body.headCount),
    budget: trimOrNull(body.budget),
    deadline: trimOrNull(body.deadline),
    comment,
    quizAnswers: quiz,
    utm
  };
}

export const bezItLeadsService = {
  async submitLead(body, ctx = {}) {
    const honeypot = body && (body.website || body.url || body.fax);
    const payload = validatePayload(body);
    payload.userAgent = trimOrNull(ctx.userAgent, SHORT_LIMIT);
    payload.ipAddr = trimOrNull(ctx.ipAddr, 64);

    if (honeypot) {
      payload.comment = (payload.comment ? payload.comment + '\n\n' : '') + '[HONEYPOT TRIGGERED: ' + String(honeypot).slice(0, 200) + ']';
      const lead = await bezItLeadsRepository.createLead(payload);
      await bezItLeadsRepository.updateLeadStatus(lead.id, { status: 'spam' });
      return { ok: true, leadId: lead.id, routed: false, target: 'spam' };
    }

    const lead = await bezItLeadsRepository.createLead(payload);
    const routing = await bezItRouterService.routeLead(lead);
    if (routing.newStatus && routing.newStatus !== 'new') {
      await bezItLeadsRepository.updateLeadStatus(lead.id, { status: routing.newStatus });
    }
    return {
      ok: true,
      leadId: lead.id,
      routed: routing.routed,
      target: routing.auto
    };
  },

  async logLandingEvent(body, ctx = {}) {
    const eventType = trimOrNull(body && body.eventType, 64);
    if (!eventType) {
      throw badRequest('EVENT_TYPE_REQUIRED', 'Нет типа события', 'Передайте eventType.');
    }
    await bezItLeadsRepository.logEvent({
      eventType,
      page: trimOrNull(body.page, SHORT_LIMIT),
      sessionId: trimOrNull(body.sessionId, 64),
      payload: body.payload && typeof body.payload === 'object' ? body.payload : null,
      userAgent: trimOrNull(ctx.userAgent, SHORT_LIMIT),
      ipAddr: trimOrNull(ctx.ipAddr, 64)
    });
    return { ok: true };
  },

  async listLeads(query = {}) {
    const limit = Math.min(Math.max(Number(query.limit) || 100, 1), 500);
    const offset = Math.max(Number(query.offset) || 0, 0);
    const status = trimOrNull(query.status, 32);
    const search = trimOrNull(query.search, 120);
    const [leads, summary] = await Promise.all([
      bezItLeadsRepository.listLeads({ limit, offset, status, search }),
      bezItLeadsRepository.countLeads({})
    ]);
    return { leads, summary, limit, offset };
  },

  async getLead(id) {
    const lead = await bezItLeadsRepository.getLead(id);
    if (!lead) throw notFound('LEAD_NOT_FOUND', 'Заявка не найдена', 'Проверьте идентификатор.');
    const routes = await bezItLeadsRepository.getRoutesForLead(id);
    return { lead, routes };
  },

  async updateLeadStatus(id, body) {
    const allowed = ['new','in_progress','routed_oboron','routed_cent','routed_both','won','lost','duplicate','spam'];
    const status = trimOrNull(body && body.status, 32);
    if (status && !allowed.includes(status)) {
      throw badRequest('LEAD_STATUS_INVALID', 'Неверный статус', 'Статус заявки не распознан.');
    }
    const updated = await bezItLeadsRepository.updateLeadStatus(id, {
      status,
      notes: trimOrNull(body && body.notes, TEXT_LIMIT),
      assignedTo: trimOrNull(body && body.assignedTo, SHORT_LIMIT)
    });
    if (!updated) throw notFound('LEAD_NOT_FOUND', 'Заявка не найдена', 'Проверьте идентификатор.');
    return updated;
  }
};
