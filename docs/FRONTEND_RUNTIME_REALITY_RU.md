# Frontend runtime reality

## Что есть сейчас в active baseline
Текущий frontend стартует так:
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`

`App.jsx` сейчас является фактическим active UI runtime и уже содержит:
- auth entry;
- загрузку `/api/me`;
- список комнат;
- текстовый чат;
- участников комнаты;
- модалки создания комнат и добавления участников;
- voice join / leave / self;
- overlay и командную палитру.

## Что это означает для нового чата
Новый чат не должен делать вид, что frontend уже разложен на полноценные `shell/auth/rooms/voice/meeting/admin` модули в файловой структуре. По факту active UI пока монолитный.

## Как правильно читать frontend сейчас
1. `frontend/src/main.jsx`
2. `frontend/src/App.jsx`
3. только потом — планировать modularization cleanup

## Как правильно менять frontend
- сначала чинить active runtime внутри текущего `App.jsx`, если это P0/P1;
- не заводить второй active frontend рядом;
- не плодить параллельные entrypoints;
- modularization делать этапом cleanup после runtime parity.

## Целевое направление
После закрытия P0 runtime и SQL parity frontend можно раскладывать по структуре:
- `frontend/src/shell/`
- `frontend/src/views/`
- `frontend/src/features/`
- `frontend/src/api/`
- `frontend/src/shared/`

Но это должно быть продолжением active baseline, а не сменой продуктового канона.
