import { pool } from '../db/pg.js';

export const phoneAuthRepository = {
  async createOtpCode({ phone, purpose, codeHash, expiresAt, maxAttempts = 5, meta = {} }) {
    const res = await pool.query(
      `insert into phone_otp_codes (phone, purpose, code_hash, expires_at, max_attempts, meta)
       values ($1,$2,$3,$4,$5,$6::jsonb)
       returning id, phone, purpose, expires_at as "expiresAt", attempts, max_attempts as "maxAttempts", created_at as "createdAt"`,
      [phone, purpose, codeHash, expiresAt, maxAttempts, JSON.stringify(meta || {})]
    );
    return res.rows[0];
  },

  async findRecentOtp({ phone, purpose, sinceSeconds = 60 }) {
    const res = await pool.query(
      `select id, created_at as "createdAt"
         from phone_otp_codes
        where phone = $1 and purpose = $2
          and created_at > now() - ($3 || ' seconds')::interval
        order by created_at desc
        limit 1`,
      [phone, purpose, sinceSeconds]
    );
    return res.rows[0] || null;
  },

  async findLatestValidOtp({ phone, purpose }) {
    const res = await pool.query(
      `select id, phone, purpose, code_hash as "codeHash",
              attempts, max_attempts as "maxAttempts",
              expires_at as "expiresAt", used_at as "usedAt",
              created_at as "createdAt"
         from phone_otp_codes
        where phone = $1 and purpose = $2
          and used_at is null
          and expires_at > now()
        order by created_at desc
        limit 1`,
      [phone, purpose]
    );
    return res.rows[0] || null;
  },

  async incrementOtpAttempts(id) {
    const res = await pool.query(
      `update phone_otp_codes
          set attempts = attempts + 1
        where id = $1
        returning attempts, max_attempts as "maxAttempts"`,
      [id]
    );
    return res.rows[0] || null;
  },

  async markOtpUsed(id) {
    await pool.query(`update phone_otp_codes set used_at = now() where id = $1`, [id]);
  },

  async findUserByVerifiedPhone(phone) {
    const res = await pool.query(
      `select u.id, u.display_name as "displayName", u.username, u.email, u.role,
              u.status, u.is_active as "isActive",
              u.password_hash as "passwordHash", u.created_at as "createdAt"
         from users u
         join user_profiles p on p.user_id = u.id
        where p.phone = $1
          and u.is_active = true
        limit 1`,
      [phone]
    );
    return res.rows[0] || null;
  }
};
