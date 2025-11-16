import React from 'react';
import { motion } from 'framer-motion';
import { ANIMATION_VARIANTS } from '../../animations/config';

interface TavernCardData {
  id: string | number;
  name: string;
  current_hp: number;
  current_shield: number;
  rarity?: string;
  image_url?: string;
}

interface TavernCardProps {
  card: TavernCardData;
  onClick?: (card: TavernCardData) => void;
  isSelected?: boolean;
  isDisabled?: boolean;
}

export const TavernCard: React.FC<TavernCardProps> = ({
  card,
  onClick,
  isSelected = false,
  isDisabled = false
}) => {
  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick(card);
    }
  };

  const rarityColors: Record<string, string> = {
    common: 'border-gray-500',
    uncommon: 'border-green-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-orange-500',
  };

  const borderColor = card.rarity ? rarityColors[card.rarity] : 'border-gray-600';

  // Selected state - add golden border and glow
  const selectedClass = isSelected
    ? 'border-yellow-400 ring-4 ring-yellow-400 ring-opacity-50 shadow-2xl'
    : borderColor;

  // Disabled state
  const disabledClass = isDisabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer hover:shadow-lg';

  return (
    <motion.div
      className={`bg-gray-700 rounded-lg p-4 border-2 ${selectedClass} ${disabledClass} transition-all duration-200`}
      variants={ANIMATION_VARIANTS.card}
      initial="initial"
      animate={isSelected ? "hover" : "animate"}
      whileHover={!isDisabled ? "hover" : undefined}
      whileTap={!isDisabled ? "tap" : undefined}
      onClick={handleClick}
      style={{ width: '160px', minHeight: '200px' }}
    >
      {/* Card Image/Icon */}
      <div className="relative h-24 bg-gradient-to-b from-gray-600 to-gray-800 rounded flex items-center justify-center mb-3">
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="text-4xl">⚔️</div>
        )}

        {/* Rarity Badge */}
        {card.rarity && (
          <div className="absolute top-1 right-1 px-2 py-0.5 rounded text-xs font-bold bg-black bg-opacity-75 text-white">
            {card.rarity.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Card Name */}
      <h3 className="font-bold text-white text-center mb-2 truncate">
        {card.name}
      </h3>

      {/* Stats */}
      <div className="flex justify-around text-sm">
        <div className="flex flex-col items-center">
          <span className="text-red-400 text-lg">❤️</span>
          <span className="font-bold text-white">{card.current_hp}</span>
          <span className="text-xs text-gray-400">HP</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-blue-400 text-lg">🛡️</span>
          <span className="font-bold text-white">{card.current_shield}</span>
          <span className="text-xs text-gray-400">Shield</span>
        </div>
      </div>
    </motion.div>
  );
};
