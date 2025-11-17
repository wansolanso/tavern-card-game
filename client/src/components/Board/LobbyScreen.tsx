import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { useGameActions, usePlayerActions } from '../../store';
import apiClient from '../../config/axios';
import { API_ENDPOINTS } from '../../config/constants';

export const LobbyScreen: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { initializeGame, setPhase, setTavernCards } = useGameActions();
  const { setHand } = usePlayerActions();

  const handleNewGame = async () => {
    try {
      setIsCreating(true);

      // First, create a guest session
      // Token will be automatically set as HttpOnly cookie by backend
      const authResponse = await apiClient.post(API_ENDPOINTS.AUTH.GUEST);

      // No need to manually store token - it's in HttpOnly cookie now
      // This protects against XSS attacks

      // Then create a new game
      // Cookie will be automatically sent with this request
      const gameResponse = await apiClient.post(API_ENDPOINTS.GAMES.CREATE);

      const game = gameResponse.data.data.game || gameResponse.data.data;
      initializeGame(game.id);
      setPhase('tavern');

      // Populate tavern cards if they exist in the response
      if (game.tavern && game.tavern.length > 0) {
        setTavernCards(game.tavern);
      }

      // Populate player's starting hand
      if (game.hand && game.hand.length > 0) {
        setHand(game.hand);
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
            loadingText="Creating Game..."
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
