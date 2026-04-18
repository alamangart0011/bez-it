import TelegramBot from 'node-telegram-bot-api';
import { setTimeout as sleep } from 'node:timers/promises';

const TOKEN = process.env.BEZIT_TG_BOT_TOKEN;
const API_URL = process.env.BEZIT_API_URL || 'https://bez-it.ru/api/bez-it/leads';
const IP_CHAT = process.env.BEZIT_TG_IP_CHAT;
const MODE = (process.env.BEZIT_BOT_MODE || 'polling').toLowerCase();
const PORT = Number(process.env.BEZIT_BOT_PORT || 3010);

if (!TOKEN) {
  console.error('FATAL: BEZIT_TG_BOT_TOKEN is required');
  process.exit(1);
}

const bot = MODE === 'webhook'
  ? new TelegramBot(TOKEN, { webHook: { port: PORT } })
  : new TelegramBot(TOKEN, { polling: true });

if (MODE === 'webhook' && process.env.BEZIT_BOT_WEBHOOK_URL) {
  await bot.setWebHook(process.env.BEZIT_BOT_WEBHOOK_URL);
  console.log('[bot] webhook set:', process.env.BEZIT_BOT_WEBHOOK_URL);
} else {
  console.log('[bot] long-polling started');
}

const SERVICES = [
  ['kii', 'Защита КИИ / 187-ФЗ'],
  ['attest', 'Аттестация ФСТЭК'],
  ['skzi', 'Разработка СКЗИ (ПП-313)'],
  ['import', 'Импортозамещение к 01.03.2026'],
  ['video_skud', 'Видео + СКУД'],
  ['outsource', 'ИТ-аутсорсинг и 1С'],
  ['other', 'Другое']
];

const sessions = new Map();

function reset(chatId) { sessions.delete(chatId); }

bot.onText(/^\/start/, (msg) => {
  reset(msg.chat.id);
  bot.sendMessage(msg.chat.id,
    'Здравствуйте! Я бот bez-it.ru.\n\n' +
    'Помогу оставить заявку — на нашей стороне эксперты НПК «Оборон-Экран» (СПб) и Cent-IT (Москва) с лицензиями ФСТЭК / ФСБ.\n\n' +
    'Выберите услугу:', {
      reply_markup: {
        inline_keyboard: SERVICES.map(([k, t]) => [{ text: t, callback_data: 'svc:' + k }])
      }
    }
  );
});

bot.onText(/^\/contact/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '📞 8 800 555-35-35 (Россия, бесплатно)\n' +
    '📧 zayavka@bez-it.ru\n' +
    '🌐 https://bez-it.ru\n' +
    '💬 @bez_it_ru'
  );
});

bot.onText(/^\/cancel/, (msg) => {
  reset(msg.chat.id);
  bot.sendMessage(msg.chat.id, 'Диалог сброшен. Чтобы начать заново — /start');
});

bot.on('callback_query', async (cb) => {
  const chatId = cb.message.chat.id;
  if (!cb.data?.startsWith('svc:')) return;
  const key = cb.data.slice(4);
  sessions.set(chatId, { stage: 'name', serviceKey: key, started: Date.now() });
  await bot.answerCallbackQuery(cb.id);
  await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: cb.message.message_id });
  await bot.sendMessage(chatId, 'Как к вам обращаться?');
});

bot.on('message', async (msg) => {
  if (msg.text?.startsWith('/')) return;
  const s = sessions.get(msg.chat.id); if (!s) return;
  const text = (msg.text || '').trim().slice(0, 500);

  if (s.stage === 'name') {
    s.contactName = text; s.stage = 'phone';
    return bot.sendMessage(msg.chat.id, 'Телефон для связи?');
  }
  if (s.stage === 'phone') {
    if (!/[0-9+()\s-]{7,}/.test(text)) return bot.sendMessage(msg.chat.id, 'Похоже, это не телефон. Попробуйте ещё раз или /cancel.');
    s.phone = text; s.stage = 'comment';
    return bot.sendMessage(msg.chat.id, 'Кратко опишите задачу (отрасль, размер организации, сроки). Можно одним сообщением.');
  }
  if (s.stage === 'comment') {
    s.comment = text; s.stage = 'done';
    try {
      const payload = {
        contactName: s.contactName,
        phone: s.phone,
        comment: s.comment,
        serviceKey: s.serviceKey,
        source: 'bez-it.ru',
        channel: 'tg_bot',
        utm: { utm_source: 'telegram_bot' }
      };
      const r = await fetch(API_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.message || 'API ' + r.status);

      await bot.sendMessage(msg.chat.id,
        '✅ Заявка №' + j.leadId + ' принята.\n\n' +
        'Эксперт перезвонит в течение 30 минут (рабочие часы 9:00–20:00 МСК).\n\n' +
        'Если есть срочный вопрос — 8 800 555-35-35.\n' +
        '\nНовая заявка: /start'
      );

      if (IP_CHAT) {
        await bot.sendMessage(IP_CHAT,
          '<b>📥 Новая заявка из Telegram-бота #' + j.leadId + '</b>\n' +
          '👤 ' + s.contactName + '\n' +
          '📞 ' + s.phone + '\n' +
          '🛠 ' + (SERVICES.find(([k]) => k === s.serviceKey)?.[1] || s.serviceKey) + '\n' +
          '💬 ' + s.comment.replace(/[<>]/g, ''),
          { parse_mode: 'HTML' }
        );
      }
    } catch (e) {
      console.error('[bot] submit error:', e);
      await bot.sendMessage(msg.chat.id,
        'Не получилось отправить заявку через бота. Позвоните, пожалуйста: 8 800 555-35-35.'
      );
    }
    reset(msg.chat.id);
  }
});

process.on('unhandledRejection', (e) => console.error('[bot] unhandled:', e));
process.on('SIGINT', async () => { await bot.stopPolling(); process.exit(0); });
process.on('SIGTERM', async () => { await bot.stopPolling(); process.exit(0); });

console.log('[bot] ready, services:', SERVICES.length);
