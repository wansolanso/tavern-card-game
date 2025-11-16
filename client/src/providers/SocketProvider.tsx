import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/constants';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  emit: <T = unknown>(event: string, data: T) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  emit: () => {},
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(API_CONFIG.WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const emit = useCallback(
    <T = unknown,>(event: string, data: T) => {
      if (socket && connected) {
        socket.emit(event, data);
      } else {
        console.warn('Socket not connected. Cannot emit event:', event);
      }
    },
    [socket, connected]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ socket, connected, emit }),
    [socket, connected, emit]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
