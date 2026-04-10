# FRONTEND WHITEPATCH CODE — APP

## Целевой `frontend/src/App.jsx`

```jsx
import { useEffect, useState } from 'react';
import { api } from './shared/api/base';
import { normalizeUser } from './shared/lib/normalizers';
import { STORAGE_KEYS } from './shared/runtime/constants';
import { BRANDING_DEFAULTS } from './shared/branding/defaults';
import { C } from './shared/ui/tokens';
import { AuthPage } from './features/auth/AuthPage';
import { MainShell } from './features/shell/MainShell';

function LoadingScreen() {
  return (
    <div
      style={{
        height: '100vh',
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: C.acc,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          fontWeight: 800,
          color: '#fff',
        }}
      >
        С
      </div>
      <div style={{ color: C.txt3, fontSize: 13 }}>{BRANDING_DEFAULTS.appName}</div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState('loading');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.token);
    if (!storedToken) {
      setState('auth');
      return;
    }

    api
      .me(storedToken)
      .then((raw) => {
        setUser(normalizeUser(raw?.user || raw));
        setToken(storedToken);
        setState('main');
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEYS.token);
        setState('auth');
      });
  }, []);

  function handleAuth(nextToken, rawUser) {
    setToken(nextToken);
    localStorage.setItem(STORAGE_KEYS.token, nextToken);

    if (rawUser) {
      setUser(normalizeUser(rawUser));
      setState('main');
      return;
    }

    api
      .me(nextToken)
      .then((raw) => {
        setUser(normalizeUser(raw?.user || raw));
        setState('main');
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEYS.token);
        setState('auth');
      });
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEYS.token);
    setToken('');
    setUser(null);
    setState('auth');
  }

  if (state === 'loading') return <LoadingScreen />;
  if (state === 'auth') return <AuthPage onAuth={handleAuth} />;

  return <MainShell user={user} token={token} onLogout={handleLogout} />;
}
```

## Что меняется по сравнению с монолитом

- из `App.jsx` убираются tokens, branding, api request layer, formatters, normalizers, room helpers и voice helpers;
- `App.jsx` становится только bootstrap-entry;
- главный UI уходит в `features/shell/MainShell`;
- auth-экран уходит в `features/auth/AuthPage`.

## Обязательное правило для реального переноса

После вставки этого файла:
1. сначала должны существовать `shared/**` файлы из предыдущего whitepatch;
2. затем должны существовать `features/auth/AuthPage.jsx` и `features/shell/MainShell.jsx`;
3. только после этого можно удалять старую логику из монолита.
