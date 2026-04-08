import crypto from 'crypto';
import { pool } from '../db/pg.js';

function baseFields() {
  return `
    id,
    display_name as "displayName",
    username,
    email,
    role,
    status,
    is_active as "isActive",
    password_hash as "passwordHash",
    created_at as "createdAt"
  `;
}

export const usersRepository = {
  async findByEmail(email) {
    const res = await pool.query(`select ${baseFields()} from users where lower(email) = lower($1) limit 1`, [email]);
    return res.rows[0] || null;
  },

  async findByUsername(username) {
    const res = await pool.query(`select ${baseFields()} from users where lower(username) = lower($1) limit 1`, [username]);
    return res.rows[0] || null;
  },

  async findByLogin(login) {
    const normalized = String(login || '').trim();
    const res = await pool.query(
      `select ${baseFields()}
       from users
       where lower(email) = lower($1) or lower(username) = lower($1)
       limit 1`,
      [normalized]
    );
    return res.rows[0] || null;
  },

  async findById(id) {
    const res = await pool.query(`select ${baseFields()} from users where id = $1 limit 1`, [id]);
    return res.rows[0] || null;
  },

  async createUser({ id = crypto.randomUUID(), displayName, username, email, role = 'member', status = 'online', isActive = true, passwordHash }, client = pool) {
    const res = await client.query(
      `insert into users (id, display_name, username, email, role, status, is_active, password_hash)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning ${baseFields()}`,
      [id, displayName, username, email, role, status, isActive, passwordHash]
    );
    return res.rows[0];
  },

  async updateAdminFields(userId, { displayName, role, status, isActive }, client = pool) {
    const parts = [];
    const values = [userId];
    if (displayName !== undefined) {
      values.push(displayName);
      parts.push(`display_name = $${values.length}`);
    }
    if (role !== undefined) {
      values.push(role);
      parts.push(`role = $${values.length}`);
    }
    if (status !== undefined) {
      values.push(status);
      parts.push(`status = $${values.length}`);
    }
    if (isActive !== undefined) {
      values.push(isActive);
      parts.push(`is_active = $${values.length}`);
    }
    if (!parts.length) return this.findById(userId);
    const res = await client.query(
      `update users set ${parts.join(', ')} where id = $1 returning ${baseFields()}`,
      values
    );
    return res.rows[0] || null;
  },

  async updatePassword(userId, passwordHash, client = pool) {
    await client.query('update users set password_hash = $2 where id = $1', [userId, passwordHash]);
  },

  async getOverview() {
    const res = await pool.query(
      `select
         count(*)::int as "totalUsers",
         count(*) filter (where is_active = true)::int as "activeUsers",
         count(*) filter (where role in ('admin', 'super_admin'))::int as "adminUsers",
         count(*) filter (where role in ('member', 'leader', 'moderator'))::int as "employeeUsers",
         count(*) filter (where role = 'blocked')::int as "blockedUsers"
       from users`
    );
    return res.rows[0] || { totalUsers: 0, activeUsers: 0, adminUsers: 0, employeeUsers: 0, blockedUsers: 0 };
  }
};
