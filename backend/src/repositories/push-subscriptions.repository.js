import { pool } from '../db/pg.js';

export const pushSubscriptionsRepository = {
  async upsert({ userId, endpoint, p256dh, auth, userAgent }) {
    const res = await pool.query(
      `insert into push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, last_used_at)
       values ($1,$2,$3,$4,$5, now())
       on conflict (user_id, endpoint) do update set
         p256dh = excluded.p256dh,
         auth   = excluded.auth,
         user_agent = excluded.user_agent,
         last_used_at = now(),
         failed_at = null,
         failure_reason = null
       returning id, user_id as "userId", endpoint, p256dh, auth, user_agent as "userAgent",
                 created_at as "createdAt", last_used_at as "lastUsedAt"`,
      [userId, endpoint, p256dh, auth, userAgent || null]
    );
    return res.rows[0];
  },

  async deleteByEndpoint({ userId, endpoint }) {
    await pool.query(
      `delete from push_subscriptions where user_id = $1 and endpoint = $2`,
      [userId, endpoint]
    );
  },

  async listActiveByUserIds(userIds) {
    if (!userIds || userIds.length === 0) return [];
    const res = await pool.query(
      `select id, user_id as "userId", endpoint, p256dh, auth
         from push_subscriptions
        where user_id = any($1::uuid[]) and failed_at is null`,
      [userIds]
    );
    return res.rows;
  },

  async markFailed({ id, reason }) {
    await pool.query(
      `update push_subscriptions set failed_at = now(), failure_reason = $2 where id = $1`,
      [id, String(reason || '').slice(0, 256)]
    );
  },

  async markUsed(id) {
    await pool.query(`update push_subscriptions set last_used_at = now() where id = $1`, [id]);
  }
};
