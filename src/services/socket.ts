import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'https://videoconsultapi.msidemopro.com';
const MAX_CONNECT_ERRORS = 5;

let socket: Socket | null = null;
let connectErrors = 0;
let socketTemporarilyDisabled = false;

export const connectSocket = (): Socket => {
  if (socketTemporarilyDisabled) {
    // Return a disconnected socket instance so callers remain safe.
    return socket || io(SOCKET_URL, { autoConnect: false });
  }

  if (socket) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: (cb) => cb({ token: getAccessToken() }),
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    connectErrors = 0;
    socketTemporarilyDisabled = false;
    console.log('[Socket] Connected:', socket?.id);
  });
  socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
  socket.on('connect_error', (error) => {
    connectErrors += 1;
    // Avoid noisy logs when backend doesn't expose socket.io.
    if (connectErrors <= 2) {
      console.warn('[Socket] Unavailable:', error.message);
    }
    if (connectErrors >= MAX_CONNECT_ERRORS) {
      socketTemporarilyDisabled = true;
      socket?.disconnect();
      console.warn('[Socket] Disabled temporarily after repeated connection failures');
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;

export const emitEvent = (event: string, data?: unknown) => {
  const s = socket || connectSocket();
  if (s.connected) {
    s.emit(event, data);
    return;
  }

  // Queue one-shot emit for the next successful reconnect.
  const emitOnConnect = () => {
    s.emit(event, data);
    s.off('connect', emitOnConnect);
  };
  s.on('connect', emitOnConnect);
  s.connect();

  // Avoid leaking listeners if reconnect never happens.
  setTimeout(() => s.off('connect', emitOnConnect), 6000);
};

export const onEvent = (event: string, callback: (...args: unknown[]) => void) => {
  const s = socket || connectSocket();
  s.on(event, callback);
};

export const offEvent = (event: string, callback?: (...args: unknown[]) => void) => {
  if (socket) socket.off(event, callback);
};
