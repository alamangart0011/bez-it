insert into system_settings (key, value_json)
values (
  'branding',
  jsonb_build_object(
    'releaseLabel','17.11.0 launch-ready',
    'supportLabel','Техническая поддержка 24/7',
    'footerMark','Единый корпоративный контур связи, собраний, файлов, вызовов в комнаты и административного центра'
  )
)
on conflict (key) do update set value_json = system_settings.value_json || excluded.value_json, updated_at = now();
