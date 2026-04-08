insert into system_settings (key, value_json)
values (
  'branding',
  jsonb_build_object(
    'releaseLabel','17.10.1 ops-ready',
    'licensePlan','Корпоративный пакет · 100 пользователей',
    'footerMark','Единый корпоративный контур связи, собраний, файлов, вызовов в комнаты и административного центра'
  )
)
on conflict (key) do update set value_json = system_settings.value_json || excluded.value_json, updated_at = now();
