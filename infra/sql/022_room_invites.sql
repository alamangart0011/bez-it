-- 022_room_invites.sql
-- Публичные приглашения в комнаты: токен + TTL + лимит использований.

CREATE TABLE IF NOT EXISTS room_invites (
  id BIGSERIAL PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NULL,
  max_uses INTEGER NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  revoked_at TIMESTAMPTZ NULL,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS room_invites_room_idx
  ON room_invites (room_id) WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS room_invites_active_idx
  ON room_invites (token)
  WHERE revoked_at IS NULL;
