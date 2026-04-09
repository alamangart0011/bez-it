-- 013_legacy_schema_parity.sql (fixed)

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS entry_mode text NOT NULL DEFAULT 'open';
UPDATE rooms SET entry_mode = 'open' WHERE entry_mode IS NULL OR entry_mode = '';

ALTER TABLE voice_participants ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Fix departments: assign org to orphan rows
WITH org AS (
  SELECT organization_id AS id FROM users
  WHERE organization_id IS NOT NULL LIMIT 1
)
UPDATE departments d SET organization_id = org.id
FROM org WHERE d.organization_id IS NULL;

-- Ensure default department exists
WITH org AS (
  SELECT organization_id AS id FROM users
  WHERE organization_id IS NOT NULL LIMIT 1
)
INSERT INTO departments (organization_id, name)
SELECT org.id, 'Общий отдел' FROM org
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Общий отдел');

-- user_profiles: user_id must be uuid to match users.id
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  department_id uuid,
  full_name text,
  display_name text,
  job_title text,
  position text,
  avatar_url text,
  phone text,
  bio text,
  status_text text,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS department_id uuid;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS status_text text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Seed user_profiles from users.email (no display_name on users table)
INSERT INTO user_profiles (user_id, department_id, full_name, display_name)
SELECT
  u.id,
  (SELECT id FROM departments WHERE name = 'Общий отдел' ORDER BY created_at NULLS LAST, id LIMIT 1),
  COALESCE(NULLIF(u.email, ''), 'Пользователь'),
  COALESCE(NULLIF(u.email, ''), 'Пользователь')
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_profiles p WHERE p.user_id = u.id);

-- user_settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'dark',
  density text NOT NULL DEFAULT 'comfortable',
  language text NOT NULL DEFAULT 'ru',
  notifications_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  voice_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'dark';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS density text NOT NULL DEFAULT 'comfortable';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'ru';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notifications_json jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS voice_json jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

INSERT INTO user_settings (user_id)
SELECT u.id FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_settings s WHERE s.user_id = u.id);

-- system_settings
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS value_json jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

INSERT INTO system_settings (key, value_json) VALUES
  ('app_name', '{"value":"Контур Связи"}'::jsonb),
  ('branding', '{"product":"Контур Связи","baseline":"room-based-v17"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- invitations
CREATE TABLE IF NOT EXISTS invitations (
  token text PRIMARY KEY,
  email text,
  role text NOT NULL DEFAULT 'member',
  department_id uuid,
  invited_by uuid,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invitations ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS department_id uuid;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS invited_by uuid;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- password_reset_tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token text PRIMARY KEY,
  user_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS used_at timestamptz;
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- room_incidents
CREATE TABLE IF NOT EXISTS room_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  incident_type text NOT NULL DEFAULT 'manual',
  severity text NOT NULL DEFAULT 'info',
  status text NOT NULL DEFAULT 'open',
  title text NOT NULL DEFAULT 'Инцидент комнаты',
  description text,
  created_by uuid,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS incident_type text NOT NULL DEFAULT 'manual';
ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'info';
ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open';
ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Инцидент комнаты';
ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS resolved_by uuid;
ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_department_id ON user_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_room_incidents_room_id ON room_incidents(room_id);
CREATE INDEX IF NOT EXISTS idx_room_incidents_status ON room_incidents(status);
