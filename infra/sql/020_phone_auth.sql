-- 020_phone_auth.sql
-- Боевой SMS-логин: таблица OTP-кодов для телефонных сессий.
-- Пользовательский номер берётся из user_profiles.phone
-- (уже существует в baseline с 001/013), отдельной таблицы связей не добавляем.

CREATE TABLE IF NOT EXISTS phone_otp_codes (
  id BIGSERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'login'
    CHECK (purpose IN ('login','bind_phone')),
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  used_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phone_otp_codes_phone_created_idx
  ON phone_otp_codes (phone, created_at DESC);

CREATE INDEX IF NOT EXISTS phone_otp_codes_active_idx
  ON phone_otp_codes (phone, purpose, expires_at)
  WHERE used_at IS NULL;
