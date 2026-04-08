import { authStorage } from './auth';

let loaderPromise = null;
let socketInstance = null;

function loadSocketIoClient() {
  if (window.io) return Promise.resolve(window.io);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-corpchat-socket-client="1"]');
    if (existing) {
      existing.addEventListener('load', () => window.io ? resolve(window.io) : reject(new Error('SOCKET_IO_LOAD_FAILED')));
      existing.addEventListener('error', () => reject(new Error('SOCKET_IO_LOAD_FAILED')));
      return;
    }

    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    script.async = true;
    script.dataset.corpchatSocketClient = '1';
    script.onload = () => window.io ? resolve(window.io) : reject(new Error('SOCKET_IO_LOAD_FAILED'));
    script.onerror = () => reject(new Error('SOCKET_IO_LOAD_FAILED'));
    document.head.appendChild(script);
  });

  return loaderPromise;
}

export async function getSocket() {
  const io = await loadSocketIoClient();
  if (!socketInstance) {
    socketInstance = io({
      path: '/socket.io',
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: { token: authStorage.getAccessToken() }
    });
  }
  socketInstance.auth = { token: authStorage.getAccessToken() };
  return socketInstance;
}

export function resetSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
