-- 014: Добавить 'resolved' в CHECK constraint room_incidents.status
-- Причина: incidentsRepository.resolve() ставит status='resolved',
-- но 011 создал CHECK только ('open','acknowledged') → runtime-ошибка PostgreSQL.

alter table room_incidents
  drop constraint if exists room_incidents_status_check;

alter table room_incidents
  add constraint room_incidents_status_check
  check (status in ('open', 'acknowledged', 'resolved'));
