/**
 * signum_ai_widget.js
 * AI-ассистент прямо в чате Сигнум.
 *
 * Что умеет:
 *  @ai <вопрос>          — задать вопрос ассистенту
 *  @ai summarize         — суммаризировать последние 50 сообщений
 *  @ai draft             — черновик ответа
 *  @ai clear             — очистить историю диалога
 *
 * Кнопка 🤖 в хедере комнаты открывает боковую панель ассистента.
 *
 * Подключить в main.jsx:
 *   import './signum_ai_widget.js';
 */
'use strict';

const AI_PREFIX = '@ai';

// ── CSS ─────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
/* AI панель */
.ai-panel {
  width: 320px; min-width: 280px;
  background: var(--bg-secondary, #2b2d31);
  border-left: 1px solid rgba(255,255,255,.07);
  display: flex; flex-direction: column;
  flex-shrink: 0; overflow: hidden;
  transition: width .2s;
}
.ai-panel.hidden { width: 0; min-width: 0; border: none; overflow: hidden; }

.ai-header {
  padding: 14px 14px 10px;
  border-bottom: 1px solid rgba(255,255,255,.07);
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0;
}
.ai-header-icon { font-size: 20px; }
.ai-header-info { flex: 1; }
.ai-header-title { font-size: 14px; font-weight: 600; color: var(--text-primary, #f2f3f5); }
.ai-header-sub { font-size: 11px; color: var(--text-muted, #80848e); margin-top: 1px; }
.ai-close-btn {
  width: 28px; height: 28px; border-radius: 6px;
  border: none; background: transparent; color: var(--text-muted, #80848e);
  cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;
  transition: background .1s, color .1s;
}
.ai-close-btn:hover { background: rgba(255,255,255,.08); color: var(--text-primary, #f2f3f5); }

/* Быстрые действия */
.ai-quick-actions {
  padding: 10px 12px;
  display: flex; gap: 6px; flex-wrap: wrap;
  border-bottom: 1px solid rgba(255,255,255,.07);
  flex-shrink: 0;
}
.ai-quick-btn {
  padding: 5px 10px; border-radius: 6px;
  background: rgba(88,101,242,.12);
  border: 1px solid rgba(88,101,242,.25);
  color: #9aa8fc; font-size: 12px; font-weight: 500;
  cursor: pointer; transition: background .1s;
  white-space: nowrap;
}
.ai-quick-btn:hover { background: rgba(88,101,242,.22); }

/* Диалог */
.ai-messages {
  flex: 1; overflow-y: auto; padding: 12px;
  display: flex; flex-direction: column; gap: 10px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.08) transparent;
}

.ai-msg { display: flex; flex-direction: column; gap: 3px; }
.ai-msg-user { align-items: flex-end; }
.ai-msg-assistant { align-items: flex-start; }

.ai-bubble {
  max-width: 88%; padding: 8px 12px;
  border-radius: 10px; font-size: 13px; line-height: 1.55;
}
.ai-bubble-user {
  background: rgba(88,101,242,.2);
  color: var(--text-primary, #f2f3f5);
  border-radius: 10px 10px 4px 10px;
}
.ai-bubble-assistant {
  background: rgba(255,255,255,.06);
  color: var(--text-primary, #f2f3f5);
  border-radius: 10px 10px 10px 4px;
  white-space: pre-wrap;
}
.ai-bubble-assistant strong { color: #9aa8fc; }

.ai-msg-label { font-size: 10px; color: var(--text-muted, #80848e); padding: 0 4px; }

/* Typing indicator */
.ai-typing {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 12px; background: rgba(255,255,255,.06);
  border-radius: 10px; width: fit-content;
}
.ai-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #80848e; animation: ai-bounce .8s ease-in-out infinite;
}
.ai-dot:nth-child(2) { animation-delay: .15s; }
.ai-dot:nth-child(3) { animation-delay: .3s; }
@keyframes ai-bounce { 0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)} }

/* Инпут */
.ai-input-area {
  padding: 10px 12px;
  border-top: 1px solid rgba(255,255,255,.07);
  display: flex; gap: 8px; align-items: flex-end;
  flex-shrink: 0;
}
.ai-input {
  flex: 1; background: rgba(0,0,0,.2);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px; padding: 8px 10px;
  color: var(--text-primary, #f2f3f5);
  font-size: 13px; outline: none; resize: none;
  min-height: 36px; max-height: 120px;
  line-height: 1.5; font-family: inherit;
  transition: border-color .15s;
}
.ai-input:focus { border-color: rgba(88,101,242,.5); }
.ai-input::placeholder { color: var(--text-muted, #80848e); }

.ai-send-btn {
  width: 34px; height: 34px; border-radius: 8px;
  background: #5865f2; border: none; color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 16px; flex-shrink: 0;
  transition: background .15s;
}
.ai-send-btn:hover { background: #4752c4; }
.ai-send-btn:disabled { background: rgba(88,101,242,.3); cursor: not-allowed; }

/* Кнопка в хедере комнаты */
.ai-toggle-btn {
  position: relative;
}
.ai-toggle-btn.ai-active { color: #9aa8fc !important; }
.ai-badge-dot {
  position: absolute; top: 4px; right: 4px;
  width: 7px; height: 7px; border-radius: 50%;
  background: #23a55a; border: 2px solid var(--bg-primary, #313338);
}

/* Toast */
.ai-toast {
  position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%);
  background: #313338; color: #dbdee1;
  border: 1px solid rgba(88,101,242,.4);
  border-radius: 8px; padding: 10px 16px;
  font-size: 13px; font-weight: 500;
  box-shadow: 0 4px 20px rgba(0,0,0,.4);
  z-index: 9999; white-space: nowrap;
  animation: ai-toast-in .2s ease;
}
@keyframes ai-toast-in { from{transform:translateX(-50%) translateY(10px);opacity:0} to{transform:translateX(-50%);opacity:1} }

/* Суммаризация инлайн */
.ai-summary-card {
  background: rgba(88,101,242,.08);
  border: 1px solid rgba(88,101,242,.2);
  border-radius: 10px; padding: 12px 14px;
  margin: 8px 0; font-size: 13px;
  color: var(--text-primary, #f2f3f5); line-height: 1.6;
  white-space: pre-wrap;
}
.ai-summary-card .ai-summary-label {
  font-size: 11px; font-weight: 700;
  color: #9aa8fc; text-transform: uppercase;
  letter-spacing: .05em; margin-bottom: 6px;
}
`;
document.head.appendChild(style);

// ── STATE ────────────────────────────────────────────────────
let _currentRoomId = null;
let _panelOpen     = false;
let _loading       = false;

// ── API HELPERS ──────────────────────────────────────────────
function getToken() {
  return window._v17token
    || localStorage.getItem('accessToken')
    || localStorage.getItem('token')
    || '';
}

async function aiAsk(roomId, message) {
  const r = await fetch(`/api/ai/rooms/${roomId}/ask`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body:    JSON.stringify({ message }),
  });
  if (!r.ok) throw new Error(`AI error ${r.status}`);
  return r.json();
}

async function aiSummarize(roomId) {
  const r = await fetch(`/api/ai/rooms/${roomId}/summarize`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body:    JSON.stringify({ limit: 50 }),
  });
  if (!r.ok) throw new Error(`AI error ${r.status}`);
  return r.json();
}

async function aiDraft(roomId, context = '') {
  const r = await fetch(`/api/ai/rooms/${roomId}/draft`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body:    JSON.stringify({ context, tone: 'professional' }),
  });
  if (!r.ok) throw new Error(`AI error ${r.status}`);
  return r.json();
}

async function aiClearThread(roomId) {
  await fetch(`/api/ai/rooms/${roomId}/thread`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

// ── PANEL BUILD ──────────────────────────────────────────────
function buildAiPanel() {
  const panel = document.createElement('div');
  panel.id = 'signum-ai-panel';
  panel.className = 'ai-panel hidden';
  panel.innerHTML = `
    <div class="ai-header">
      <div class="ai-header-icon">🤖</div>
      <div class="ai-header-info">
        <div class="ai-header-title">Сигнум AI</div>
        <div class="ai-header-sub">Ассистент комнаты</div>
      </div>
      <button class="ai-close-btn" id="ai-close-btn" title="Закрыть">✕</button>
    </div>
    <div class="ai-quick-actions">
      <button class="ai-quick-btn" data-cmd="summarize">📋 Суммаризировать</button>
      <button class="ai-quick-btn" data-cmd="draft">✍️ Черновик</button>
      <button class="ai-quick-btn" data-cmd="clear">🗑 Очистить</button>
    </div>
    <div class="ai-messages" id="ai-messages">
      <div class="ai-msg ai-msg-assistant">
        <span class="ai-msg-label">Сигнум AI</span>
        <div class="ai-bubble ai-bubble-assistant">Привет! Я ваш корпоративный ассистент.\n\nМогу:\n• Суммаризировать переписку\n• Написать черновик ответа\n• Ответить на любой вопрос\n\nНапишите @ai <вопрос> в чат или используйте панель.</div>
      </div>
    </div>
    <div class="ai-input-area">
      <textarea class="ai-input" id="ai-input" placeholder="Спросить ассистента..." rows="1"></textarea>
      <button class="ai-send-btn" id="ai-send-btn" title="Отправить">➤</button>
    </div>
  `;

  document.body.appendChild(panel);

  // Close
  panel.querySelector('#ai-close-btn').onclick = () => toggleAiPanel(false);

  // Quick actions
  panel.querySelectorAll('.ai-quick-btn').forEach(btn => {
    btn.onclick = () => handleQuickAction(btn.dataset.cmd);
  });

  // Send
  const input   = panel.querySelector('#ai-input');
  const sendBtn = panel.querySelector('#ai-send-btn');

  const send = () => {
    const text = input.value.trim();
    if (!text || _loading) return;
    input.value = '';
    input.style.height = 'auto';
    sendAiMessage(text);
  };

  sendBtn.onclick = send;
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });

  return panel;
}

// ── PANEL TOGGLE ─────────────────────────────────────────────
function toggleAiPanel(open) {
  _panelOpen = open ?? !_panelOpen;
  const panel = document.getElementById('signum-ai-panel') || buildAiPanel();
  panel.classList.toggle('hidden', !_panelOpen);

  const btn = document.getElementById('ai-header-toggle-btn');
  btn?.classList.toggle('ai-active', _panelOpen);
}

// ── ADD BUTTON TO HEADER ─────────────────────────────────────
function injectAiButton() {
  if (document.getElementById('ai-header-toggle-btn')) return;

  const header = document.querySelector('.main-header, .channel-header, .room-header, [class*="header"]');
  if (!header) return;

  const btn = document.createElement('button');
  btn.id        = 'ai-header-toggle-btn';
  btn.className = 'mh-btn ai-toggle-btn';
  btn.title     = 'AI-ассистент';
  btn.innerHTML = '🤖';
  btn.onclick   = () => toggleAiPanel();

  const actions = header.querySelector('.mh-actions, [class*="actions"]');
  if (actions) actions.prepend(btn);
  else header.appendChild(btn);
}

// ── MESSAGES UI ──────────────────────────────────────────────
function addMessage(role, content) {
  const container = document.getElementById('ai-messages');
  if (!container) return;

  const wrap = document.createElement('div');
  wrap.className = `ai-msg ai-msg-${role}`;

  const label = document.createElement('span');
  label.className = 'ai-msg-label';
  label.textContent = role === 'user' ? 'Вы' : 'Сигнум AI';

  const bubble = document.createElement('div');
  bubble.className = `ai-bubble ai-bubble-${role}`;
  bubble.textContent = content;

  wrap.appendChild(label);
  wrap.appendChild(bubble);
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById('ai-messages');
  if (!container) return null;
  const el = document.createElement('div');
  el.id = 'ai-typing';
  el.className = 'ai-typing';
  el.innerHTML = '<div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div>';
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

function hideTyping() {
  document.getElementById('ai-typing')?.remove();
}

function aiToast(msg) {
  const el = document.createElement('div');
  el.className = 'ai-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── SEND MESSAGE ─────────────────────────────────────────────
async function sendAiMessage(text) {
  if (_loading) return;
  const roomId = _currentRoomId || getRoomIdFromUrl();
  if (!roomId) { aiToast('Откройте комнату для использования AI'); return; }

  _loading = true;
  const sendBtn = document.getElementById('ai-send-btn');
  if (sendBtn) sendBtn.disabled = true;

  addMessage('user', text);
  const typing = showTyping();

  try {
    const { reply } = await aiAsk(roomId, text);
    hideTyping();
    addMessage('assistant', reply);
  } catch (e) {
    hideTyping();
    addMessage('assistant', '❌ Ошибка: ' + e.message);
  } finally {
    _loading = false;
    if (sendBtn) sendBtn.disabled = false;
  }
}

// ── QUICK ACTIONS ────────────────────────────────────────────
async function handleQuickAction(cmd) {
  const roomId = _currentRoomId || getRoomIdFromUrl();
  if (!roomId && cmd !== 'clear') {
    aiToast('Откройте комнату');
    return;
  }

  if (cmd === 'clear') {
    if (roomId) await aiClearThread(roomId).catch(() => {});
    const container = document.getElementById('ai-messages');
    if (container) container.innerHTML = '';
    addMessage('assistant', 'История очищена.');
    return;
  }

  if (cmd === 'summarize') {
    _loading = true;
    const typing = showTyping();
    try {
      const { summary, messageCount } = await aiSummarize(roomId);
      hideTyping();

      const container = document.getElementById('ai-messages');
      const card = document.createElement('div');
      card.className = 'ai-summary-card';
      card.innerHTML = `<div class="ai-summary-label">📋 Суммаризация (${messageCount} сообщений)</div>${summary.replace(/\n/g, '<br>')}`;
      container?.appendChild(card);
      container && (container.scrollTop = container.scrollHeight);
    } catch (e) {
      hideTyping();
      addMessage('assistant', '❌ ' + e.message);
    } finally {
      _loading = false;
    }
    return;
  }

  if (cmd === 'draft') {
    // Берём последнее сообщение в чате как контекст
    const lastMsg = document.querySelector('.message-card, .msg-group, .message-row');
    const context = lastMsg?.querySelector('.msg-content, .message-text')?.textContent?.trim() || '';
    _loading = true;
    showTyping();
    try {
      const { draft } = await aiDraft(roomId, context);
      hideTyping();
      addMessage('assistant', '✍️ Черновик:\n\n' + draft);
      // Вставляем в composer
      const composer = document.querySelector('.composer-input, textarea[placeholder*="комнат"], textarea[placeholder*="чат"]');
      if (composer) {
        composer.value = draft;
        composer.focus();
        aiToast('Черновик вставлен в поле ввода');
      }
    } catch (e) {
      hideTyping();
      addMessage('assistant', '❌ ' + e.message);
    } finally {
      _loading = false;
    }
  }
}

// ── @ai ПЕРЕХВАТ В COMPOSER ──────────────────────────────────
function interceptComposer() {
  document.addEventListener('keydown', async e => {
    if (e.key !== 'Enter' || e.shiftKey) return;

    const composer = document.activeElement;
    if (!composer?.matches('textarea, [contenteditable]')) return;

    const text = (composer.value || composer.textContent || '').trim();
    if (!text.toLowerCase().startsWith(AI_PREFIX)) return;

    const cmd = text.slice(AI_PREFIX.length).trim();
    if (!cmd) return;

    e.preventDefault();
    e.stopPropagation();

    composer.value = '';
    if (composer.textContent !== undefined) composer.textContent = '';

    // Открываем панель если закрыта
    if (!_panelOpen) toggleAiPanel(true);
    addMessage('user', cmd);

    const roomId = getRoomIdFromUrl();
    if (!roomId) { addMessage('assistant', 'Не удалось определить комнату.'); return; }

    // Специальные команды
    if (cmd.toLowerCase() === 'summarize' || cmd.toLowerCase() === 'суммаризировать') {
      await handleQuickAction('summarize'); return;
    }
    if (cmd.toLowerCase() === 'draft' || cmd.toLowerCase() === 'черновик') {
      await handleQuickAction('draft'); return;
    }
    if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'очистить') {
      await handleQuickAction('clear'); return;
    }

    // Обычный вопрос
    _loading = true;
    const typing = showTyping();
    try {
      const { reply } = await aiAsk(roomId, cmd);
      hideTyping();
      addMessage('assistant', reply);
    } catch (err) {
      hideTyping();
      addMessage('assistant', '❌ ' + err.message);
    } finally {
      _loading = false;
    }
  }, true);
}

// ── URL ROOM ID ──────────────────────────────────────────────
function getRoomIdFromUrl() {
  const m = location.hash.match(/rooms\/([a-f0-9-]{36})/i)
         || location.pathname.match(/rooms\/([a-f0-9-]{36})/i);
  return m?.[1] || null;
}

// Следим за навигацией
function watchNavigation() {
  let lastRoom = null;
  const check = () => {
    const roomId = getRoomIdFromUrl();
    if (roomId && roomId !== lastRoom) {
      lastRoom = roomId;
      _currentRoomId = roomId;
    }
  };
  check();
  window.addEventListener('popstate', check);
  window.addEventListener('hashchange', check);
  const orig = history.pushState.bind(history);
  history.pushState = (...a) => { orig(...a); setTimeout(check, 100); };
}

// ── INIT ─────────────────────────────────────────────────────
function initAI() {
  if (!document.getElementById('signum-ai-panel')) buildAiPanel();
  injectAiButton();
  watchNavigation();
  interceptComposer();
}

initAI();
setTimeout(initAI, 1000);
setTimeout(initAI, 3000);

window.SigAI = { toggleAiPanel, sendAiMessage, handleQuickAction };
console.log('[SigAI] AI assistant loaded ✓ — используйте @ai <вопрос> в чате');
