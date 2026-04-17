#!/usr/bin/env node
/*
 * Генератор VAPID-ключей для Web Push.
 * Запуск:  node scripts/generate-vapid.mjs
 * Вывод: строки для .env (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY).
 * P-256 ECDSA, raw-представление в base64url — как требует RFC 8292.
 */

import crypto from 'crypto';

function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pubJwk  = publicKey.export({ format: 'jwk' });
const privJwk = privateKey.export({ format: 'jwk' });

const rawPublic  = Buffer.concat([
  Buffer.from([0x04]),
  Buffer.from(pubJwk.x, 'base64'),
  Buffer.from(pubJwk.y, 'base64')
]);
const rawPrivate = Buffer.from(privJwk.d, 'base64');

console.log('VAPID_PUBLIC_KEY=' + b64url(rawPublic));
console.log('VAPID_PRIVATE_KEY=' + b64url(rawPrivate));
console.log('# Subject должен быть mailto:... или https://ваш.домен');
console.log('VAPID_SUBJECT=mailto:support@kontur.local');
