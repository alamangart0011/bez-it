import { bezItLeadsRepository } from '../repositories/bez-it-leads.repository.js';

const TELEGRAM_API = 'https://api.telegram.org';

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatLeadMessage(lead, { target }) {
  const lines = [];
  const serviceMap = {
    it_security: 'ИТ-безопасность и защита данных',
    video_skud: 'Видеонаблюдение и СКУД',
    it_outsourcing: 'ИТ-аутсорсинг и обслуживание',
    network_sks: 'Монтаж СКС и сетей',
    audit_ib: 'Аудит информационной безопасности',
    antivirus_dlp: 'Антивирус и DLP для компаний',
    server_support: 'Сопровождение серверов и 1С',
    cctv_install: 'Монтаж видеонаблюдения',
    import_substitution: 'Импортозамещение и отечественный софт',
    other: 'Другое'
  };

  const targetTitle = target === 'oboron'
    ? 'Оборон-ИТ (oboron-it.ru)'
    : target === 'cent'
      ? 'Cent-IT (cent-it.ru)'
      : 'Обе компании';

  lines.push(`<b>Новая заявка bez-it.ru → ${escapeHtml(targetTitle)}</b>`);
  lines.push(`ID: <code>${lead.id}</code>  •  ${escapeHtml(new Date(lead.createdAt).toLocaleString('ru-RU'))}`);
  if (lead.serviceKey) lines.push(`Услуга: <b>${escapeHtml(serviceMap[lead.serviceKey] || lead.serviceKey)}</b>`);
  if (lead.segment) lines.push(`Сегмент: ${escapeHtml(lead.segment)}`);
  lines.push('');
  if (lead.contactName) lines.push(`Контакт: <b>${escapeHtml(lead.contactName)}</b>`);
  if (lead.companyName) lines.push(`Организация: ${escapeHtml(lead.companyName)}`);
  if (lead.phone) lines.push(`Телефон: <b>${escapeHtml(lead.phone)}</b>`);
  if (lead.email) lines.push(`E-mail: ${escapeHtml(lead.email)}`);
  if (lead.city) lines.push(`Город: ${escapeHtml(lead.city)}`);
  if (lead.headCount) lines.push(`Размер компании: ${escapeHtml(lead.headCount)}`);
  if (lead.budget) lines.push(`Бюджет: ${escapeHtml(lead.budget)}`);
  if (lead.deadline) lines.push(`Срок: ${escapeHtml(lead.deadline)}`);
  if (lead.comment) {
    lines.push('');
    lines.push(`Комментарий: ${escapeHtml(lead.comment)}`);
  }
  if (lead.quizAnswers && Object.keys(lead.quizAnswers).length) {
    lines.push('');
    lines.push('<b>Ответы квиза:</b>');
    for (const [key, val] of Object.entries(lead.quizAnswers)) {
      lines.push(`• ${escapeHtml(key)}: ${escapeHtml(Array.isArray(val) ? val.join(', ') : val)}`);
    }
  }
  if (lead.utm && Object.keys(lead.utm).length) {
    lines.push('');
    lines.push('<i>UTM:</i> ' + escapeHtml(JSON.stringify(lead.utm)));
  }
  lines.push('');
  lines.push('<i>Источник: ИП Сапрыкина Е.В. — bez-it.ru</i>');
  return lines.join('\n');
}

async function sendTelegram({ botToken, chatId, text }) {
  const url = `${TELEGRAM_API}/bot${botToken}/sendMessage`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true })
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`telegram_http_${resp.status}:${body.slice(0, 200)}`);
  }
  return resp.json().catch(() => ({}));
}

async function sendWebhook({ url, lead, target }) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ target, lead })
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`webhook_http_${resp.status}:${body.slice(0, 200)}`);
  }
  return resp.json().catch(() => ({}));
}

function resolveTargets(lead, env) {
  const routeTarget = (lead.routeTarget || 'both').toLowerCase();
  const serviceKey = (lead.serviceKey || '').toLowerCase();

  const prefersOboron = ['video_skud', 'cctv_install', 'network_sks', 'audit_ib'].includes(serviceKey);
  const prefersCent   = ['it_outsourcing', 'server_support', 'antivirus_dlp', 'import_substitution'].includes(serviceKey);

  let auto = 'both';
  if (routeTarget === 'oboron' || routeTarget === 'cent') auto = routeTarget;
  else if (prefersOboron && !prefersCent) auto = 'oboron';
  else if (prefersCent && !prefersOboron) auto = 'cent';

  const targets = [];
  const want = (t) => auto === 'both' || auto === t;

  if (want('oboron') && env.BEZIT_TG_OBORON_CHAT) {
    targets.push({ key: 'oboron', channel: 'telegram', chatId: env.BEZIT_TG_OBORON_CHAT });
  }
  if (want('cent') && env.BEZIT_TG_CENT_CHAT) {
    targets.push({ key: 'cent', channel: 'telegram', chatId: env.BEZIT_TG_CENT_CHAT });
  }
  if (env.BEZIT_TG_IP_CHAT) {
    targets.push({ key: 'ip', channel: 'telegram', chatId: env.BEZIT_TG_IP_CHAT });
  }
  if (env.BEZIT_WEBHOOK_URL) {
    targets.push({ key: 'webhook', channel: 'webhook', url: env.BEZIT_WEBHOOK_URL });
  }
  return { auto, targets };
}

export const bezItRouterService = {
  async routeLead(lead, env = process.env) {
    const { auto, targets } = resolveTargets(lead, env);
    const botToken = env.BEZIT_TG_BOT_TOKEN;
    const statusByTarget = { oboron: false, cent: false };

    for (const t of targets) {
      try {
        if (t.channel === 'telegram') {
          if (!botToken) throw new Error('telegram_bot_token_missing');
          const text = formatLeadMessage(lead, { target: t.key });
          await sendTelegram({ botToken, chatId: t.chatId, text });
          await bezItLeadsRepository.logRoute({
            leadId: lead.id, target: t.key, channel: 'telegram',
            status: 'sent', attempt: 1, deliveredAt: new Date().toISOString(),
            payload: { chatId: t.chatId }
          });
          if (t.key === 'oboron') statusByTarget.oboron = true;
          if (t.key === 'cent')   statusByTarget.cent = true;
        } else if (t.channel === 'webhook') {
          await sendWebhook({ url: t.url, lead, target: auto });
          await bezItLeadsRepository.logRoute({
            leadId: lead.id, target: 'webhook', channel: 'webhook',
            status: 'sent', attempt: 1, deliveredAt: new Date().toISOString(),
            payload: { url: t.url }
          });
        }
      } catch (err) {
        await bezItLeadsRepository.logRoute({
          leadId: lead.id, target: t.key, channel: t.channel,
          status: 'failed', attempt: 1, lastError: String(err && err.message || err)
        });
      }
    }

    let newStatus = 'new';
    if (statusByTarget.oboron && statusByTarget.cent) newStatus = 'routed_both';
    else if (statusByTarget.oboron) newStatus = 'routed_oboron';
    else if (statusByTarget.cent) newStatus = 'routed_cent';
    else if (targets.length) newStatus = 'in_progress';

    return { routed: targets.length, auto, newStatus };
  }
};
