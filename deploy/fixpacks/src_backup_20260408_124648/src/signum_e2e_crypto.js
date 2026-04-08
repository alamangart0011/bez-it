/**
 * signum_e2e_crypto.js
 * Подключить в frontend/src/main.jsx:
 *   import { E2E } from './signum_e2e_crypto.js';
 *
 * Использует нативный Web Crypto API — никаких зависимостей.
 * Алгоритм: ECDH P-256 + AES-256-GCM
 */

'use strict';

// ============================================================
// УТИЛИТЫ
// ============================================================

function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

function bytesToB64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function randomBytes(n) {
  return crypto.getRandomValues(new Uint8Array(n));
}

// fingerprint — первые 8 символов hex от SHA-256 публичного ключа
async function keyFingerprint(publicKeyB64) {
  const bytes = b64ToBytes(publicKeyB64);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16)
    .toUpperCase()
    .match(/.{4}/g)
    .join(' ');
}

// ============================================================
// КЛЮЧЕВАЯ ПАРА
// ============================================================

async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );

  const publicRaw  = await crypto.subtle.exportKey('spki',  keyPair.publicKey);
  const privateRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKeyB64  = bytesToB64(publicRaw);
  const privateKeyB64 = bytesToB64(privateRaw);
  const fingerprint   = await keyFingerprint(publicKeyB64);

  return {
    publicKey:     keyPair.publicKey,
    privateKey:    keyPair.privateKey,
    publicKeyB64,
    privateKeyB64,
    fingerprint,
  };
}

// ============================================================
// ХРАНИЛИЩЕ КЛЮЧЕЙ (IndexedDB)
// ============================================================

const IDB_NAME    = 'signum_keys';
const IDB_VERSION = 1;
const IDB_STORE   = 'keys';

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function idbSet(key, value) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = resolve;
    tx.onerror    = e => reject(e.target.error);
  });
}

async function idbGet(key) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function storePrivateKey(userId, privateKeyB64) {
  await idbSet(`privkey_${userId}`, privateKeyB64);
}

async function loadPrivateKey(userId) {
  const b64 = await idbGet(`privkey_${userId}`);
  if (!b64) return null;
  const raw = b64ToBytes(b64);
  return crypto.subtle.importKey(
    'pkcs8', raw,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, ['deriveKey']
  );
}

// ============================================================
// ECDH → AES КЛЮЧ
// ============================================================

async function importPublicKey(b64) {
  return crypto.subtle.importKey(
    'spki', b64ToBytes(b64),
    { name: 'ECDH', namedCurve: 'P-256' },
    false, []
  );
}

async function deriveAesKey(myPrivateKey, theirPublicKeyB64, usage = ['encrypt', 'decrypt']) {
  const theirPublicKey = await importPublicKey(theirPublicKeyB64);
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    myPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    usage
  );
}

// ============================================================
// ШИФРОВАНИЕ СООБЩЕНИЯ (DM или группа)
// ============================================================

/**
 * Для DM: шифруем на ECDH-ключе с получателем.
 * Для группы: шифруем на симметричном room key.
 */
async function encryptMessage(plaintext, aesKey) {
  const iv      = randomBytes(12);
  const encoded = new TextEncoder().encode(plaintext);
  const cipher  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);
  return {
    iv_b64:         bytesToB64(iv),
    ciphertext_b64: bytesToB64(cipher),
    is_encrypted:   true,
    enc_version:    1,
  };
}

async function decryptMessage(msg, aesKey) {
  if (!msg.is_encrypted) return msg.content;
  const iv = b64ToBytes(msg.iv_b64);
  const ct = b64ToBytes(msg.ciphertext_b64);
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ct);
    return new TextDecoder().decode(plain);
  } catch {
    return '[🔒 Не удалось расшифровать]';
  }
}

// ============================================================
// ROOM KEY (для групп)
// ============================================================

async function generateRoomKey() {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Упаковываем room key в публичный ключ участника (ECIES-паттерн)
async function wrapRoomKey(roomKey, recipientPublicKeyB64, myPrivateKey) {
  // Генерируем эфемерную пару для этой операции
  const ephemeral = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']
  );

  const wrapKey = await deriveAesKey(ephemeral.privateKey, recipientPublicKeyB64, ['wrapKey']);
  const exportedEphPub = await crypto.subtle.exportKey('spki', ephemeral.publicKey);
  const iv = randomBytes(12);

  const wrapped = await crypto.subtle.wrapKey('raw', roomKey, wrapKey, { name: 'AES-GCM', iv });

  return {
    ephemeral_pub_b64: bytesToB64(exportedEphPub),
    iv_b64:            bytesToB64(iv),
    wrapped_b64:       bytesToB64(wrapped),
  };
}

async function unwrapRoomKey(wrappedData, myPrivateKey) {
  const ephPub  = await importPublicKey(wrappedData.ephemeral_pub_b64);
  const wrapKey = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: ephPub },
    myPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false, ['unwrapKey']
  );

  const iv      = b64ToBytes(wrappedData.iv_b64);
  const wrapped = b64ToBytes(wrappedData.wrapped_b64);

  return crypto.subtle.unwrapKey(
    'raw', wrapped, wrapKey,
    { name: 'AES-GCM', iv },
    { name: 'AES-GCM', length: 256 },
    false, ['encrypt', 'decrypt']
  );
}

// ============================================================
// КЭШ ROOM KEYS (в памяти за сессию)
// ============================================================

const _roomKeyCache = new Map();

async function getRoomKey(roomId, userId, apiToken) {
  if (_roomKeyCache.has(roomId)) return _roomKeyCache.get(roomId);

  // Загружаем wrapped key с сервера
  const res = await fetch(`/api/rooms/${roomId}/encryption-key`, {
    headers: { Authorization: `Bearer ${apiToken}` }
  });
  if (!res.ok) return null;

  const { wrapped_key } = await res.json();
  const myPrivKey = await loadPrivateKey(userId);
  if (!myPrivKey) return null;

  const roomKey = await unwrapRoomKey(JSON.parse(wrapped_key), myPrivKey);
  _roomKeyCache.set(roomId, roomKey);
  return roomKey;
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ E2E ДЛЯ ПОЛЬЗОВАТЕЛЯ
// ============================================================

async function initE2EForUser(userId, apiToken) {
  // Проверяем есть ли уже ключ
  const existing = await loadPrivateKey(userId);
  if (existing) {
    console.log('[E2E] ключ уже есть в IDB');
    return { alreadyHasKey: true };
  }

  // Генерируем новую пару
  const { publicKeyB64, privateKeyB64, fingerprint } = await generateKeyPair();

  // Сохраняем приватный ключ локально
  await storePrivateKey(userId, privateKeyB64);

  // Отправляем публичный ключ на сервер
  const r = await fetch('/api/users/public-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
    body: JSON.stringify({ public_key_b64: publicKeyB64, key_fingerprint: fingerprint })
  });

  console.log('[E2E] ключи сгенерированы, fingerprint:', fingerprint);
  return { publicKeyB64, fingerprint, success: r.ok };
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ UI
// ============================================================

// Проверяем поддержку E2E (нужен HTTPS + Web Crypto)
function isE2ESupported() {
  return typeof crypto !== 'undefined' &&
         typeof crypto.subtle !== 'undefined' &&
         location.protocol === 'https:';
}

// Fingerprint для UI: "A1B2 C3D4 E5F6 G7H8"
async function getFingerprintForUser(publicKeyB64) {
  return keyFingerprint(publicKeyB64);
}

// ============================================================
// EXPORT
// ============================================================

export const E2E = {
  // Инициализация
  initForUser: initE2EForUser,
  isSupported: isE2ESupported,

  // Ключи
  generateKeyPair,
  storePrivateKey,
  loadPrivateKey,
  importPublicKey,
  deriveAesKey,

  // Сообщения
  encryptMessage,
  decryptMessage,

  // Групповые комнаты
  generateRoomKey,
  wrapRoomKey,
  unwrapRoomKey,
  getRoomKey,

  // UI
  fingerprint: getFingerprintForUser,
};

// Для не-ESM окружений
if (typeof window !== 'undefined') window.E2E = E2E;
