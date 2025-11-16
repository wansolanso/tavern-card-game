/**
 * Seed: Card abilities mapping
 * Purpose: Map abilities to cards (each card can have 1-3 abilities: special, passive, normal)
 */

exports.seed = async function (knex) {
  // Delete existing entries
  await knex('card_abilities').del();

  // Insert card-ability mappings
  await knex('card_abilities').insert([
    // ===== COMMON HP CARDS =====
    { card_id: 'card_hp_001', ability_id: 'ability_strike', ability_type: 'normal' },
    { card_id: 'card_hp_002', ability_id: 'ability_shield_wall', ability_type: 'passive' },
    { card_id: 'card_hp_002', ability_id: 'ability_strike', ability_type: 'normal' },
    { card_id: 'card_hp_003', ability_id: 'ability_minor_heal', ability_type: 'special' },
    { card_id: 'card_hp_004', ability_id: 'ability_strike', ability_type: 'normal' },
    { card_id: 'card_hp_005', ability_id: 'ability_shield_wall', ability_type: 'passive' },
    { card_id: 'card_hp_005', ability_id: 'ability_power_attack', ability_type: 'normal' },

    // ===== COMMON SHIELD CARDS =====
    {
      card_id: 'card_shield_001',
      ability_id: 'ability_shield_bash',
      ability_type: 'normal',
    },
    {
      card_id: 'card_shield_001',
      ability_id: 'ability_fortify',
      ability_type: 'passive',
    },
    {
      card_id: 'card_shield_002',
      ability_id: 'ability_barrier',
      ability_type: 'special',
    },
    {
      card_id: 'card_shield_002',
      ability_id: 'ability_shield_bash',
      ability_type: 'normal',
    },
    {
      card_id: 'card_shield_003',
      ability_id: 'ability_reflect',
      ability_type: 'passive',
    },
    {
      card_id: 'card_shield_003',
      ability_id: 'ability_shield_bash',
      ability_type: 'normal',
    },

    // ===== COMMON NORMAL ABILITY CARDS =====
    {
      card_id: 'card_normal_001',
      ability_id: 'ability_power_attack',
      ability_type: 'normal',
    },
    {
      card_id: 'card_normal_001',
      ability_id: 'ability_rage',
      ability_type: 'special',
    },
    { card_id: 'card_normal_002', ability_id: 'ability_piercing_strike', ability_type: 'normal' },
    { card_id: 'card_normal_002', ability_id: 'ability_focus', ability_type: 'passive' },
    { card_id: 'card_normal_003', ability_id: 'ability_bleed_slash', ability_type: 'normal' },

    // ===== UNCOMMON HP CARDS =====
    {
      card_id: 'card_hp_006',
      ability_id: 'ability_power_attack',
      ability_type: 'normal',
    },
    {
      card_id: 'card_hp_006',
      ability_id: 'ability_fortify',
      ability_type: 'passive',
    },
    {
      card_id: 'card_hp_007',
      ability_id: 'ability_critical_hit',
      ability_type: 'special',
    },
    {
      card_id: 'card_hp_007',
      ability_id: 'ability_shield_wall',
      ability_type: 'passive',
    },
    {
      card_id: 'card_hp_007',
      ability_id: 'ability_power_attack',
      ability_type: 'normal',
    },
    {
      card_id: 'card_hp_008',
      ability_id: 'ability_berserk',
      ability_type: 'special',
    },
    {
      card_id: 'card_hp_008',
      ability_id: 'ability_rage',
      ability_type: 'passive',
    },
    {
      card_id: 'card_hp_008',
      ability_id: 'ability_critical_hit',
      ability_type: 'normal',
    },

    // ===== UNCOMMON SHIELD CARDS =====
    {
      card_id: 'card_shield_004',
      ability_id: 'ability_barrier',
      ability_type: 'special',
    },
    {
      card_id: 'card_shield_004',
      ability_id: 'ability_fortify',
      ability_type: 'passive',
    },
    {
      card_id: 'card_shield_004',
      ability_id: 'ability_shield_bash',
      ability_type: 'normal',
    },
    {
      card_id: 'card_shield_005',
      ability_id: 'ability_reflect',
      ability_type: 'special',
    },
    {
      card_id: 'card_shield_005',
      ability_id: 'ability_barrier',
      ability_type: 'passive',
    },
    {
      card_id: 'card_shield_005',
      ability_id: 'ability_shield_bash',
      ability_type: 'normal',
    },

    // ===== UNCOMMON SPECIAL/PASSIVE/NORMAL CARDS =====
    {
      card_id: 'card_special_001',
      ability_id: 'ability_flame_burst',
      ability_type: 'special',
    },
    { card_id: 'card_special_001', ability_id: 'ability_rage', ability_type: 'passive' },
    { card_id: 'card_special_001', ability_id: 'ability_power_attack', ability_type: 'normal' },

    {
      card_id: 'card_special_002',
      ability_id: 'ability_frost_strike',
      ability_type: 'special',
    },
    { card_id: 'card_special_002', ability_id: 'ability_weaken', ability_type: 'passive' },
    {
      card_id: 'card_special_002',
      ability_id: 'ability_piercing_strike',
      ability_type: 'normal',
    },

    {
      card_id: 'card_passive_001',
      ability_id: 'ability_major_heal',
      ability_type: 'special',
    },
    { card_id: 'card_passive_001', ability_id: 'ability_regeneration', ability_type: 'passive' },
    { card_id: 'card_passive_001', ability_id: 'ability_strike', ability_type: 'normal' },

    {
      card_id: 'card_passive_002',
      ability_id: 'ability_haste',
      ability_type: 'special',
    },
    { card_id: 'card_passive_002', ability_id: 'ability_focus', ability_type: 'passive' },
    { card_id: 'card_passive_002', ability_id: 'ability_power_attack', ability_type: 'normal' },

    // ===== RARE CARDS =====
    {
      card_id: 'card_hp_009',
      ability_id: 'ability_critical_hit',
      ability_type: 'special',
    },
    { card_id: 'card_hp_009', ability_id: 'ability_rage', ability_type: 'passive' },
    { card_id: 'card_hp_009', ability_id: 'ability_execute', ability_type: 'normal' },

    {
      card_id: 'card_hp_010',
      ability_id: 'ability_major_heal',
      ability_type: 'special',
    },
    { card_id: 'card_hp_010', ability_id: 'ability_fortify', ability_type: 'passive' },
    { card_id: 'card_hp_010', ability_id: 'ability_power_attack', ability_type: 'normal' },

    {
      card_id: 'card_shield_006',
      ability_id: 'ability_barrier',
      ability_type: 'special',
    },
    { card_id: 'card_shield_006', ability_id: 'ability_reflect', ability_type: 'passive' },
    { card_id: 'card_shield_006', ability_id: 'ability_shield_bash', ability_type: 'normal' },

    {
      card_id: 'card_special_003',
      ability_id: 'ability_flame_burst',
      ability_type: 'special',
    },
    { card_id: 'card_special_003', ability_id: 'ability_focus', ability_type: 'passive' },
    { card_id: 'card_special_003', ability_id: 'ability_frost_strike', ability_type: 'normal' },

    {
      card_id: 'card_special_004',
      ability_id: 'ability_critical_hit',
      ability_type: 'special',
    },
    { card_id: 'card_special_004', ability_id: 'ability_stun', ability_type: 'passive' },
    { card_id: 'card_special_004', ability_id: 'ability_poison_blade', ability_type: 'normal' },

    {
      card_id: 'card_passive_003',
      ability_id: 'ability_second_wind',
      ability_type: 'special',
    },
    { card_id: 'card_passive_003', ability_id: 'ability_regeneration', ability_type: 'passive' },
    { card_id: 'card_passive_003', ability_id: 'ability_cleanse', ability_type: 'normal' },

    {
      card_id: 'card_normal_004',
      ability_id: 'ability_execute',
      ability_type: 'special',
    },
    { card_id: 'card_normal_004', ability_id: 'ability_rage', ability_type: 'passive' },
    { card_id: 'card_normal_004', ability_id: 'ability_critical_hit', ability_type: 'normal' },

    // ===== EPIC CARDS =====
    {
      card_id: 'card_epic_001',
      ability_id: 'ability_flame_burst',
      ability_type: 'special',
    },
    { card_id: 'card_epic_001', ability_id: 'ability_berserk', ability_type: 'passive' },
    { card_id: 'card_epic_001', ability_id: 'ability_critical_hit', ability_type: 'normal' },

    {
      card_id: 'card_epic_002',
      ability_id: 'ability_divine_intervention',
      ability_type: 'special',
    },
    { card_id: 'card_epic_002', ability_id: 'ability_regeneration', ability_type: 'passive' },
    { card_id: 'card_epic_002', ability_id: 'ability_power_attack', ability_type: 'normal' },

    {
      card_id: 'card_epic_003',
      ability_id: 'ability_sacrifice',
      ability_type: 'special',
    },
    { card_id: 'card_epic_003', ability_id: 'ability_curse', ability_type: 'passive' },
    { card_id: 'card_epic_003', ability_id: 'ability_execute', ability_type: 'normal' },

    // ===== LEGENDARY CARDS =====
    {
      card_id: 'card_legendary_001',
      ability_id: 'ability_divine_intervention',
      ability_type: 'special',
    },
    { card_id: 'card_legendary_001', ability_id: 'ability_rage', ability_type: 'passive' },
    { card_id: 'card_legendary_001', ability_id: 'ability_execute', ability_type: 'normal' },

    {
      card_id: 'card_legendary_002',
      ability_id: 'ability_major_heal',
      ability_type: 'special',
    },
    { card_id: 'card_legendary_002', ability_id: 'ability_barrier', ability_type: 'passive' },
    { card_id: 'card_legendary_002', ability_id: 'ability_critical_hit', ability_type: 'normal' },

    // ===== BOSS CARDS =====
    {
      card_id: 'card_boss_001',
      ability_id: 'ability_boss_rampage',
      ability_type: 'special',
    },
    { card_id: 'card_boss_001', ability_id: 'ability_boss_enrage', ability_type: 'passive' },
    { card_id: 'card_boss_001', ability_id: 'ability_critical_hit', ability_type: 'normal' },

    {
      card_id: 'card_boss_002',
      ability_id: 'ability_boss_summon',
      ability_type: 'special',
    },
    { card_id: 'card_boss_002', ability_id: 'ability_curse', ability_type: 'passive' },
    { card_id: 'card_boss_002', ability_id: 'ability_execute', ability_type: 'normal' },

    {
      card_id: 'card_boss_003',
      ability_id: 'ability_boss_rampage',
      ability_type: 'special',
    },
    { card_id: 'card_boss_003', ability_id: 'ability_boss_heal', ability_type: 'passive' },
    { card_id: 'card_boss_003', ability_id: 'ability_flame_burst', ability_type: 'normal' },

    // ===== ADDITIONAL COMMON CARDS =====
    { card_id: 'card_hp_011', ability_id: 'ability_strike', ability_type: 'normal' },
    { card_id: 'card_hp_012', ability_id: 'ability_power_attack', ability_type: 'normal' },
    { card_id: 'card_hp_012', ability_id: 'ability_rage', ability_type: 'passive' },
    { card_id: 'card_normal_005', ability_id: 'ability_bleed_slash', ability_type: 'normal' },
    { card_id: 'card_normal_006', ability_id: 'ability_piercing_strike', ability_type: 'normal' },
    { card_id: 'card_normal_006', ability_id: 'ability_focus', ability_type: 'passive' },
    {
      card_id: 'card_shield_007',
      ability_id: 'ability_shield_bash',
      ability_type: 'normal',
    },
    { card_id: 'card_shield_007', ability_id: 'ability_fortify', ability_type: 'passive' },
  ]);
};
