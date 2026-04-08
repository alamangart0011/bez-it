#!/usr/bin/env bash
set -Eeuo pipefail

BASE="${BASE:-/opt/messenger/contour-chat-jino-final}"
FIXROOT="$BASE/deploy/fixpacks"
STAMP="$(date +%Y%m%d_%H%M%S)"
WORK="$FIXROOT/$STAMP"
DB_CONTAINER_SERVICE="db"
API_CONTAINER_SERVICE="api"
WEB_CONTAINER_SERVICE="web"

mkdir -p "$WORK"
cd "$BASE"

echo "[0/9] precheck"
test -f docker-compose.yml
test -d infra/sql
test -f deploy/apply_sql.sh
test -f infra/sql/013_legacy_schema_parity.sql

echo "[1/9] backup files"
cp -f deploy/apply_sql.sh "$WORK/apply_sql.sh.before"
cp -f infra/sql/013_legacy_schema_parity.sql "$WORK/013_legacy_schema_parity.sql.before"
[ -f infra/sql/014_runtime_alignment.sql ] && cp -f infra/sql/014_runtime_alignment.sql "$WORK/014_runtime_alignment.sql.before" || true

echo "[2/9] backup database"
docker compose exec -T "$DB_CONTAINER_SERVICE" sh -lc 'pg_dump -s -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$WORK/pre_fix_schema.sql"
docker compose exec -T "$DB_CONTAINER_SERVICE" sh -lc 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$WORK/pre_fix_db.dump"

echo "[3/9] rewrite deploy/apply_sql.sh"
cat > deploy/apply_sql.sh <<'EOS'
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

psql_exec() {
  docker compose exec -T db sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -'
}

psql_query() {
  docker compose exec -T db sh -lc "$1"
}

psql_query 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());"' >/dev/null

HAS_BASE="$({ psql_query 'psql -At -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT CASE WHEN to_regclass('\''public.users'\'') IS NOT NULL AND to_regclass('\''public.rooms'\'') IS NOT NULL THEN 1 ELSE 0 END;"'; } | tr -d '\r')"

for f in $(ls infra/sql/*.sql | sort); do
  base="$(basename "$f")"

  if [ "$HAS_BASE" = "1" ] && { [ "$base" = "001_init.sql" ] || [ "$base" = "002_seed.sql" ]; }; then
    echo "[SQL] skip $base on existing baseline"
    continue
  fi

  APPLIED="$({ psql_query "psql -At -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -c \"SELECT 1 FROM schema_migrations WHERE version = '$base' LIMIT 1;\""; } | tr -d '\r')"
  if [ "$APPLIED" = "1" ]; then
    echo "[SQL] already applied $base"
    continue
  fi

  echo "[SQL] apply $base"
  psql_exec < "$f"
  psql_query "psql -v ON_ERROR_STOP=1 -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -c \"INSERT INTO schema_migrations(version) VALUES ('$base') ON CONFLICT (version) DO NOTHING;\"" >/dev/null
  echo "[SQL] applied $base"
done
EOS
chmod +x deploy/apply_sql.sh

echo "[4/9] rewrite 013_legacy_schema_parity.sql to safe compatibility"
cat > infra/sql/013_legacy_schema_parity.sql <<'SQL'
-- 013_legacy_schema_parity.sql (safe rewrite)
-- Purpose: only backward-compatible additions for existing baselines.
-- Do not redefine current V17 tables with legacy shapes.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS entry_mode text NOT NULL DEFAULT 'open';
UPDATE rooms SET entry_mode = 'open' WHERE entry_mode IS NULL OR entry_mode = '';

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS about text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS sound_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS desktop_notifications boolean NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS compact_mode boolean NOT NULL DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS enter_to_send boolean NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS push_to_talk boolean NOT NULL DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS voice_input_device text;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS voice_output_device text;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS high_contrast boolean NOT NULL DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS reduce_motion boolean NOT NULL DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS value_json jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS actor_user_id uuid;
ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS target_user_id uuid;
ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS meta_json jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;
ALTER TABLE room_incidents ADD COLUMN IF NOT EXISTS acknowledged_by_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_user_profiles_department_id ON user_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(lower(email));
CREATE INDEX IF NOT EXISTS idx_room_incidents_room_id ON room_incidents(room_id);
CREATE INDEX IF NOT EXISTS idx_room_incidents_status ON room_incidents(status);
SQL

echo "[5/9] write 014_runtime_alignment.sql"
cat > infra/sql/014_runtime_alignment.sql <<'SQL'
-- 014_runtime_alignment.sql
-- Align live schema to current V17 code.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- user_settings.font_scale: legacy numeric -> current text enum
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'font_scale' AND data_type = 'numeric'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS font_scale_v17 text;
    EXECUTE $q$
      UPDATE public.user_settings
      SET font_scale_v17 = CASE
        WHEN font_scale IS NULL THEN 'normal'
        WHEN font_scale < 1 THEN 'small'
        WHEN font_scale > 1 THEN 'large'
        ELSE 'normal'
      END
    $q$;
    ALTER TABLE public.user_settings DROP COLUMN font_scale;
    ALTER TABLE public.user_settings RENAME COLUMN font_scale_v17 TO font_scale;
  END IF;
END $$;

ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS font_scale text;
UPDATE public.user_settings SET font_scale = 'normal' WHERE font_scale IS NULL OR btrim(font_scale::text) = '';
ALTER TABLE public.user_settings ALTER COLUMN font_scale TYPE text USING font_scale::text;
ALTER TABLE public.user_settings ALTER COLUMN font_scale SET DEFAULT 'normal';
ALTER TABLE public.user_settings ALTER COLUMN font_scale SET NOT NULL;
ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS user_settings_font_scale_check;
ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_font_scale_check CHECK (font_scale IN ('small','normal','large'));

-- invitations: live DB may still require legacy columns token / organization_name.
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS invited_by_user_id uuid;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS token_hash text;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS accepted_user_id uuid;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'token'
  ) THEN
    UPDATE public.invitations
    SET token_hash = encode(digest(token, 'sha256'), 'hex')
    WHERE token_hash IS NULL AND token IS NOT NULL;
    EXECUTE 'ALTER TABLE public.invitations ALTER COLUMN token DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'organization_name'
  ) THEN
    EXECUTE 'ALTER TABLE public.invitations ALTER COLUMN organization_name DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'invited_by'
  ) THEN
    UPDATE public.invitations SET invited_by_user_id = invited_by WHERE invited_by_user_id IS NULL AND invited_by IS NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_token_hash_unique ON public.invitations(token_hash) WHERE token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by_user_id ON public.invitations(invited_by_user_id);

-- system settings defaults expected by shell/admin runtime
INSERT INTO public.system_settings(key, value_json)
VALUES
  ('branding', '{"appName":"Контур Связи","organizationName":"IT Group Company","organizationInn":"","licensePlan":"Корпоративный пакет · 100 пользователей","supportLabel":"Техническая поддержка","supportEmail":"support@kontur.local","releaseLabel":"V17","footerMark":"Единый корпоративный контур связи, собраний и администрирования"}'::jsonb),
  ('announcement', '{"isActive":false,"level":"info","title":"","message":"","activeUntil":null,"scope":"all"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- room incidents: operator wallboard fields
ALTER TABLE public.room_incidents ADD COLUMN IF NOT EXISTS actor_user_id uuid;
ALTER TABLE public.room_incidents ADD COLUMN IF NOT EXISTS target_user_id uuid;
ALTER TABLE public.room_incidents ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.room_incidents ADD COLUMN IF NOT EXISTS meta_json jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.room_incidents ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;
ALTER TABLE public.room_incidents ADD COLUMN IF NOT EXISTS acknowledged_by_user_id uuid;

-- optional indexes for current code paths
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_voice_participants_room_id ON public.voice_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_meetings_room_id ON public.meetings(room_id);
SQL

echo "[6/9] apply tracked migrations"
# Mark already-applied migrations for stable current baseline except the rewritten 013 and new 014.
docker compose exec -T "$DB_CONTAINER_SERVICE" sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());"' >/dev/null
for f in 003_stage7_admin_center.sql 004_release_candidate_polish.sql 005_final_hosting_release.sql 006_operations_hardening.sql 007_launch_readiness.sql 008_launch_control.sql 009_entry_control.sql 010_launch_board_presence.sql 011_launch_monitor_incidents.sql 012_operator_wallboard.sql; do
  docker compose exec -T "$DB_CONTAINER_SERVICE" sh -lc "psql -v ON_ERROR_STOP=1 -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -c \"INSERT INTO schema_migrations(version) VALUES ('$f') ON CONFLICT (version) DO NOTHING;\"" >/dev/null || true
done
bash deploy/apply_sql.sh

echo "[7/9] restart api/web"
docker compose restart "$API_CONTAINER_SERVICE" "$WEB_CONTAINER_SERVICE"
sleep 10

echo "[8/9] smoke"
if [ -x ./signalum_v17_postfix_smoke.sh ]; then
  ./signalum_v17_postfix_smoke.sh http://127.0.0.1:8080 admin@corpchat.local Admin@12345!
else
  bash scripts/smoke_api.sh http://127.0.0.1:3001
fi

echo "[9/9] done"
echo "[OK] autofix complete"
echo "[INFO] fix backup dir: $WORK"
echo "[INFO] rollback helper: $BASE/signalum_v17_postfix_rollback.sh $WORK"
