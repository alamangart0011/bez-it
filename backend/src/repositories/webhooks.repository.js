import { pool } from '../db/pg.js';

const webhookFields = `
  w.id,
  w.name,
  w.url,
  w.secret,
  w.events,
  w.is_active   as "isActive",
  w.room_id     as "roomId",
  w.created_by  as "createdBy",
  w.created_at  as "createdAt",
  w.updated_at  as "updatedAt",
  w.last_success_at  as "lastSuccessAt",
  w.last_failure_at  as "lastFailureAt",
  w.consecutive_failures as "consecutiveFailures"
`;

export const webhooksRepository = {
  async create({ name, url, secret, events = [], roomId = null, createdBy = null, isActive = true }) {
    const res = await pool.query(
      `insert into webhooks (name, url, secret, events, is_active, room_id, created_by)
       values ($1,$2,$3,$4,$5,$6,$7)
       returning ${webhookFields}`,
      [name, url, secret, events, isActive, roomId, createdBy]
    );
    return res.rows[0];
  },

  async update(id, patch) {
    const fields = [];
    const values = [];
    let i = 1;
    if (patch.name       !== undefined) { fields.push(`name = $${i++}`);       values.push(patch.name); }
    if (patch.url        !== undefined) { fields.push(`url = $${i++}`);        values.push(patch.url); }
    if (patch.secret     !== undefined) { fields.push(`secret = $${i++}`);     values.push(patch.secret); }
    if (patch.events     !== undefined) { fields.push(`events = $${i++}`);     values.push(patch.events); }
    if (patch.isActive   !== undefined) { fields.push(`is_active = $${i++}`);  values.push(patch.isActive); }
    if (patch.roomId     !== undefined) { fields.push(`room_id = $${i++}`);    values.push(patch.roomId); }
    if (fields.length === 0) return this.findById(id);
    fields.push(`updated_at = now()`);
    values.push(id);
    const res = await pool.query(
      `update webhooks set ${fields.join(', ')} where id = $${i} returning ${webhookFields}`,
      values
    );
    return res.rows[0] || null;
  },

  async delete(id) {
    await pool.query(`delete from webhooks where id = $1`, [id]);
  },

  async findById(id) {
    const res = await pool.query(`select ${webhookFields} from webhooks w where w.id = $1`, [id]);
    return res.rows[0] || null;
  },

  async list() {
    const res = await pool.query(`select ${webhookFields} from webhooks w order by w.created_at desc`);
    return res.rows;
  },

  async listActiveForEvent(eventType, roomId = null) {
    const res = await pool.query(
      `select ${webhookFields}
         from webhooks w
        where w.is_active = true
          and $1 = any(w.events)
          and (w.room_id is null or w.room_id = $2)`,
      [eventType, roomId]
    );
    return res.rows;
  },

  async markSuccess(id) {
    await pool.query(
      `update webhooks set last_success_at = now(), consecutive_failures = 0 where id = $1`,
      [id]
    );
  },

  async markFailure(id) {
    await pool.query(
      `update webhooks set last_failure_at = now(), consecutive_failures = consecutive_failures + 1 where id = $1`,
      [id]
    );
  }
};

export const webhookDeliveriesRepository = {
  async create({ webhookId, eventType, payload }) {
    const res = await pool.query(
      `insert into webhook_deliveries (webhook_id, event_type, payload, status, attempt)
       values ($1,$2,$3,'pending',0)
       returning id`,
      [webhookId, eventType, payload]
    );
    return res.rows[0];
  },

  async finish({ id, status, httpStatus = null, errorMessage = null, attempt }) {
    await pool.query(
      `update webhook_deliveries
          set status = $2, http_status = $3, error_message = $4, attempt = $5, finished_at = now()
        where id = $1`,
      [id, status, httpStatus, errorMessage, attempt]
    );
  },

  async listByWebhook(webhookId, limit = 50) {
    const res = await pool.query(
      `select id, webhook_id as "webhookId", event_type as "eventType", status,
              attempt, http_status as "httpStatus", error_message as "errorMessage",
              created_at as "createdAt", finished_at as "finishedAt"
         from webhook_deliveries
        where webhook_id = $1
        order by created_at desc
        limit $2`,
      [webhookId, Math.min(Math.max(Number(limit) || 50, 1), 500)]
    );
    return res.rows;
  }
};
