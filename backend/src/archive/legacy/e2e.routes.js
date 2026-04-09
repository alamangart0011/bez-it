/**
 * e2e.routes.js
 * Добавить в backend/src/routes/
 * Подключить в server.js:
 *   app.use('/api', require('./routes/e2e.routes'));
 */

'use strict';

const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const pool = require('../db');

// POST /api/users/public-key — сохранить публичный ключ
router.post('/users/public-key', requireAuth, async (req, res) => {
  try {
    const { public_key_b64, key_fingerprint } = req.body;
    if (!public_key_b64) return res.status(400).json({ error: 'public_key_b64 required' });

    await pool.query(`
      UPDATE users
      SET public_key_b64 = $1,
          key_fingerprint = $2,
          e2e_enabled = true
      WHERE id = $3
    `, [public_key_b64, key_fingerprint, req.user.id]);

    res.json({ ok: true, fingerprint: key_fingerprint });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/:userId/public-key — получить публичный ключ пользователя
router.get('/users/:userId/public-key', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT public_key_b64, key_fingerprint, e2e_enabled FROM users WHERE id = $1',
      [req.params.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/rooms/:roomId/encryption-key — сохранить wrapped room key
router.post('/rooms/:roomId/encryption-key', requireAuth, async (req, res) => {
  try {
    const { wrapped_keys } = req.body;
    // wrapped_keys = { userId: wrappedKeyJSON, ... }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const [userId, wrappedKey] of Object.entries(wrapped_keys)) {
        await client.query(`
          INSERT INTO room_encrypted_keys (room_id, user_id, wrapped_key_b64)
          VALUES ($1, $2, $3)
          ON CONFLICT (room_id, user_id)
          DO UPDATE SET wrapped_key_b64 = $3, rotated_at = now()
        `, [req.params.roomId, userId, JSON.stringify(wrappedKey)]);
      }
      await client.query('COMMIT');
    } finally {
      client.release();
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/rooms/:roomId/encryption-key — получить свой wrapped key
router.get('/rooms/:roomId/encryption-key', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT wrapped_key_b64
      FROM room_encrypted_keys
      WHERE room_id = $1 AND user_id = $2
    `, [req.params.roomId, req.user.id]);

    if (!rows[0]) return res.status(404).json({ error: 'No key found' });
    res.json({ wrapped_key: rows[0].wrapped_key_b64 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/rooms/:roomId/members/public-keys — публичные ключи всех участников
router.get('/rooms/:roomId/members/public-keys', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.display_name, u.public_key_b64, u.key_fingerprint, u.e2e_enabled
      FROM room_members rm
      JOIN users u ON u.id = rm.user_id
      WHERE rm.room_id = $1
    `, [req.params.roomId]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/rooms/:roomId/key-rotation — ротация ключа при выходе участника
router.post('/rooms/:roomId/key-rotation', requireAuth, async (req, res) => {
  try {
    const { wrapped_keys, reason = 'manual' } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Удаляем старые ключи
      await client.query('DELETE FROM room_encrypted_keys WHERE room_id = $1', [req.params.roomId]);

      // Вставляем новые
      for (const [userId, wrappedKey] of Object.entries(wrapped_keys)) {
        await client.query(`
          INSERT INTO room_encrypted_keys (room_id, user_id, wrapped_key_b64)
          VALUES ($1, $2, $3)
        `, [req.params.roomId, userId, JSON.stringify(wrappedKey)]);
      }

      // Логируем ротацию
      await client.query(`
        INSERT INTO key_rotation_log (room_id, reason, actor_id)
        VALUES ($1, $2, $3)
      `, [req.params.roomId, reason, req.user.id]);

      await client.query('COMMIT');
    } finally {
      client.release();
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
