# FRONTEND PREVIEW FILESET

В ветке уже добавлены файлы для product-first room-based preview слоя:

- `frontend/src/App.preview.jsx`
- `frontend/src/preview/SignalumRoomBasedPreview.jsx`
- `frontend/src/preview/SignalumRoomBasedPreviewPage.jsx`
- `frontend/src/preview/buildRoomBasedPreviewModel.js`
- `frontend/src/preview/useRoomBasedPreviewRuntime.js`
- `frontend/src/preview/previewFlags.js`

Назначение слоя:
- показать shell/dashboard/room/voice/meeting/admin ближе к предоставленному HTML preview;
- кормить UI живыми данными из `/api/rooms`, `/api/me`, `/api/rooms/:id/messages`, `/api/rooms/:id/members`, `/api/voice/rooms/:id/state`;
- держать room-based baseline без возврата в messenger-first.

Оставшийся bridge-шаг:
- заменить содержимое `frontend/src/App.jsx` на переключатель между `App.room.jsx` и `App.preview.jsx` по `?preview=1` или localStorage флагу.

Целевой вид bridge-кода:

```jsx
import AppRoom from './App.room.jsx';
import AppPreview from './App.preview.jsx';
import { shouldUseRoomBasedPreview } from './preview/previewFlags.js';

export default function App() {
  return shouldUseRoomBasedPreview() ? <AppPreview /> : <AppRoom />;
}
```

Статус:
- preview fileset: готово;
- runtime hook: готово;
- visual shell: готово как отдельный слой;
- live bridge into App.jsx: ожидает безопасного update existing file.
