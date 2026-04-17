import { pool } from '../db/pg.js';

const inviteFields = `
  i.id,
  i.room_id    as "roomId",
  i.token,
  i.created_by as "createdBy",
  i.expires_at as "expiresAt",
  i.max_uses   as "maxUses",
  i.used_count as "usedCount",
  i.revoked_at as "revokedAt",
  i.note,
  i.created_at as "createdAt"
`;

export const roomInvitesRepository = {
  async create({ roomId, token, createdBy, expiresAt = null, maxUses = null, note = null }, client = null) {
    const db = client || pool;
    const res = await db.query(
      `insert into room_invites (room_id, token, created_by, expires_at, max_uses, note)
       values ($1,$2,$3,$4,$5,$6)
       returning ${inviteFields}`,
      [roomId, token, createdBy, expiresAt, maxUses, note]
    );
    return res.rows[0];
  },

  async findByToken(token) {
    const res = await pool.query(
      `select ${inviteFields} from room_invites i where i.token = $1`,
      [token]
    );
    return res.rows[0] || null;
  },

  async findById(id) {
    const res = await pool.query(
      `select ${inviteFields} from room_invites i where i.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async listActiveForRoom(roomId) {
    const res = await pool.query(
      `select ${inviteFields}
         from room_invites i
        where i.room_id = $1
          and i.revoked_at is null
          and (i.expires_at is null or i.expires_at > now())
          and (i.max_uses  is null or i.used_count < i.max_uses)
        order by i.created_at desc`,
      [roomId]
    );
    return res.rows;
  },

  async incrementUsage(id, client = null) {
    const db = client || pool;
    const res = await db.query(
      `update room_invites set used_count = used_count + 1 where id = $1 returning ${inviteFields}`,
      [id]
    );
    return res.rows[0] || null;
  },

  async revoke(id, client = null) {
    const db = client || pool;
    await db.query(`update room_invites set revoked_at = now() where id = $1`, [id]);
  }
};
