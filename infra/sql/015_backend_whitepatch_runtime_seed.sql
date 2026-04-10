update rooms
set entry_mode = case
  when kind in ('voice','meeting') then coalesce(nullif(entry_mode, ''), 'knock')
  else coalesce(nullif(entry_mode, ''), 'open')
end;

insert into meeting_presence_logs (id, room_id, user_id, actor_user_id, event_type, note)
select gen_random_uuid(), r.id, null, null, 'bootstrap', 'Whitepatch bootstrap presence log'
from rooms r
left join meeting_presence_logs mpl on mpl.room_id = r.id
where r.kind = 'meeting'
  and mpl.id is null;

insert into room_incidents (id, room_id, actor_user_id, target_user_id, incident_type, severity, status, note, meta_json)
select gen_random_uuid(), r.id, null, null, 'baseline_watch', 'warning', 'resolved', 'Whitepatch baseline watch marker', jsonb_build_object('source','whitepatch')
from rooms r
left join room_incidents ri on ri.room_id = r.id and ri.incident_type = 'baseline_watch'
where r.kind in ('voice','meeting')
  and ri.id is null;

insert into system_settings (key, value_json)
values (
  'runtime',
  jsonb_build_object(
    'singleDeployPath', true,
    'singleRuntimePath', true,
    'baseline', 'room-based-v17',
    'whitepatch', 'applied'
  )
)
on conflict (key) do update
set value_json = system_settings.value_json || excluded.value_json,
    updated_at = now();
