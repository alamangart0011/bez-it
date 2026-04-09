-- V17 fix: allow resolved status for room incidents used by incidentsRepository.resolve()
DO $$
BEGIN
  ALTER TABLE room_incidents DROP CONSTRAINT IF EXISTS room_incidents_status_check;
  ALTER TABLE room_incidents
    ADD CONSTRAINT room_incidents_status_check
    CHECK (status IN ('open', 'acknowledged', 'resolved'));
END $$;

insert into schema_migrations(version)
values ('015_room_incidents_resolved_status')
on conflict do nothing;
