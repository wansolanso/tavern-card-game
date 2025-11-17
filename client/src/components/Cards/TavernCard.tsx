import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ANIMATION_VARIANTS } from '../../animations/config';
import { CardPreview } from './CardPreview';

interface Ability {
  id: string;
  name: string;
  description: string;
  type: string;
  power: number;
}

interface TavernCardData {
  id: string | number;
  name: string;
  current_hp: number;
  current_shield: number;
  rarity?: string;
  image_url?: string;
  abilities?: {
    special?: Ability[];
    passive?: Ability[];
    normal?: Ability[];
  };
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
  const [showPreview, setShowPreview] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick(card);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    setShowPreview(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setShowPreview(false);
  };

  const rarityColors: Record<string, string> = {
    common: 'border-gray-500',
    uncommon: 'border-green-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-orange-500',
  };

  const borderColor = card.rarity ? rarityColors[card.rarity] : 'border-gray-600';
  const selectedClass = isSelected ? 'border-yellow-400 ring-2 ring-yellow-400' : borderColor;

  return (
    <>
      <motion.div
        className={`bg-gray-800 rounded border-2 ${selectedClass} ${isDisabled ? 'opacity-50' : 'cursor-pointer hover:shadow-lg'} transition-all p-2 flex flex-col h-full`}
        variants={ANIMATION_VARIANTS.card}
        initial="initial"
        animate={isSelected ? "hover" : "animate"}
        whileHover={!isDisabled ? "hover" : undefined}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
      {/* Header - name and rarity */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-white text-xs truncate flex-1">{card.name}</h3>
        {card.rarity && (
          <span className="text-[9px] font-bold text-white bg-black bg-opacity-50 px-1 py-0.5 rounded uppercase ml-1">
            {card.rarity.charAt(0)}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-1.5 mb-2">
        <div className="flex-1 bg-black bg-opacity-30 rounded p-1 flex items-center justify-center gap-1 border border-red-500 border-opacity-30">
          <span className="text-red-400 text-sm">❤️</span>
          <span className="font-bold text-white text-xs">{card.current_hp}</span>
        </div>
        <div className="flex-1 bg-black bg-opacity-30 rounded p-1 flex items-center justify-center gap-1 border border-blue-500 border-opacity-30">
          <span className="text-blue-400 text-sm">🛡️</span>
          <span className="font-bold text-white text-xs">{card.current_shield}</span>
        </div>
      </div>

      {/* Abilities - compact */}
      {card.abilities && (
        <div className="space-y-1 flex-1">
          {card.abilities.normal && card.abilities.normal.length > 0 && (
            <div className="bg-red-900 bg-opacity-30 rounded px-1.5 py-0.5 flex items-center justify-between">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className="text-red-400 text-xs">💥</span>
                <span className="text-[10px] font-semibold text-red-200 truncate">{card.abilities.normal[0].name}</span>
              </div>
              {card.abilities.normal[0].power > 0 && (
                <span className="text-[10px] font-bold text-red-300 ml-1">{card.abilities.normal[0].power}</span>
              )}
            </div>
          )}

          {card.abilities.special && card.abilities.special.length > 0 && (
            <div className="bg-yellow-900 bg-opacity-30 rounded px-1.5 py-0.5 flex items-center justify-between">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className="text-yellow-400 text-xs">⚡</span>
                <span className="text-[10px] font-semibold text-yellow-200 truncate">{card.abilities.special[0].name}</span>
              </div>
              {card.abilities.special[0].power > 0 && (
                <span className="text-[10px] font-bold text-yellow-300 ml-1">{card.abilities.special[0].power}</span>
              )}
            </div>
          )}

          {card.abilities.passive && card.abilities.passive.length > 0 && (
            <div className="bg-purple-900 bg-opacity-30 rounded px-1.5 py-0.5 flex items-center justify-between">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className="text-purple-400 text-xs">⏫</span>
                <span className="text-[10px] font-semibold text-purple-200 truncate">{card.abilities.passive[0].name}</span>
              </div>
              {card.abilities.passive[0].power > 0 && (
                <span className="text-[10px] font-bold text-purple-300 ml-1">{card.abilities.passive[0].power}</span>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
      <CardPreview card={card} position={mousePos} isVisible={showPreview} />
    </>
  );
};
