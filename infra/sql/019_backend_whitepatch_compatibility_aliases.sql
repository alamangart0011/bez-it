alter table rooms add column if not exists access_mode text;
update rooms set access_mode = coalesce(access_mode, entry_mode);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'rooms_access_mode_check'
  ) then
    alter table rooms
      add constraint rooms_access_mode_check
      check (access_mode in ('open', 'knock', 'closed'));
  end if;
exception when duplicate_object then
  null;
end $$;

alter table messages add column if not exists content text;
update messages set content = coalesce(content, body);

create or replace function sync_rooms_access_mode_whitepatch()
returns trigger as $$
begin
  if new.entry_mode is not null and (new.access_mode is null or new.access_mode = old.access_mode) then
    new.access_mode := new.entry_mode;
  end if;
  if new.access_mode is not null and (new.entry_mode is null or new.entry_mode = old.entry_mode) then
    new.entry_mode := new.access_mode;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_rooms_access_mode_whitepatch on rooms;
create trigger trg_rooms_access_mode_whitepatch
before insert or update on rooms
for each row
execute function sync_rooms_access_mode_whitepatch();

create or replace function sync_messages_content_whitepatch()
returns trigger as $$
begin
  if new.body is not null and (new.content is null or new.content = old.content) then
    new.content := new.body;
  end if;
  if new.content is not null and (new.body is null or new.body = old.body) then
    new.body := new.content;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_messages_content_whitepatch on messages;
create trigger trg_messages_content_whitepatch
before insert or update on messages
for each row
execute function sync_messages_content_whitepatch();
