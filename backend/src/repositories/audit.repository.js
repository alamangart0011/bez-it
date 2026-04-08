import crypto from 'crypto';
import { pool } from '../db/pg.js';

export const auditRepository = {
  async list() {
    const res = await pool.query(
      `select id, actor_user_id as "actorUserId", action, target, result, meta_json as meta, created_at as "createdAt"
       from audit_logs order by created_at desc limit 200`
    );
    return res.rows;
  },

  async listAuthEvents(actorUserId, limit = 20) {
    const res = await pool.query(
      `select id, actor_user_id as "actorUserId", action, target, result, meta_json as meta, created_at as "createdAt"
       from audit_logs
       where actor_user_id = $1 and action like 'auth.%'
       order by created_at desc
       limit $2`,
      [actorUserId, limit]
    );
    return res.rows;
  },

  async overview() {
    const res = await pool.query(
      `select
         count(*)::int as "totalEvents",
         max(created_at) as "lastEventAt"
       from audit_logs`
    );
    return res.rows[0] || { totalEvents: 0, lastEventAt: null };
  },

  async create({ actorUserId = null, action, target = null, result = 'success', meta = null }, client = pool) {
    const id = crypto.randomUUID();
    await client.query(
      `insert into audit_logs (id, actor_user_id, action, target, result, meta_json)
       values ($1, $2, $3, $4, $5, $6)`,
      [id, actorUserId, action, target, result, meta ? JSON.stringify(meta) : '{}']
    );
    return id;
  }
};
