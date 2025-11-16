import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/constants';
import { ConnectionStatus, type SocketContextValue, type ConnectionMetrics } from '../types/socket';
import { MessageQueue } from '../utils/messageQueue';
import { handleWebSocketError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const SocketContext = createContext<SocketContextValue | null>(null);

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

// Exponential backoff configuration
const INITIAL_DELAY = 1000; // 1 second
const MAX_DELAY = 30000; // 30 seconds
const BACKOFF_MULTIPLIER = 2;
const JITTER_FACTOR = 0.25; // ±25%
const MAX_CONSECUTIVE_FAILURES = 10;
const CIRCUIT_BREAKER_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Socket.io configuration with enhanced reconnection
const SOCKET_OPTIONS = {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: INITIAL_DELAY,
  reconnectionDelayMax: MAX_DELAY,
  randomizationFactor: JITTER_FACTOR,
  timeout: 10000,
  autoConnect: true,
  transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [lastConnected, setLastConnected] = useState<Date | null>(null);
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    latency: 0,
    lastPingTime: null,
    packetLoss: 0,
  });

  // Refs for tracking connection state
  const consecutiveFailures = useRef(0);
  const circuitBreakerUntil = useRef<number | null>(null);
  const messageQueue = useRef(new MessageQueue());
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate exponential backoff with jitter
  const getBackoffDelay = useCallback((attempt: number): number => {
    const baseDelay = Math.min(INITIAL_DELAY * Math.pow(BACKOFF_MULTIPLIER, attempt), MAX_DELAY);
    const jitter = baseDelay * JITTER_FACTOR * (Math.random() * 2 - 1);
    return Math.floor(baseDelay + jitter);
  }, []);

  // Start heartbeat/ping-pong mechanism
  const startHeartbeat = useCallback((socketInstance: Socket) => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
    }

    pingInterval.current = setInterval(() => {
      if (socketInstance.connected) {
        const startTime = Date.now();
        socketInstance.emit('ping', startTime);
      }
    }, 10000); // Ping every 10 seconds
  }, []);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
  }, []);

  // Process queued messages
  const processQueue = useCallback((socketInstance: Socket) => {
    const messages = messageQueue.current.getAll();

    if (messages.length > 0) {
      console.log(`Processing ${messages.length} queued messages`);

      messages.forEach((msg) => {
        socketInstance.emit(msg.event, msg.data);
      });

      messageQueue.current.clear();
    }
  }, []);

  // Emit function with queue support
  const emit = useCallback(
    <T = unknown,>(event: string, data: T, priority: number = 0) => {
      if (socket && connectionStatus === ConnectionStatus.CONNECTED) {
        socket.emit(event, data);
      } else {
        console.warn(`Socket not connected. Queueing event: ${event}`);
        messageQueue.current.add(event, data, priority);
      }
    },
    [socket, connectionStatus]
  );

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (socket) {
      console.log('Manual reconnect triggered');
      setRetryAttempt(0);
      consecutiveFailures.current = 0;
      circuitBreakerUntil.current = null;
      socket.connect();
    }
  }, [socket]);

  // Manual disconnect function
  const disconnect = useCallback(() => {
    if (socket) {
      console.log('Manual disconnect triggered');
      stopHeartbeat();
      socket.disconnect();
    }
  }, [socket, stopHeartbeat]);

  // Network online/offline handlers
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network online - attempting reconnect');
      if (socket && !socket.connected) {
        setRetryAttempt(0);
        socket.connect();
      }
    };

    const handleOffline = () => {
      console.warn('Network offline - connection will retry when online');
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [socket]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_CONFIG.WS_URL, SOCKET_OPTIONS);

    // Connection successful
    newSocket.on('connect', () => {
      logger.info('WebSocket connected successfully');
      setConnectionStatus(ConnectionStatus.CONNECTED);
      setLastConnected(new Date());
      consecutiveFailures.current = 0;
      circuitBreakerUntil.current = null;
      setRetryAttempt(0);

      // Start heartbeat monitoring
      startHeartbeat(newSocket);

      // Process queued messages
      processQueue(newSocket);
    });

    // Connection lost - will auto-retry
    newSocket.on('disconnect', (reason) => {
      const errorDef = handleWebSocketError(reason, retryAttempt);
      logger.warn(`WebSocket disconnected: ${errorDef.message}`, { reason, code: errorDef.code });
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      stopHeartbeat();

      // Check if server initiated disconnect (don't retry)
      if (reason === 'io server disconnect') {
        setConnectionStatus(ConnectionStatus.FAILED);
      }
    });

    // Connection error
    newSocket.on('connect_error', (error) => {
      logger.error('WebSocket connection error:', error);
      consecutiveFailures.current++;

      // Check circuit breaker
      if (consecutiveFailures.current >= MAX_CONSECUTIVE_FAILURES) {
        circuitBreakerUntil.current = Date.now() + CIRCUIT_BREAKER_TIMEOUT;
        const errorDef = handleWebSocketError('max retries', consecutiveFailures.current);
        logger.error(`Circuit breaker activated: ${errorDef.message}`);
        setConnectionStatus(ConnectionStatus.FAILED);
      } else {
        setConnectionStatus(ConnectionStatus.RECONNECTING);
      }
    });

    // Reconnection attempt
    newSocket.io.on('reconnect_attempt', (attempt) => {
      logger.debug(`Reconnection attempt ${attempt}`);
      setRetryAttempt(attempt);

      // Check circuit breaker
      if (circuitBreakerUntil.current && Date.now() < circuitBreakerUntil.current) {
        logger.warn('Circuit breaker active - delaying reconnect');
        newSocket.io.opts.reconnectionDelay = CIRCUIT_BREAKER_TIMEOUT;
      } else {
        const delay = getBackoffDelay(attempt - 1);
        newSocket.io.opts.reconnectionDelay = delay;
        logger.debug(`Next reconnect delay: ${delay}ms`);
      }

      setConnectionStatus(ConnectionStatus.RECONNECTING);
    });

    // Reconnection successful
    newSocket.io.on('reconnect', (attempt) => {
      logger.info(`Reconnected successfully after ${attempt} attempts`);
      setConnectionStatus(ConnectionStatus.CONNECTED);
      setRetryAttempt(0);
    });

    // Reconnection failed (after max attempts - though we set to Infinity)
    newSocket.io.on('reconnect_failed', () => {
      const errorDef = handleWebSocketError('reconnect failed', retryAttempt);
      logger.error(`Reconnection failed: ${errorDef.message}`);
      setConnectionStatus(ConnectionStatus.FAILED);
    });

    // Pong response for latency tracking
    newSocket.on('pong', (serverTime: number) => {
      const latency = Date.now() - serverTime;
      setMetrics((prev) => ({
        ...prev,
        latency,
        lastPingTime: Date.now(),
      }));
    });

    setSocket(newSocket);

    return () => {
      stopHeartbeat();
      newSocket.close();
    };
  }, [getBackoffDelay, startHeartbeat, stopHeartbeat, processQueue]);

  // Memoize the context value
  const value = useMemo<SocketContextValue>(
    () => ({
      socket,
      isConnected: connectionStatus === ConnectionStatus.CONNECTED,
      connectionStatus,
      retryAttempt,
      lastConnected,
      metrics,
      emit,
      reconnect,
      disconnect,
    }),
    [socket, connectionStatus, retryAttempt, lastConnected, metrics, emit, reconnect, disconnect]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
