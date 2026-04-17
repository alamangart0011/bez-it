import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { parseInviteTokenFromLocation, rememberPendingInvite, initInviteAutoAccept } from './shared/invites.js';

const pendingInvite = parseInviteTokenFromLocation();
if (pendingInvite) {
  rememberPendingInvite(pendingInvite);
  window.history.replaceState({}, '', '/');
}
initInviteAutoAccept();

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}
