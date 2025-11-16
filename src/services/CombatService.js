const GameRepository = require('../repositories/GameRepository');
const GameService = require('./GameService');
const logger = require('../utils/logger');
const { ConflictError } = require('../utils/errors');
const { createEnhancedError } = require('../utils/errorResponse');
const { requirePositiveInteger } = require('../utils/validation');

class CombatService {
  async attackTavernCard(gameId, targetCardId) {
    try {
      // Validate input parameters (defensive programming)
      requirePositiveInteger(gameId, 'gameId');
      requirePositiveInteger(targetCardId, 'targetCardId');

      const game = await GameService.getGame(gameId);

      // Find target card in tavern
      const targetCard = game.tavern.find(c => c.id === targetCardId);
      if (!targetCard) {
        throw createEnhancedError('COMBAT_TARGET_NOT_IN_TAVERN', { targetCardId });
      }

      // Calculate player attack power (sum of all equipped cards' HP)
      const playerAttack = this.calculatePlayerAttack(game);

      if (playerAttack === 0) {
        throw createEnhancedError('COMBAT_NO_ATTACK_POWER');
      }

      // Create combat log
      const combatId = await GameRepository.logCombat(
        gameId,
        null, // player doesn't have a card ID
        targetCardId,
        0, // will be updated
        false
      );

      const combatLog = [];

      // Player attacks
      const { damage, shieldBlocked } = this.calculateDamage(
        playerAttack,
        targetCard.current_shield
      );

      let newTargetHP = targetCard.current_hp - damage;
      let newTargetShield = Math.max(0, targetCard.current_shield - playerAttack);

      combatLog.push({
        actor: 'player',
        action: 'attack',
        target: targetCard.name,
        power: playerAttack,
        shieldBlocked,
        damage,
        result: `Dealt ${damage} damage to ${targetCard.name}`
      });

      // Log combat event
      await GameRepository.logCombatEvent(
        combatId,
        'attack',
        null,
        targetCardId,
        damage,
        `Player attacked ${targetCard.name} for ${damage} damage`
      );

      // Check if target is defeated
      const targetDestroyed = newTargetHP <= 0;

      if (targetDestroyed) {
        combatLog.push({
          actor: 'system',
          action: 'defeated',
          target: targetCard.name,
          result: `${targetCard.name} has been defeated!`
        });

        // Remove from tavern
        await GameRepository.removeTavernCard(gameId, targetCardId);

        // Add to player's hand
        await GameRepository.addCardToHand(gameId, targetCardId);

        // Replenish tavern
        await GameService.replenishTavern(gameId);

      } else {
        // Update target stats
        await GameRepository.updateTavernCardStats(
          gameId,
          targetCardId,
          newTargetHP,
          newTargetShield
        );

        // Target retaliates if alive
        const retaliation = await this.performRetaliation(
          game,
          targetCard,
          combatLog
        );

        // Update player HP
        if (retaliation.totalDamage > 0) {
          await GameService.updatePlayerHP(
            gameId,
            game.player_current_hp - retaliation.totalDamage
          );
        }

        // Regenerate target shield
        await GameRepository.updateTavernCardStats(
          gameId,
          targetCardId,
          newTargetHP,
          targetCard.shield // Full shield regenerated
        );
      }

      // Update combat log
      await GameRepository.logCombat(
        gameId,
        null,
        targetCardId,
        damage,
        targetDestroyed
      );

      // Advance turn
      await GameService.advanceTurn(gameId);

      const updatedGame = await GameService.getGame(gameId);

      logger.info(`Combat completed for game ${gameId}`);

      return {
        game: updatedGame,
        combatLog,
        targetDestroyed
      };

    } catch (error) {
      logger.error('Error in combat:', error);
      throw error;
    }
  }

  calculatePlayerAttack(game) {
    // Sum HP from all equipped cards (excluding special slot for simplicity in MVP)
    let attack = 0;

    // HP slot cards
    if (game.equipped.hp) {
      attack += game.equipped.hp.reduce((sum, card) => sum + card.hp, 0);
    }

    return attack;
  }

  calculateDamage(attackPower, targetShield) {
    if (targetShield >= attackPower) {
      return {
        damage: 0,
        shieldBlocked: attackPower
      };
    }

    const shieldBlocked = targetShield;
    const damage = attackPower - targetShield;

    return { damage, shieldBlocked };
  }

  /**
   * Perform retaliation from a card that was attacked
   * Applies damage to player, heal/shield to the card itself
   * @param {Object} game - Current game state
   * @param {Object} attackerCard - The card performing retaliation
   * @param {Array} combatLog - Combat log to append events
   * @returns {Object} - { totalDamage, totalHeal, totalShield }
   */
  async performRetaliation(game, attackerCard, combatLog) {
    let totalDamage = 0;
    let totalHeal = 0;
    let totalShield = 0;

    // Get all abilities from the attacking card
    const abilities = attackerCard.abilities || {};

    // Process all ability types
    const abilityTypes = ['special', 'normal', 'passive'];

    for (const abilityType of abilityTypes) {
      if (abilities[abilityType] && abilities[abilityType].length > 0) {
        for (const ability of abilities[abilityType]) {
          // Apply ability and get effects
          const effects = this.applyAbility(
            ability,
            game,
            combatLog,
            attackerCard.name,
            attackerCard
          );

          totalDamage += effects.damage;
          totalHeal += effects.heal;
          totalShield += effects.shield;
        }
      }
    }

    // Apply heal to the card (increase HP, capped at max HP from card catalog)
    if (totalHeal > 0) {
      const newHP = Math.min(
        attackerCard.current_hp + totalHeal,
        attackerCard.hp // max HP from card catalog
      );

      await GameRepository.updateTavernCardStats(
        game.id,
        attackerCard.id,
        newHP,
        attackerCard.current_shield
      );

      logger.info(`Card ${attackerCard.name} healed for ${totalHeal} HP (${attackerCard.current_hp} → ${newHP})`);
    }

    // Apply shield to the card (increase current shield)
    if (totalShield > 0) {
      const newShield = attackerCard.current_shield + totalShield;

      await GameRepository.updateTavernCardStats(
        game.id,
        attackerCard.id,
        attackerCard.current_hp,
        newShield
      );

      logger.info(`Card ${attackerCard.name} gained ${totalShield} shield (${attackerCard.current_shield} → ${newShield})`);
    }

    return { totalDamage, totalHeal, totalShield };
  }

  /**
   * Apply ability effects to the game state
   * @param {Object} ability - The ability to apply
   * @param {Object} game - Current game state
   * @param {Array} combatLog - Combat log to append events
   * @param {string} sourceName - Name of the card using the ability
   * @param {Object} sourceCard - The card object using the ability (for heal/shield)
   * @returns {Object} - { damage, heal, shield } values applied
   */
  applyAbility(ability, game, combatLog, sourceName, sourceCard = null) {
    let damage = 0;
    let heal = 0;
    let shield = 0;

    // Calculate player's shield
    const playerShield = this.calculatePlayerShield(game);

    switch (ability.type) {
      case 'damage':
        const { damage: actualDamage, shieldBlocked } = this.calculateDamage(
          ability.power,
          playerShield
        );

        damage = actualDamage;

        combatLog.push({
          actor: 'enemy',
          action: 'ability',
          source: sourceName,
          ability: ability.name,
          power: ability.power,
          shieldBlocked,
          damage: actualDamage,
          result: `${sourceName} used ${ability.name} - dealt ${actualDamage} damage`
        });
        break;

      case 'heal':
        // Heal the source card (card heals itself)
        heal = ability.power;

        combatLog.push({
          actor: 'enemy',
          action: 'ability',
          source: sourceName,
          ability: ability.name,
          heal: heal,
          result: `${sourceName} used ${ability.name} - healed ${heal} HP`
        });
        break;

      case 'shield':
        // Add shield to source card
        shield = ability.power;

        combatLog.push({
          actor: 'enemy',
          action: 'ability',
          source: sourceName,
          ability: ability.name,
          shield: shield,
          result: `${sourceName} used ${ability.name} - gained ${shield} shield`
        });
        break;

      default:
        combatLog.push({
          actor: 'enemy',
          action: 'ability',
          source: sourceName,
          ability: ability.name,
          result: `${sourceName} used ${ability.name}`
        });
    }

    return { damage, heal, shield };
  }

  calculatePlayerShield(game) {
    let shield = 0;

    // Shield slot cards
    if (game.equipped.shield) {
      shield += game.equipped.shield.reduce((sum, card) => sum + card.shield, 0);
    }

    return shield;
  }
}

module.exports = new CombatService();
