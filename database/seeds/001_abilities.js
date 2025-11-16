/**
 * Seed: Abilities catalog
 * Purpose: Populate all available abilities in the game
 */

exports.seed = async function (knex) {
  // Delete existing entries
  await knex('abilities').del();

  // Insert abilities
  await knex('abilities').insert([
    // ===== DAMAGE ABILITIES =====
    {
      id: 'ability_strike',
      name: 'Strike',
      description: 'Deals basic damage to the enemy',
      type: 'damage',
      power: 10,
      effects: null,
    },
    {
      id: 'ability_power_attack',
      name: 'Power Attack',
      description: 'Deals heavy damage to the enemy',
      type: 'damage',
      power: 20,
      effects: null,
    },
    {
      id: 'ability_shield_bash',
      name: 'Shield Bash',
      description: 'Deals damage equal to half your current shield value',
      type: 'damage',
      power: 15,
      effects: null,
    },
    {
      id: 'ability_piercing_strike',
      name: 'Piercing Strike',
      description: 'Deals damage that ignores 50% of enemy shield',
      type: 'damage',
      power: 15,
      effects: JSON.stringify({
        statusEffects: [{ type: 'armor_pierce', value: 50 }],
      }),
    },
    {
      id: 'ability_flame_burst',
      name: 'Flame Burst',
      description: 'Deals damage and applies burn for 3 turns',
      type: 'damage',
      power: 12,
      effects: JSON.stringify({
        statusEffects: [{ type: 'burn', duration: 3, value: 3 }],
      }),
    },
    {
      id: 'ability_frost_strike',
      name: 'Frost Strike',
      description: 'Deals damage and has a chance to freeze the enemy',
      type: 'damage',
      power: 14,
      effects: JSON.stringify({
        statusEffects: [{ type: 'freeze', duration: 1, value: 100 }],
      }),
    },
    {
      id: 'ability_poison_blade',
      name: 'Poison Blade',
      description: 'Deals damage and applies poison for 5 turns',
      type: 'damage',
      power: 8,
      effects: JSON.stringify({
        statusEffects: [{ type: 'poison', duration: 5, value: 2 }],
      }),
    },
    {
      id: 'ability_bleed_slash',
      name: 'Bleed Slash',
      description: 'Deals damage and applies bleed for 4 turns',
      type: 'damage',
      power: 10,
      effects: JSON.stringify({
        statusEffects: [{ type: 'bleed', duration: 4, value: 3 }],
      }),
    },
    {
      id: 'ability_critical_hit',
      name: 'Critical Hit',
      description: 'Deals massive damage with a chance to critically strike',
      type: 'damage',
      power: 25,
      effects: JSON.stringify({
        statusEffects: [{ type: 'critical_chance', value: 30 }],
      }),
    },
    {
      id: 'ability_execute',
      name: 'Execute',
      description: 'Deals increased damage to enemies below 30% HP',
      type: 'damage',
      power: 18,
      effects: JSON.stringify({
        statusEffects: [{ type: 'execute_threshold', value: 30 }],
      }),
    },

    // ===== HEAL ABILITIES =====
    {
      id: 'ability_minor_heal',
      name: 'Minor Heal',
      description: 'Restores a small amount of HP',
      type: 'heal',
      power: 10,
      effects: null,
    },
    {
      id: 'ability_major_heal',
      name: 'Major Heal',
      description: 'Restores a large amount of HP',
      type: 'heal',
      power: 25,
      effects: null,
    },
    {
      id: 'ability_regeneration',
      name: 'Regeneration',
      description: 'Restores HP over 3 turns',
      type: 'heal',
      power: 5,
      effects: JSON.stringify({
        statusEffects: [{ type: 'regen', duration: 3, value: 5 }],
      }),
    },
    {
      id: 'ability_second_wind',
      name: 'Second Wind',
      description: 'Heals for 50% of missing HP',
      type: 'heal',
      power: 0,
      effects: JSON.stringify({
        statusEffects: [{ type: 'missing_hp_heal', value: 50 }],
      }),
    },

    // ===== SHIELD ABILITIES =====
    {
      id: 'ability_shield_wall',
      name: 'Shield Wall',
      description: 'Grants temporary shield',
      type: 'shield',
      power: 15,
      effects: null,
    },
    {
      id: 'ability_fortify',
      name: 'Fortify',
      description: 'Grants massive shield for 2 turns',
      type: 'shield',
      power: 30,
      effects: JSON.stringify({
        statusEffects: [{ type: 'fortify', duration: 2 }],
      }),
    },
    {
      id: 'ability_barrier',
      name: 'Barrier',
      description: 'Grants shield that absorbs all damage once',
      type: 'shield',
      power: 20,
      effects: JSON.stringify({
        statusEffects: [{ type: 'barrier', duration: 1 }],
      }),
    },
    {
      id: 'ability_reflect',
      name: 'Reflect',
      description: 'Grants shield and reflects 25% of damage taken',
      type: 'shield',
      power: 12,
      effects: JSON.stringify({
        statusEffects: [{ type: 'reflect', duration: 2, value: 25 }],
      }),
    },

    // ===== BUFF ABILITIES =====
    {
      id: 'ability_rage',
      name: 'Rage',
      description: 'Increases attack power by 50% for 2 turns',
      type: 'buff',
      power: 0,
      effects: JSON.stringify({
        statusEffects: [{ type: 'attack_boost', duration: 2, value: 50 }],
      }),
    },
    {
      id: 'ability_focus',
      name: 'Focus',
      description: 'Increases critical strike chance by 40% for 3 turns',
      type: 'buff',
      power: 0,
      effects: JSON.stringify({
        statusEffects: [{ type: 'crit_boost', duration: 3, value: 40 }],
      }),
    },
    {
      id: 'ability_haste',
      name: 'Haste',
      description: 'Reduces ability cooldowns by 1 turn',
      type: 'buff',
      power: 0,
      effects: JSON.stringify({
        statusEffects: [{ type: 'cooldown_reduction', value: 1 }],
      }),
    },
    {
      id: 'ability_berserk',
      name: 'Berserk',
      description: 'Sacrifice 20% HP to gain massive attack boost',
      type: 'buff',
      power: 0,
      effects: JSON.stringify({
        statusEffects: [
          { type: 'self_damage', value: 20 },
          { type: 'attack_boost', duration: 3, value: 100 },
        ],
      }),
    },

    // ===== DEBUFF ABILITIES =====
    {
      id: 'ability_weaken',
      name: 'Weaken',
      description: 'Reduces enemy attack power by 30% for 2 turns',
      type: 'debuff',
      power: 0,
      effects: JSON.stringify({
        statusEffects: [{ type: 'attack_reduction', duration: 2, value: 30 }],
      }),
    },
    {
      id: 'ability_stun',
      name: 'Stun',
      description: 'Stuns the enemy for 1 turn, preventing all actions',
      type: 'debuff',
      power: 0,
      effects: JSON.stringify({
        statusEffects: [{ type: 'stun', duration: 1 }],
      }),
    },
    {
      id: 'ability_blind',
      name: 'Blind',
      description: 'Reduces enemy accuracy by 50% for 2 turns',
      type: 'debuff',
      power: 0,
      effects: JSON.stringify({
        statusEffects: [{ type: 'accuracy_reduction', duration: 2, value: 50 }],
      }),
    },
    {
      id: 'ability_curse',
      name: 'Curse',
      description: 'Reduces enemy healing effectiveness by 75% for 3 turns',
      type: 'debuff',
      power: 0,
      effects: JSON.stringify({
        statusEffects: [{ type: 'heal_reduction', duration: 3, value: 75 }],
      }),
    },

    // ===== SPECIAL ABILITIES =====
    {
      id: 'ability_lifesteal',
      name: 'Lifesteal',
      description: 'Deals damage and heals for 50% of damage dealt',
      type: 'special',
      power: 12,
      effects: JSON.stringify({
        statusEffects: [{ type: 'lifesteal', value: 50 }],
      }),
    },
    {
      id: 'ability_riposte',
      name: 'Riposte',
      description: 'Counter next attack, dealing damage equal to damage taken',
      type: 'special',
      power: 0,
      effects: JSON.stringify({
        statusEffects: [{ type: 'counter', duration: 1, value: 100 }],
      }),
    },
    {
      id: 'ability_cleanse',
      name: 'Cleanse',
      description: 'Removes all negative status effects',
      type: 'special',
      power: 0,
      effects: JSON.stringify({
        statusEffects: [{ type: 'cleanse' }],
      }),
    },
    {
      id: 'ability_sacrifice',
      name: 'Sacrifice',
      description: 'Sacrifice 50% HP to deal massive damage',
      type: 'special',
      power: 40,
      effects: JSON.stringify({
        statusEffects: [{ type: 'self_damage_percent', value: 50 }],
      }),
    },
    {
      id: 'ability_divine_intervention',
      name: 'Divine Intervention',
      description: 'Heal to full HP and cleanse all debuffs (once per game)',
      type: 'special',
      power: 0,
      effects: JSON.stringify({
        statusEffects: [{ type: 'full_heal' }, { type: 'cleanse' }],
      }),
    },

    // ===== BOSS ABILITIES =====
    {
      id: 'ability_boss_rampage',
      name: 'Rampage',
      description: 'Deals massive damage to player, ignores all shield',
      type: 'damage',
      power: 35,
      effects: JSON.stringify({
        statusEffects: [{ type: 'pierce', value: 100 }],
      }),
    },
    {
      id: 'ability_boss_summon',
      name: 'Summon Minions',
      description: 'Summons additional enemies to the tavern',
      type: 'special',
      power: 0,
      effects: JSON.stringify({
        statusEffects: [{ type: 'summon', value: 2 }],
      }),
    },
    {
      id: 'ability_boss_enrage',
      name: 'Enrage',
      description: 'Increases attack power by 100% when below 30% HP',
      type: 'buff',
      power: 0,
      effects: JSON.stringify({
        statusEffects: [{ type: 'enrage_threshold', value: 30, boost: 100 }],
      }),
    },
    {
      id: 'ability_boss_heal',
      name: 'Dark Regeneration',
      description: 'Heals for 30 HP every turn',
      type: 'heal',
      power: 30,
      effects: JSON.stringify({
        statusEffects: [{ type: 'regen', duration: 999, value: 30 }],
      }),
    },
  ]);
};
