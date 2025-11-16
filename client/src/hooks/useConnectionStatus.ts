import { useSocket } from '../providers/SocketProvider';
import { ConnectionStatus } from '../types/socket';

export const useConnectionStatus = () => {
  const { connectionStatus, retryAttempt, reconnect, metrics, lastConnected } = useSocket();

  return {
    status: connectionStatus,
    isConnected: connectionStatus === ConnectionStatus.CONNECTED,
    isConnecting: connectionStatus === ConnectionStatus.CONNECTING,
    isReconnecting: connectionStatus === ConnectionStatus.RECONNECTING,
    isDisconnected: connectionStatus === ConnectionStatus.DISCONNECTED,
    isFailed: connectionStatus === ConnectionStatus.FAILED,
    retryAttempt,
    reconnect,
    metrics,
    lastConnected,
  };
};
