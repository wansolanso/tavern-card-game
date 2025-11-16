import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { useGameActions } from '../../store';
import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '../../config/constants';

export const LobbyScreen: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { initializeGame, setPhase, setTavernCards } = useGameActions();

  const handleNewGame = async () => {
    try {
      setIsCreating(true);

      // First, create a guest session
      const authResponse = await axios.post(
        `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}${API_ENDPOINTS.AUTH.GUEST}`
      );

      const token = authResponse.data.data.token;
      localStorage.setItem('authToken', token);

      // Then create a new game
      const gameResponse = await axios.post(
        `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}${API_ENDPOINTS.GAMES.CREATE}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const game = gameResponse.data.data.game || gameResponse.data.data;
      initializeGame(game.id);
      setPhase('tavern');

      // Populate tavern cards if they exist in the response
      if (game.tavern && game.tavern.length > 0) {
        setTavernCards(game.tavern);
      }
    } catch (error) {
      console.error('Failed to create game:', error);
      alert('Failed to create game. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-tavern-dark to-tavern-wood">
      <div className="text-center max-w-2xl p-8">
        <h1 className="text-6xl font-bold text-tavern-gold mb-4 text-shadow">
          ⚔️ Tavern Card Game
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          A roguelike card battler where you build your deck by battling tavern cards
        </p>

        <div className="flex flex-col gap-4 max-w-md mx-auto">
          <Button
            variant="primary"
            size="lg"
            onClick={handleNewGame}
            isLoading={isCreating}
            className="w-full"
          >
            New Game
          </Button>

          <Button
            variant="secondary"
            size="lg"
            disabled
            className="w-full"
          >
            Continue (Coming Soon)
          </Button>

          <Button
            variant="ghost"
            size="lg"
            disabled
            className="w-full"
          >
            Card Collection (Coming Soon)
          </Button>
        </div>

        <div className="mt-12 text-sm text-gray-400">
          <p>Build your deck by defeating tavern cards</p>
          <p>Equip cards to slots to enhance your abilities</p>
          <p>Face powerful bosses at the end of each round</p>
        </div>
      </div>
    </div>
  );
};
