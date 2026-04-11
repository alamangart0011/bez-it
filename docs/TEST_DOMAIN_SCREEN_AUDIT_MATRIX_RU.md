# Test domain screen audit matrix

## Цель
Дать матрицу проверки экранов после вывода preview на тестовый домен.

## Матрица

| Экран | Что должно быть видно | Что фиксировать | Статус |
|---|---|---|---|
| `/runtime-preview/` root | первый рендер, не пустой экран | скрин root | TODO |
| rooms | список комнат | скрин списка комнат | TODO |
| active room | заголовок комнаты, активный контекст | скрин active room | TODO |
| messages timeline | список сообщений / timeline | скрин timeline | TODO |
| members panel | участники / counters | скрин members panel | TODO |
| calls | call header | скрин calls header | TODO |
| participant grid | список участников звонка | скрин participant grid | TODO |
| controls | controls / devices | скрин controls | TODO |
| transcript panel | chunks / summary | скрин transcript | TODO |
| assistant panel | answer / action items / next steps | скрин assistant | TODO |
| `/runtime-preview-safe/` root | safe fallback root | скрин safe root | TODO |

## Что считать дефектом
- пустой экран;
- 5xx на рендере;
- transcript/assistant как пустые заглушки;
- отсутствие rooms/calls контента;
- поломка основного live/root contour.
