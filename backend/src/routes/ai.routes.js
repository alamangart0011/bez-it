/**
 * ai.routes.js — AI ассистент для Сигнум
 * Подключить в server.js:
 *   app.use('/api/ai', require('./routes/ai.routes'));
 *
 * Нужна переменная в .env:
 *   ANTHROPIC_API_KEY=sk-ant-...
 */
'use strict';

const express      = require('express');
const router       = express.Router();
const { requireAuth } = require('../middleware/auth');
const pool         = require('../db');

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL         = process.env.AI_MODEL || 'claude-sonnet-4-20250514';
const MAX_TOKENS    = parseInt(process.env.AI_MAX_TOKENS || '1000');
const CONTEXT_MSGS  = parseInt(process.env.AI_CONTEXT_MSGS || '20');

// ── Системный промпт ────────────────────────────────────────
function buildSystemPrompt(roomName, orgName) {
  return `Ты корпоративный AI-ассистент системы Сигнум компании ${orgName || 'организации'}.
Ты находишься в комнате «${roomName || 'чат'}».
Отвечай кратко, по делу, на русском языке.
Если тебя просят суммаризировать переписку — выдели ключевые решения и задачи.
Если просят написать черновик — пиши профессионально и сжато.
Никогда не выдумывай факты. Если не знаешь — скажи об этом.`;
}

// ── Вызов Anthropic API ─────────────────────────────────────
async function callClaude(messages, systemPrompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch(ANTHROPIC_URL, {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system:     systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return {
    text:   data.content?.[0]?.text || '',
    tokens: data.usage?.output_tokens || 0,
  };
}

// ── GET /api/ai/status ──────────────────────────────────────
// Проверяет включён ли AI
router.get('/status', requireAuth, async (req, res) => {
  const enabled = !!process.env.ANTHROPIC_API_KEY;
  res.json({ enabled, model: MODEL });
});

// ── POST /api/ai/rooms/:roomId/ask ──────────────────────────
// Главный endpoint: задать вопрос AI в контексте комнаты
router.post('/rooms/:roomId/ask', requireAuth, async (req, res) => {
  try {
    const { roomId }  = req.params;
    const { message, include_history = true } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'message required' });
    }

    // Загружаем инфо о комнате и организации
    const roomRes = await pool.query(
      'SELECT r.name, o.name as org_name FROM rooms r JOIN organizations o ON o.id = (SELECT organization_id FROM users WHERE id=$1 LIMIT 1) WHERE r.id=$2',
      [req.user.id, roomId]
    );
    const room = roomRes.rows[0] || {};

    // Получаем или создаём тред
    let thread = (await pool.query(
      'SELECT id FROM ai_threads WHERE room_id=$1 AND user_id=$2 LIMIT 1',
      [roomId, req.user.id]
    )).rows[0];

    if (!thread) {
      thread = (await pool.query(
        'INSERT INTO ai_threads(room_id, user_id) VALUES($1,$2) RETURNING id',
        [roomId, req.user.id]
      )).rows[0];
    }

    // История треда для контекста
    const historyRows = include_history
      ? (await pool.query(
          'SELECT role, content FROM ai_messages WHERE thread_id=$1 ORDER BY created_at DESC LIMIT $2',
          [thread.id, CONTEXT_MSGS]
        )).rows.reverse()
      : [];

    const messages = [
      ...historyRows.map(r => ({ role: r.role, content: r.content })),
      { role: 'user', content: message },
    ];

    // Вызываем Claude
    const { text, tokens } = await callClaude(
      messages,
      buildSystemPrompt(room.name, room.org_name)
    );

    // Сохраняем в историю
    await pool.query(
      'INSERT INTO ai_messages(thread_id, role, content, tokens_used) VALUES($1,$2,$3,0),($1,$4,$5,$6)',
      [thread.id, 'user', message, 'assistant', text, tokens]
    );

    // Обновляем last_used
    await pool.query('UPDATE ai_threads SET last_used_at=now() WHERE id=$1', [thread.id]);

    res.json({ reply: text, tokens, threadId: thread.id });

  } catch (e) {
    console.error('[AI] ask error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/ai/rooms/:roomId/summarize ────────────────────
// Суммаризация последних N сообщений комнаты
router.post('/rooms/:roomId/summarize', requireAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50 } = req.body;

    // Берём последние сообщения комнаты
    const msgs = (await pool.query(`
      SELECT m.content, u.display_name, m.created_at
      FROM messages m
      JOIN users u ON u.id = m.user_id
      WHERE m.room_id = $1
        AND m.content IS NOT NULL
        AND m.is_encrypted = false
      ORDER BY m.created_at DESC
      LIMIT $2
    `, [roomId, limit])).rows.reverse();

    if (!msgs.length) {
      return res.json({ summary: 'В комнате пока нет сообщений для суммаризации.' });
    }

    const transcript = msgs
      .map(m => `[${new Date(m.created_at).toLocaleTimeString('ru')}] ${m.display_name}: ${m.content}`)
      .join('\n');

    const prompt = `Перед тобой переписка корпоративного чата. Составь краткое резюме:
1. Главные темы обсуждения
2. Принятые решения
3. Поставленные задачи (если есть)
4. Открытые вопросы

Переписка:
${transcript}`;

    const { text, tokens } = await callClaude(
      [{ role: 'user', content: prompt }],
      'Ты корпоративный AI-ассистент. Отвечай кратко на русском языке.'
    );

    res.json({ summary: text, messageCount: msgs.length, tokens });

  } catch (e) {
    console.error('[AI] summarize error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/ai/draft ──────────────────────────────────────
// Черновик ответа на последнее сообщение
router.post('/rooms/:roomId/draft', requireAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { context = '', tone = 'professional' } = req.body;

    const toneMap = {
      professional: 'профессиональный деловой',
      friendly:     'дружелюбный',
      brief:        'очень краткий',
      formal:       'официально-формальный',
    };

    const prompt = `Напиши черновик ответа в тоне: ${toneMap[tone] || toneMap.professional}.
Контекст переписки: ${context}
Дай только текст ответа, без пояснений.`;

    const { text } = await callClaude(
      [{ role: 'user', content: prompt }],
      'Ты помогаешь писать корпоративные сообщения на русском языке.'
    );

    res.json({ draft: text });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE /api/ai/rooms/:roomId/thread ─────────────────────
// Сбросить историю AI-треда
router.delete('/rooms/:roomId/thread', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM ai_threads WHERE room_id=$1 AND user_id=$2',
      [req.params.roomId, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
