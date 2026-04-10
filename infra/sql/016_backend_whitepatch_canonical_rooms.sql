insert into rooms (id, name, kind, is_private, is_archived, entry_mode)
values
('10000000-0000-0000-0000-000000000001','Общий контур','group',false,false,'open'),
('10000000-0000-0000-0000-000000000002','Голосовой контур','voice',false,false,'knock'),
('10000000-0000-0000-0000-000000000003','Комната для собраний','meeting',false,false,'knock')
on conflict (id) do update
set name = excluded.name,
    kind = excluded.kind,
    is_private = excluded.is_private,
    is_archived = false,
    entry_mode = excluded.entry_mode;

insert into room_members (room_id, user_id)
select room_id, user_id
from (
  values
    ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
    ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
    ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000003'::uuid),
    ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000004'::uuid),
    ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000005'::uuid),
    ('10000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
    ('10000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
    ('10000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000003'::uuid),
    ('10000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000004'::uuid),
    ('10000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000005'::uuid),
    ('10000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
    ('10000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
    ('10000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000003'::uuid),
    ('10000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000004'::uuid),
    ('10000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000005'::uuid)
) as seed(room_id, user_id)
on conflict do nothing;

insert into meetings (room_id, status, title, agenda, host_user_id)
values
('10000000-0000-0000-0000-000000000003','planned','Комната для собраний','Whitepatch canonical meeting runtime','00000000-0000-0000-0000-000000000003')
on conflict (room_id) do update
set title = excluded.title,
    agenda = excluded.agenda,
    host_user_id = excluded.host_user_id;

insert into voice_participants (room_id, user_id, voice_role, is_connected, is_muted, is_deafened, hand_raised, is_speaking, screen_active, voice_banned)
values
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','host',false,false,false,false,false,false,false),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','moderator',false,false,false,false,false,false,false),
('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003','host',false,false,false,false,false,false,false)
on conflict (room_id, user_id) do update
set voice_role = excluded.voice_role,
    updated_at = now();
