insert into system_settings (key, value_json)
values
  ('branding', jsonb_build_object(
    'releaseLabel', '17.12.0 launch-control',
    'footerMark', 'Единый корпоративный контур связи, собраний, массовой модерации и системных объявлений.'
  )),
  ('announcement', jsonb_build_object(
    'isActive', false,
    'level', 'info',
    'title', '',
    'message', '',
    'activeUntil', null,
    'scope', 'all'
  ))
on conflict (key) do update set value_json = system_settings.value_json || excluded.value_json, updated_at = now();
