import { useEffect, useRef } from 'react';
import { useAppSelector } from '../store';
import { connectSocket, disconnectSocket } from '../services/socket';
import { getDisplayName } from '../utils/name';

export function useSocketConnection() {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket();
      registeredRef.current = false;
      return;
    }

    // Always disconnect first so auth token is refreshed on reconnect
    disconnectSocket();
    const socket = connectSocket();

    const registerUser = () => {
      const payload = {
        userId: user.id,
        role: user.role,
        name: getDisplayName(user, { fallback: 'User' }),
      };
      socket.emit('register-user', payload);
      registeredRef.current = true;
    };

    if (socket.connected) registerUser();
    socket.on('connect', registerUser);

    return () => { socket.off('connect', registerUser); };
  }, [isAuthenticated, user]);
}
