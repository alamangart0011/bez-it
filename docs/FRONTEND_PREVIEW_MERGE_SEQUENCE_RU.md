# FRONTEND PREVIEW MERGE SEQUENCE

Цель: зафиксировать точный безопасный порядок врезки нового room-based preview слоя в активный frontend baseline без возврата к новому product pivot.

## Уже добавлено в ветку

- `frontend/src/App.preview.jsx`
- `frontend/src/preview/SignalumRoomBasedPreview.jsx`
- `frontend/src/preview/SignalumRoomBasedPreviewPage.jsx`
- `frontend/src/preview/buildRoomBasedPreviewModel.js`
- `frontend/src/preview/useRoomBasedPreviewRuntime.js`
- `frontend/src/preview/previewFlags.js`
- `docs/FRONTEND_PREVIEW_BRIDGE_RU.md`
- `docs/FRONTEND_PREVIEW_FILESET_RU.md`

## Что делает этот слой

1. Даёт product-first shell, который визуально ближе к предоставленному preview HTML.
2. Держит room-based модель: dashboard, text room, voice room, meeting room, admin center.
3. Питается от живых API:
   - `/api/me`
   - `/api/rooms`
   - `/api/rooms/:id/messages`
   - `/api/rooms/:id/members`
   - `/api/voice/rooms/:id/state`
4. Не ломает основной `App.room.jsx`, пока preview не включён.

## Точный bridge-шаг

Когда будет доступен безопасный update existing file, содержимое `frontend/src/App.jsx` должно стать таким:

```jsx
import AppRoom from './App.room.jsx';
import AppPreview from './App.preview.jsx';
import { shouldUseRoomBasedPreview } from './preview/previewFlags.js';

export default function App() {
  return shouldUseRoomBasedPreview() ? <AppPreview /> : <AppRoom />;
}
```

## Как включать preview после bridge

### Вариант 1. Через URL

```text
https://ai.voice.oboron-it.ru/?preview=1
```

### Вариант 2. Через localStorage

```js
localStorage.setItem('signalum_room_based_preview', '1')
location.reload()
```

### Выключение

```js
localStorage.removeItem('signalum_room_based_preview')
location.reload()
```

## Почему это безопасно

- основной room-based runtime остаётся на `App.room.jsx`;
- preview слой не подменяет API-контур и не требует отдельного домена;
- включение идёт только по явному флагу;
- это позволяет параллельно держать живой baseline и новый UI-слой.

## Следующий технический ход после bridge

1. Привязать реальные actions к кнопкам `Войти в голос`, `Отключить звук`, `Новая комната`.
2. Добавить живые счётчики pending requests / incidents / room stats.
3. Заменить статические quick blocks на данные из admin/overview и operator wallboard.
4. Перенести dangerous controls во второй уровень уже в runtime preview.
5. После этого использовать preview как фронтовой bridge к следующему production shell.
