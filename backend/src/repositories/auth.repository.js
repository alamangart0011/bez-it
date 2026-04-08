import crypto from 'crypto';
import { pool } from '../db/pg.js';

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export const authRepository = {
  tokenFingerprint(token) {
    return sha256(token);
  },

  async createSession({ id = crypto.randomUUID(), userId, refreshToken, userAgent, ipAddress, expiresAt }, client = pool) {
    const tokenHash = sha256(refreshToken);
    const res = await client.query(
      `insert into auth_sessions (id, user_id, refresh_token_hash, user_agent, ip_address, expires_at)
       values ($1, $2, $3, $4, $5, $6)
       returning id, user_id as "userId", user_agent as "userAgent", ip_address as "ipAddress",
                 created_at as "createdAt", expires_at as "expiresAt", revoked_at as "revokedAt"`,
      [id, userId, tokenHash, userAgent || null, ipAddress || null, expiresAt]
    );
    return res.rows[0];
  },

  async listUserSessions(userId) {
    const res = await pool.query(
      `select id, user_id as "userId", user_agent as "userAgent", ip_address as "ipAddress",
              created_at as "createdAt", expires_at as "expiresAt", revoked_at as "revokedAt"
       from auth_sessions
       where user_id = $1
       order by created_at desc`,
      [userId]
    );
    return res.rows;
  },

  async listAllSessions() {
    const res = await pool.query(
      `select s.id, s.user_id as "userId", s.user_agent as "userAgent", s.ip_address as "ipAddress",
              s.created_at as "createdAt", s.expires_at as "expiresAt", s.revoked_at as "revokedAt",
              u.display_name as "displayName", u.email, u.role
       from auth_sessions s
       join users u on u.id = s.user_id
       order by s.created_at desc
       limit 400`
    );
    return res.rows;
  },

  async findValidSessionByToken(refreshToken) {
    const res = await pool.query(
      `select id, user_id as "userId", user_agent as "userAgent", ip_address as "ipAddress",
              created_at as "createdAt", expires_at as "expiresAt", revoked_at as "revokedAt"
       from auth_sessions
       where refresh_token_hash = $1 and revoked_at is null and expires_at > now()
       limit 1`,
      [sha256(refreshToken)]
    );
    return res.rows[0] || null;
  },

  async findActiveSessionById(sessionId) {
    const res = await pool.query(
      `select id, user_id as "userId", user_agent as "userAgent", ip_address as "ipAddress",
              created_at as "createdAt", expires_at as "expiresAt", revoked_at as "revokedAt"
       from auth_sessions
       where id = $1 and revoked_at is null and expires_at > now()
       limit 1`,
      [sessionId]
    );
    return res.rows[0] || null;
  },

  async revokeSession(sessionId, client = pool) {
    await client.query('update auth_sessions set revoked_at = now() where id = $1 and revoked_at is null', [sessionId]);
  },

  async revokeUserSession(sessionId, userId) {
    await pool.query(
      'update auth_sessions set revoked_at = now() where id = $1 and user_id = $2 and revoked_at is null',
      [sessionId, userId]
    );
  },

  async revokeAllUserSessions(userId, { exceptSessionId = null } = {}, client = pool) {
    if (exceptSessionId) {
      await client.query(
        'update auth_sessions set revoked_at = now() where user_id = $1 and id <> $2 and revoked_at is null',
        [userId, exceptSessionId]
      );
      return;
    }
    await client.query('update auth_sessions set revoked_at = now() where user_id = $1 and revoked_at is null', [userId]);
  },

  async createPasswordResetToken({ id = crypto.randomUUID(), userId, token, expiresAt }, client = pool) {
    await client.query(
      `insert into password_reset_tokens (id, user_id, token_hash, expires_at)
       values ($1, $2, $3, $4)`,
      [id, userId, sha256(token), expiresAt]
    );
    return { id, userId, expiresAt };
  },

  async findValidPasswordResetToken(token) {
    const res = await pool.query(
      `select id, user_id as "userId", expires_at as "expiresAt", used_at as "usedAt", created_at as "createdAt"
       from password_reset_tokens
       where token_hash = $1 and used_at is null and expires_at > now()
       limit 1`,
      [sha256(token)]
    );
    return res.rows[0] || null;
  },

  async markPasswordResetTokenUsed(id, client = pool) {
    await client.query('update password_reset_tokens set used_at = now() where id = $1 and used_at is null', [id]);
  },

  async invalidatePasswordResetTokens(userId, client = pool) {
    await client.query('update password_reset_tokens set used_at = now() where user_id = $1 and used_at is null', [userId]);
  },

  async createInvitation({ id = crypto.randomUUID(), email, role = 'member', invitedByUserId = null, token, expiresAt, note = null }, client = pool) {
    const res = await client.query(
      `insert into invitations (id, email, role, invited_by_user_id, token_hash, expires_at, note)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id, email, role, invited_by_user_id as "invitedByUserId", expires_at as "expiresAt",
                 accepted_at as "acceptedAt", created_at as "createdAt", note`,
      [id, email, role, invitedByUserId, sha256(token), expiresAt, note]
    );
    return res.rows[0];
  },

  async listInvitations() {
    const res = await pool.query(
      `select i.id, i.email, i.role, i.invited_by_user_id as "invitedByUserId", inviter.display_name as "invitedByName",
              i.accepted_user_id as "acceptedUserId", accepted.display_name as "acceptedUserName",
              i.note, i.expires_at as "expiresAt", i.accepted_at as "acceptedAt", i.created_at as "createdAt"
       from invitations i
       left join users inviter on inviter.id = i.invited_by_user_id
       left join users accepted on accepted.id = i.accepted_user_id
       order by i.created_at desc
       limit 200`
    );
    return res.rows;
  },

  async findValidInvitation(token) {
    const res = await pool.query(
      `select id, email, role, invited_by_user_id as "invitedByUserId", expires_at as "expiresAt",
              accepted_at as "acceptedAt", created_at as "createdAt", note
       from invitations
       where token_hash = $1 and accepted_at is null and expires_at > now()
       limit 1`,
      [sha256(token)]
    );
    return res.rows[0] || null;
  },

  async markInvitationAccepted(id, acceptedUserId, client = pool) {
    await client.query(
      'update invitations set accepted_at = now(), accepted_user_id = $2 where id = $1 and accepted_at is null',
      [id, acceptedUserId]
    );
  }
};
