import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ModalProps } from '../../types';
import { ANIMATION_VARIANTS } from '../../animations/config';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          variants={ANIMATION_VARIANTS.modal.overlay}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className={`modal-content ${sizeClasses[size]}`}
            variants={ANIMATION_VARIANTS.modal.content}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
          >
            {title && (
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
                <h2 id="modal-title" className="text-2xl font-bold text-tavern-gold">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
