-- 014_v18_voice_meetings_ai.sql
-- Этап 1 V18: структурные таблицы voice sessions, meetings v2 и ai jobs.

BEGIN;

CREATE TABLE IF NOT EXISTS voice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'failed')),
  recording_url text,
  duration_sec int,
  meta_json jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_vs_room ON voice_sessions(room_id, started_at DESC);

CREATE TABLE IF NOT EXISTS voice_session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  role text DEFAULT 'participant',
  speaker_label text
);

CREATE TABLE IF NOT EXISTS voice_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  quality text NOT NULL DEFAULT 'draft' CHECK (quality IN ('draft', 'live', 'final', 'redacted')),
  content_text text,
  content_json jsonb,
  language text DEFAULT 'ru',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, version)
);

CREATE TABLE IF NOT EXISTS voice_transcript_redactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id uuid NOT NULL REFERENCES voice_transcripts(id) ON DELETE CASCADE,
  redacted_by uuid REFERENCES users(id),
  reason text,
  mask_ranges jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meetings_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'ended', 'archived')),
  host_user_id uuid NOT NULL REFERENCES users(id),
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  voice_session_id uuid REFERENCES voice_sessions(id),
  summary_text text,
  outcome_text text,
  meta_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_agenda_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings_v2(id) ON DELETE CASCADE,
  sort_order int DEFAULT 0,
  title text NOT NULL,
  description text,
  duration_min int,
  status text DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS meeting_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings_v2(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings_v2(id) ON DELETE CASCADE,
  text text NOT NULL,
  decided_by text,
  source text DEFAULT 'manual' CHECK (source IN ('ai', 'manual')),
  confirmed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings_v2(id) ON DELETE CASCADE,
  title text NOT NULL,
  assignee_text text,
  assignee_user_id uuid REFERENCES users(id),
  due_date date,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'cancelled')),
  source text DEFAULT 'manual' CHECK (source IN ('ai', 'manual')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_log_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings_v2(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_user_id uuid REFERENCES users(id),
  payload_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority int DEFAULT 5,
  template_id text,
  config_json jsonb DEFAULT '{}'::jsonb,
  error_text text,
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_aj_status ON ai_jobs(status, priority, created_at);

CREATE TABLE IF NOT EXISTS ai_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES ai_jobs(id) ON DELETE CASCADE,
  output_type text NOT NULL,
  content_text text,
  content_json jsonb,
  review_status text DEFAULT 'auto' CHECK (review_status IN ('auto', 'pending_review', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  model_id text,
  tokens_input int,
  tokens_output int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  output_id uuid NOT NULL REFERENCES ai_outputs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  rating int CHECK (rating BETWEEN 1 AND 5),
  comment_text text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operator_metrics_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_at timestamptz DEFAULT now(),
  active_voice_sessions int DEFAULT 0,
  active_meetings int DEFAULT 0,
  pending_join_requests int DEFAULT 0,
  open_incidents int DEFAULT 0,
  hot_rooms jsonb DEFAULT '[]'::jsonb,
  meta_json jsonb DEFAULT '{}'::jsonb
);

INSERT INTO schema_migrations(version) VALUES('019_voice_sessions') ON CONFLICT DO NOTHING;
INSERT INTO schema_migrations(version) VALUES('020_meetings_structured') ON CONFLICT DO NOTHING;
INSERT INTO schema_migrations(version) VALUES('021_ai_knowledge') ON CONFLICT DO NOTHING;

COMMIT;
