const GameRepository = require('../repositories/GameRepository');
const GameService = require('./GameService');
const logger = require('../utils/logger');
const { ConflictError } = require('../utils/errors');

class CombatService {
  async attackTavernCard(gameId, targetCardId) {
    try {
      const game = await GameService.getGame(gameId);

      // Find target card in tavern
      const targetCard = game.tavern.find(c => c.id === targetCardId);
      if (!targetCard) {
        throw new ConflictError('Target card not found in tavern');
      }

      // Calculate player attack power (sum of all equipped cards' HP)
      const playerAttack = this.calculatePlayerAttack(game);

      if (playerAttack === 0) {
        throw new ConflictError('No attack power - equip cards first');
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

  async performRetaliation(game, attackerCard, combatLog) {
    let totalDamage = 0;

    // Get all abilities from the attacking card
    const abilities = attackerCard.abilities || {};

    // Special abilities
    if (abilities.special && abilities.special.length > 0) {
      for (const ability of abilities.special) {
        const damage = this.applyAbility(ability, game, combatLog, attackerCard.name);
        totalDamage += damage;
      }
    }

    // Normal abilities
    if (abilities.normal && abilities.normal.length > 0) {
      for (const ability of abilities.normal) {
        const damage = this.applyAbility(ability, game, combatLog, attackerCard.name);
        totalDamage += damage;
      }
    }

    // Passive abilities (for MVP, simplified)
    if (abilities.passive && abilities.passive.length > 0) {
      for (const ability of abilities.passive) {
        const damage = this.applyAbility(ability, game, combatLog, attackerCard.name);
        totalDamage += damage;
      }
    }

    return { totalDamage };
  }

  applyAbility(ability, game, combatLog, sourceName) {
    let damage = 0;

    // Calculate player's shield
    const playerShield = this.calculatePlayerShield(game);

    switch (ability.effect_type) {
      case 'damage':
        const { damage: actualDamage, shieldBlocked } = this.calculateDamage(
          ability.effect_value,
          playerShield
        );

        damage = actualDamage;

        combatLog.push({
          actor: 'enemy',
          action: 'ability',
          source: sourceName,
          ability: ability.name,
          power: ability.effect_value,
          shieldBlocked,
          damage: actualDamage,
          result: `${sourceName} used ${ability.name} - dealt ${actualDamage} damage`
        });
        break;

      case 'heal':
        // Target card heals itself (not implemented in MVP - needs card state tracking)
        combatLog.push({
          actor: 'enemy',
          action: 'ability',
          source: sourceName,
          ability: ability.name,
          result: `${sourceName} used ${ability.name} - healed ${ability.effect_value} HP`
        });
        break;

      case 'shield':
        combatLog.push({
          actor: 'enemy',
          action: 'ability',
          source: sourceName,
          ability: ability.name,
          result: `${sourceName} used ${ability.name} - gained ${ability.effect_value} shield`
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

    return damage;
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
