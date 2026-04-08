create index if not exists idx_room_incidents_status_room on room_incidents(status, room_id, severity);
create index if not exists idx_room_join_requests_status_room on room_join_requests(status, room_id);

insert into system_settings (key, value_json)
values ('release.operatorWallboard', jsonb_build_object('enabled', true, 'stage', '13', 'label', 'operator-wallboard', 'releaseLabel', '17.17.0 operator-wallboard'))
on conflict (key) do update set value_json = excluded.value_json, updated_at = now();
