# PR13 smoke sequence

## Локальный preview smoke
1. `curl -I http://127.0.0.1:3300/`
2. открыть локально preview root
3. убедиться, что нет 5xx на первом рендере

## Runtime path smoke
Проверить последовательно:
1. rooms entry
2. active room
3. messages timeline
4. members panel
5. calls entry
6. current call header
7. participant grid
8. controls
9. transcript panel
10. assistant panel

## Внешний preview smoke
После nginx mount:
1. открыть `/runtime-preview/`
2. повторить runtime path smoke
3. убедиться, что root/live contour не сломан

## Acceptance
Smoke считается закрытым, когда `rooms/calls/transcript/assistant` проходят на preview без возврата к старому metadata-only path.
