insert into audit_logs (id, actor_user_id, action, target, result, meta_json)
select gen_random_uuid(), null, 'whitepatch.runtime.bootstrap', 'system', 'success', jsonb_build_object('release','17.18.0 whitepatch')
where not exists (
  select 1 from audit_logs where action = 'whitepatch.runtime.bootstrap'
);

insert into meeting_events (id, room_id, actor_user_id, event_type, body)
select gen_random_uuid(), '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'note', 'Whitepatch applied: canonical runtime baseline prepared.'
where exists (
  select 1 from rooms where id = '10000000-0000-0000-0000-000000000003'
)
and not exists (
  select 1 from meeting_events where room_id = '10000000-0000-0000-0000-000000000003' and body = 'Whitepatch applied: canonical runtime baseline prepared.'
);

update rooms
set is_archived = false
where id in (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003'
);
