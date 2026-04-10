do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'room_join_requests_status_check'
  ) then
    alter table room_join_requests
      add constraint room_join_requests_status_check
      check (status in ('pending', 'approved', 'denied'));
  end if;
exception when duplicate_object then
  null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'room_incidents_severity_check'
  ) then
    alter table room_incidents
      add constraint room_incidents_severity_check
      check (severity in ('info', 'warning', 'critical'));
  end if;
exception when duplicate_object then
  null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'room_incidents_status_check'
  ) then
    alter table room_incidents
      add constraint room_incidents_status_check
      check (status in ('open', 'acknowledged', 'resolved'));
  end if;
exception when duplicate_object then
  null;
end $$;

create index if not exists idx_rooms_runtime_contract on rooms(kind, is_archived, entry_mode);
create index if not exists idx_system_settings_key_updated on system_settings(key, updated_at desc);
create index if not exists idx_audit_logs_action_created on audit_logs(action, created_at desc);

insert into system_settings (key, value_json)
values (
  'whitepatch',
  jsonb_build_object(
    'version', '18.0',
    'baseline', 'room-based-v17',
    'runtimeContract', 'guarded',
    'sqlParity', 'extended'
  )
)
on conflict (key) do update
set value_json = system_settings.value_json || excluded.value_json,
    updated_at = now();
