import React from 'react';
import { motion } from 'framer-motion';
import type { CardProps } from '../../types';
import { CardRarity } from '../../types';
import { ANIMATION_VARIANTS } from '../../animations/config';

export const Card: React.FC<CardProps> = ({
  card,
  onClick,
  onDragStart,
  onDragEnd,
  draggable = false,
  className = '',
}) => {
  const rarityColors: Record<CardRarity, string> = {
    [CardRarity.COMMON]: 'card-rarity-common',
    [CardRarity.UNCOMMON]: 'card-rarity-uncommon',
    [CardRarity.RARE]: 'card-rarity-rare',
    [CardRarity.EPIC]: 'card-rarity-epic',
    [CardRarity.LEGENDARY]: 'card-rarity-legendary',
  };

  const rarityLabels: Record<CardRarity, string> = {
    [CardRarity.COMMON]: 'Common',
    [CardRarity.UNCOMMON]: 'Uncommon',
    [CardRarity.RARE]: 'Rare',
    [CardRarity.EPIC]: 'Epic',
    [CardRarity.LEGENDARY]: 'Legendary',
  };

  const handleClick = () => {
    if (onClick) {
      onClick(card);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(card);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('cardId', card.id);
    }
  };

  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  return (
    <motion.div
      className={`card-container ${rarityColors[card.rarity]} ${className}`}
      variants={ANIMATION_VARIANTS.card}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      role="button"
      tabIndex={0}
      aria-label={`${card.name}, ${rarityLabels[card.rarity]} ${card.type} card`}
      style={{ width: '160px', height: '224px' }}
    >
      <div
        onClick={handleClick}
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="w-full h-full"
      >
      {/* Card Image */}
      <div className="relative h-32 bg-gradient-to-b from-gray-700 to-gray-800 flex items-center justify-center overflow-hidden">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-500 text-4xl">
            {card.type === 'hp' && '❤️'}
            {card.type === 'shield' && '🛡️'}
            {card.type === 'weapon' && '⚔️'}
            {card.type === 'spell' && '✨'}
            {card.type === 'passive' && '🔮'}
          </div>
        )}

        {/* Rarity Badge */}
        <div className="absolute top-1 right-1 px-2 py-0.5 rounded text-xs font-bold bg-black bg-opacity-75">
          {rarityLabels[card.rarity].charAt(0)}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-2 flex flex-col gap-1">
        <h3 className="text-sm font-bold text-white truncate text-shadow">
          {card.name}
        </h3>

        {/* Stats */}
        <div className="flex gap-2 text-xs">
          {card.stats.hp !== undefined && (
            <div className="flex items-center gap-1 text-red-400">
              <span>❤️</span>
              <span className="font-bold">{card.stats.hp}</span>
            </div>
          )}
          {card.stats.attack !== undefined && (
            <div className="flex items-center gap-1 text-orange-400">
              <span>⚔️</span>
              <span className="font-bold">{card.stats.attack}</span>
            </div>
          )}
          {card.stats.defense !== undefined && (
            <div className="flex items-center gap-1 text-blue-400">
              <span>🛡️</span>
              <span className="font-bold">{card.stats.defense}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-yellow-400 ml-auto">
            <span>💎</span>
            <span className="font-bold">{card.stats.value}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-300 line-clamp-2 mt-1">
          {card.description}
        </p>

        {/* Type Badge */}
        <div className="mt-auto">
          <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-tavern-wood rounded">
            {card.type.toUpperCase()}
          </span>
        </div>
      </div>
      </div>
    </motion.div>
  );
};
