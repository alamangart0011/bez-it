insert into system_settings (key, value_json)
values (
  'branding',
  jsonb_build_object(
    'appName','Контур Связи',
    'organizationName','IT Group Company',
    'organizationInn','',
    'licensePlan','Корпоративный пакет · 100 пользователей',
    'supportLabel','Техническая поддержка',
    'supportEmail','support@kontur.local',
    'releaseLabel','17.9.0 hosting-final',
    'footerMark','Единый корпоративный контур связи, собраний, файлов и административного центра'
  )
)
on conflict (key) do update set value_json = system_settings.value_json || excluded.value_json, updated_at = now();
