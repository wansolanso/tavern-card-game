import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ability {
  id: string;
  name: string;
  description: string;
  type: string;
  power: number;
}

interface CardPreviewProps {
  card: {
    id: string | number;
    name: string;
    description?: string;
    rarity?: string;
    stats?: {
      hp?: number;
      defense?: number;
    };
    hp?: number;
    current_hp?: number;
    shield?: number;
    current_shield?: number;
    abilities?: {
      special?: Ability[];
      passive?: Ability[];
      normal?: Ability[];
    };
  };
  position: { x: number; y: number };
  isVisible: boolean;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ card, position, isVisible }) => {
  const rarityColors: Record<string, string> = {
    common: 'from-gray-700 to-gray-800 border-gray-500',
    uncommon: 'from-green-700 to-green-900 border-green-500',
    rare: 'from-blue-700 to-blue-900 border-blue-500',
    epic: 'from-purple-700 to-purple-900 border-purple-500',
    legendary: 'from-orange-600 to-red-800 border-orange-500',
  };

  const colorClass = card.rarity ? rarityColors[card.rarity] : rarityColors.common;

  // Get HP and Shield values (works for both tavern and hand cards)
  const hp = card.stats?.hp || card.hp || card.current_hp || 0;
  const shield = card.stats?.defense || card.shield || card.current_shield || 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: position.x + 20,
            top: position.y - 50,
          }}
        >
          <div className={`bg-gradient-to-br ${colorClass} rounded-lg border-4 p-4 w-80 shadow-2xl`}>
            {/* Header */}
            <div className="mb-3">
              <h3 className="text-xl font-bold text-white mb-1">{card.name}</h3>
              {card.rarity && (
                <span className="text-sm font-bold text-white bg-black bg-opacity-50 px-2 py-1 rounded uppercase">
                  {card.rarity}
                </span>
              )}
            </div>

            {/* Description */}
            {card.description && (
              <p className="text-sm text-gray-200 mb-3 italic">{card.description}</p>
            )}

            {/* Stats */}
            <div className="flex gap-3 mb-3">
              {hp > 0 && (
                <div className="flex-1 bg-black bg-opacity-40 rounded-lg p-3 flex items-center justify-center gap-2 border-2 border-red-500">
                  <span className="text-red-400 text-2xl">❤️</span>
                  <div className="text-center">
                    <div className="text-xs text-gray-300">HP</div>
                    <div className="font-bold text-white text-lg">{hp}</div>
                  </div>
                </div>
              )}
              {shield > 0 && (
                <div className="flex-1 bg-black bg-opacity-40 rounded-lg p-3 flex items-center justify-center gap-2 border-2 border-blue-500">
                  <span className="text-blue-400 text-2xl">🛡️</span>
                  <div className="text-center">
                    <div className="text-xs text-gray-300">Shield</div>
                    <div className="font-bold text-white text-lg">{shield}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Abilities */}
            {card.abilities && (
              <div className="space-y-2">
                <div className="text-sm font-bold text-white mb-2">Abilities:</div>

                {card.abilities.normal && card.abilities.normal.length > 0 && (
                  <div className="bg-red-900 bg-opacity-40 rounded-lg p-3 border border-red-500">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-400 text-xl">💥</span>
                      <span className="text-sm font-bold text-red-200">
                        {card.abilities.normal[0].name}
                      </span>
                      {card.abilities.normal[0].power > 0 && (
                        <span className="ml-auto text-sm font-bold text-red-300">
                          {card.abilities.normal[0].power}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-red-100">{card.abilities.normal[0].description}</p>
                  </div>
                )}

                {card.abilities.special && card.abilities.special.length > 0 && (
                  <div className="bg-yellow-900 bg-opacity-40 rounded-lg p-3 border border-yellow-500">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-400 text-xl">⚡</span>
                      <span className="text-sm font-bold text-yellow-200">
                        {card.abilities.special[0].name}
                      </span>
                      {card.abilities.special[0].power > 0 && (
                        <span className="ml-auto text-sm font-bold text-yellow-300">
                          {card.abilities.special[0].power}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-yellow-100">{card.abilities.special[0].description}</p>
                  </div>
                )}

                {card.abilities.passive && card.abilities.passive.length > 0 && (
                  <div className="bg-purple-900 bg-opacity-40 rounded-lg p-3 border border-purple-500">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-purple-400 text-xl">⏫</span>
                      <span className="text-sm font-bold text-purple-200">
                        {card.abilities.passive[0].name}
                      </span>
                      {card.abilities.passive[0].power > 0 && (
                        <span className="ml-auto text-sm font-bold text-purple-300">
                          {card.abilities.passive[0].power}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-purple-100">{card.abilities.passive[0].description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
