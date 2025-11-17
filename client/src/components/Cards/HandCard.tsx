import React, { useState } from 'react';
import { CardPreview } from './CardPreview';

interface HandCardProps {
  card: any;
}

export const HandCard: React.FC<HandCardProps> = ({ card }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const rarityColors: Record<string, string> = {
    common: 'from-gray-700 to-gray-800 border-gray-500',
    uncommon: 'from-green-700 to-green-900 border-green-500',
    rare: 'from-blue-700 to-blue-900 border-blue-500',
    epic: 'from-purple-700 to-purple-900 border-purple-500',
    legendary: 'from-orange-600 to-red-800 border-orange-500',
  };

  const slotIcons: Record<string, string> = {
    hp: '❤️',
    shield: '🛡️',
    special: '⚡',
    passive: '⏫',
    normal: '💥',
    damage: '💥'
  };

  const colorClass = card.rarity ? rarityColors[card.rarity] : rarityColors.common;
  const slotIcon = card.slot ? slotIcons[card.slot] || '⚔️' : '⚔️';

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

  return (
    <>
      <div
        className={`bg-gradient-to-br ${colorClass} rounded border-2 p-1.5 w-32 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all`}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-black bg-opacity-40 rounded flex items-center justify-center text-sm">
            {slotIcon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-white truncate">{card.name}</p>
            {card.rarity && (
              <span className="text-[8px] font-bold text-white bg-black bg-opacity-50 px-0.5 rounded uppercase">
                {card.rarity.charAt(0)}
              </span>
            )}
          </div>
        </div>
      </div>
      <CardPreview card={card} position={mousePos} isVisible={showPreview} />
    </>
  );
};
