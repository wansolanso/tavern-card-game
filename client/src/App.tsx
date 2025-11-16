import React from 'react';
import { SocketProvider } from './providers/SocketProvider';
import { useSocketHandlers } from './hooks/useSocketHandlers';
import { GameHeader } from './components/Layout/GameHeader';
import { LobbyScreen } from './components/Board/LobbyScreen';
import { GameBoard } from './components/Board/GameBoard';
import { NotificationContainer } from './components/UI/Notification';
import { useGame, useUI } from './store';

const AppContent: React.FC = () => {
  const game = useGame();
  const ui = useUI();

  // Set up WebSocket event handlers
  useSocketHandlers();

  const renderPhase = () => {
    switch (game.phase) {
      case 'lobby':
        return <LobbyScreen />;
      case 'tavern':
        return <GameBoard />;
      case 'boss':
        return (
          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-tavern-gold">
              Boss Fight (Coming Soon)
            </h1>
          </div>
        );
      case 'gameover':
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-tavern-gold mb-4">
                Game Over
              </h1>
              <p className="text-xl text-gray-300">
                Your adventure has ended
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tavern-gold"></div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-tavern-dark">
      <GameHeader />
      <main className="flex-1 flex flex-col">
        {renderPhase()}
      </main>
      <NotificationContainer notifications={ui.notifications} />

      {/* Loading Overlay */}
      {ui.isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tavern-gold mx-auto mb-4"></div>
            <p className="text-xl text-white">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}

export default App;
