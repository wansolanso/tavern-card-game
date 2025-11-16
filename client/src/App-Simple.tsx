import React, { useState } from 'react';
import axios from 'axios';
import type { ApiGame } from './types/api';
import { getErrorMessage } from './utils/typeGuards';

const API_BASE = 'http://localhost:3000/api/v1';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  const [gameData, setGameData] = useState<ApiGame | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGuestSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_BASE}/auth/guest`);
      const authToken = response.data.data.token;

      setToken(authToken);
      localStorage.setItem('authToken', authToken);

      console.log('✅ Guest session created');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      console.error('❌ Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGame = async () => {
    if (!token) {
      setError('Please create a session first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_BASE}/games`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const game = response.data.data.game || response.data.data;
      setGameId(game.id);
      setGameData(game);

      console.log('✅ Game created:', game);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      console.error('❌ Game creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGameState = async () => {
    if (!token || !gameId) {
      setError('Please create a game first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_BASE}/games/${gameId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const game = response.data.data.game || response.data.data;
      setGameData(game);

      console.log('✅ Game state refreshed:', game);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      console.error('❌ Get game error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🎮 Tavern Card Game - Integration Test
        </h1>

        {/* Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Status</h2>
          <div className="space-y-2">
            <p>Auth Token: {token ? '✅ Connected' : '❌ Not connected'}</p>
            <p>Game ID: {gameId ? `✅ Game #${gameId}` : '❌ No game'}</p>
            {error && (
              <p className="text-red-500">Error: {error}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={createGuestSession}
              disabled={loading || !!token}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
            >
              1. Create Session
            </button>

            <button
              onClick={createGame}
              disabled={loading || !token || !!gameId}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
            >
              2. Create Game
            </button>

            <button
              onClick={getGameState}
              disabled={loading || !gameId}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
            >
              3. Refresh State
            </button>
          </div>
        </div>

        {/* Game Data */}
        {gameData && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Game State</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Game Info</h3>
                <p>Phase: {gameData.phase}</p>
                <p>Turn: {gameData.current_turn}</p>
                <p>Player HP: {gameData.player_current_hp}/{gameData.player_max_hp}</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Tavern Cards ({gameData.tavern?.length || 0})</h3>
                <div className="grid grid-cols-3 gap-2">
                  {gameData.tavern?.map((card, i) => (
                    <div key={card.id || i} className="bg-gray-700 p-3 rounded">
                      <p className="font-semibold">{card.name}</p>
                      <p className="text-sm">HP: {card.stats.hp || 0}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Hand ({gameData.hand?.length || 0})</h3>
                <div className="flex gap-2 flex-wrap">
                  {gameData.hand?.map((card, i) => (
                    <div key={card.id || i} className="bg-gray-700 p-2 rounded text-sm">
                      {card.name}
                    </div>
                  ))}
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer font-semibold">Raw JSON</summary>
                <pre className="mt-2 bg-gray-900 p-4 rounded overflow-auto text-xs">
                  {JSON.stringify(gameData, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-lg">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
              <p className="mt-4">Loading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
