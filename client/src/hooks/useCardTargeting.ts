import { useCallback } from 'react';
import { useCombat, useCombatActions, useUIActions } from '../store';

export type TargetType = 'tavern' | 'equipped' | 'boss' | 'none';

export interface TargetingOptions {
  allowedTypes?: TargetType[];
  onTargetSelected?: (targetId: string, targetType: TargetType) => void;
  validateTarget?: (targetId: string, targetType: TargetType) => boolean;
}

export const useCardTargeting = (options: TargetingOptions = {}) => {
  const {
    allowedTypes = ['tavern', 'equipped', 'boss'],
    onTargetSelected,
    validateTarget,
  } = options;

  const combat = useCombat();
  const { selectTarget } = useCombatActions();
  const { addNotification } = useUIActions();

  /**
   * Seleciona um alvo para combate
   */
  const handleSelectTarget = useCallback(
    (targetId: string, targetType: TargetType) => {
      // Verifica se o tipo de alvo é permitido
      if (!allowedTypes.includes(targetType)) {
        addNotification({
          type: 'error',
          message: `Cannot target ${targetType} cards`,
          duration: 2000,
        });
        return false;
      }

      // Validação customizada
      if (validateTarget && !validateTarget(targetId, targetType)) {
        addNotification({
          type: 'error',
          message: 'Invalid target',
          duration: 2000,
        });
        return false;
      }

      // Seleciona o alvo
      selectTarget(targetId);

      // Callback customizado
      if (onTargetSelected) {
        onTargetSelected(targetId, targetType);
      }

      return true;
    },
    [allowedTypes, validateTarget, selectTarget, onTargetSelected, addNotification]
  );

  /**
   * Limpa o alvo selecionado
   */
  const handleClearTarget = useCallback(() => {
    selectTarget(null);
  }, [selectTarget]);

  /**
   * Verifica se uma carta é o alvo atualmente selecionado
   */
  const isTargeted = useCallback(
    (cardId: string) => {
      return combat.selectedTarget === cardId;
    },
    [combat.selectedTarget]
  );

  /**
   * Alterna a seleção de um alvo (seleciona se não estava selecionado, limpa se já estava)
   */
  const handleToggleTarget = useCallback(
    (targetId: string, targetType: TargetType) => {
      if (isTargeted(targetId)) {
        handleClearTarget();
        return false;
      } else {
        return handleSelectTarget(targetId, targetType);
      }
    },
    [isTargeted, handleClearTarget, handleSelectTarget]
  );

  /**
   * Executa uma ação com o alvo selecionado
   */
  const executeWithTarget = useCallback(
    (action: (targetId: string) => void | Promise<void>) => {
      if (!combat.selectedTarget) {
        addNotification({
          type: 'error',
          message: 'Please select a target first',
          duration: 2000,
        });
        return;
      }

      action(combat.selectedTarget);
    },
    [combat.selectedTarget, addNotification]
  );

  return {
    selectedTarget: combat.selectedTarget,
    selectTarget: handleSelectTarget,
    clearTarget: handleClearTarget,
    toggleTarget: handleToggleTarget,
    isTargeted,
    executeWithTarget,
    isProcessing: combat.isProcessing,
  };
};
