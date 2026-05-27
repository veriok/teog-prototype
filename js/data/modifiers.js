// js/data/modifiers.js — Echoes of Germolles: Modifier Template Catalog
//
// Each template defines a modifier that can appear on items, passive skills,
// or status effects. At drop/spawn time a level is passed in and the final
// effectValue is computed as: baseValue + valuePerLevel * level
//
// isRollable: false  →  non-rollable; used only for item base attributes
//                        (referenced by baseAttributeId in item definitions)
// isRollable: true   →  eligible for random slot rolling on dropped items

import { ModifierType, ItemType } from '../enums.js';

export const modifiers = {

  // ── Non-rollable base attributes ─────────────────────────────────────────

  base_slashing_dmg: {
    id: 'base_slashing_dmg', name: 'Slashing Damage',
    modifierType: ModifierType.ATTRIBUTE,
    modClass: 'stat', effectTarget: 'slashingDmg',
    isRollable: false,
    baseValue: 2, valuePerLevel: 0.8,
  },

  base_armor_value: {
    id: 'base_armor_value', name: 'Armor',
    modifierType: ModifierType.ATTRIBUTE,
    modClass: 'stat', effectTarget: 'armor',
    isRollable: false,
    baseValue: 5, valuePerLevel: 1.5,
  },

  base_flat_dmg: {
    id: 'base_flat_dmg', name: 'Flat Damage',
    modifierType: ModifierType.ATTRIBUTE,
    modClass: 'stat', effectTarget: 'flatDmg',
    isRollable: false,
    baseValue: 2, valuePerLevel: 0.6,
  },

  base_hp_bonus: {
    id: 'base_hp_bonus', name: 'HP Bonus',
    modifierType: ModifierType.ATTRIBUTE,
    modClass: 'stat', effectTarget: 'hp',
    isRollable: false,
    baseValue: 10, valuePerLevel: 2,
  },

  // ── Rollable sword mods ───────────────────────────────────────────────────

  sword_slashing_bonus: {
    id: 'sword_slashing_bonus', name: 'Slashing Bonus',
    modifierType: ModifierType.SWORD,
    modClass: 'stat', effectTarget: 'slashingDmg',
    isRollable: true,
    allowedItemTypes: [ItemType.MAIN_HAND],
    baseValue: 1, valuePerLevel: 0.4,
  },

  sword_crit_chance: {
    id: 'sword_crit_chance', name: 'Critical Strike Chance',
    modifierType: ModifierType.SWORD,
    modClass: 'stat', effectTarget: 'critChance',
    isRollable: true,
    allowedItemTypes: [ItemType.MAIN_HAND],
    baseValue: 0.5, valuePerLevel: 0.15,
  },

  // ── Rollable shield mods ──────────────────────────────────────────────────

  shield_block_bonus: {
    id: 'shield_block_bonus', name: 'Block Bonus',
    modifierType: ModifierType.SHIELD,
    modClass: 'stat', effectTarget: 'blockBonus',
    isRollable: true,
    allowedItemTypes: [ItemType.OFFHAND],
    baseValue: 2, valuePerLevel: 0.5,
  },

  shield_armor_regen: {
    id: 'shield_armor_regen', name: 'Armor Regen',
    modifierType: ModifierType.SHIELD,
    modClass: 'stat', effectTarget: 'armorRegen',
    isRollable: true,
    allowedItemTypes: [ItemType.OFFHAND],
    baseValue: 1, valuePerLevel: 0.3,
  },

  // ── Rollable fire mods ────────────────────────────────────────────────────

  fire_dmg_bonus: {
    id: 'fire_dmg_bonus', name: 'Fire Damage Bonus',
    modifierType: ModifierType.FIRE,
    modClass: 'stat', effectTarget: 'fireDmgBonus',
    isRollable: true,
    allowedItemTypes: [ItemType.MAIN_HAND],
    baseValue: 1, valuePerLevel: 0.5,
  },

  fire_burn_dmg: {
    id: 'fire_burn_dmg', name: 'Burn Damage',
    modifierType: ModifierType.FIRE,
    modClass: 'stat', effectTarget: 'burnDmgBonus',
    isRollable: true,
    allowedItemTypes: [ItemType.MAIN_HAND],
    baseValue: 0.5, valuePerLevel: 0.2,
  },

  // ── Rollable void mods ────────────────────────────────────────────────────

  sword_bleed_dmg: {
    id: 'sword_bleed_dmg', name: 'Bleed Damage',
    modifierType: ModifierType.SWORD,
    modClass: 'stat', effectTarget: 'bleedDmgBonus',
    isRollable: true,
    allowedItemTypes: [ItemType.MAIN_HAND],
    baseValue: 0.5, valuePerLevel: 0.2,
  },

  void_dmg_bonus: {
    id: 'void_dmg_bonus', name: 'Void Damage Bonus',
    modifierType: ModifierType.VOID,
    modClass: 'stat', effectTarget: 'voidDmgBonus',
    isRollable: true,
    allowedItemTypes: [ItemType.MAIN_HAND],
    baseValue: 1, valuePerLevel: 0.5,
  },

  void_entropy_stacks: {
    id: 'void_entropy_stacks', name: 'Entropy Stack Bonus',
    modifierType: ModifierType.VOID,
    modClass: 'stat', effectTarget: 'entropyBonus',
    isRollable: true,
    allowedItemTypes: [ItemType.MAIN_HAND],
    baseValue: 1, valuePerLevel: 0.1,
  },

  // ── Rollable generic mods ─────────────────────────────────────────────────

  generic_max_hp: {
    id: 'generic_max_hp', name: 'Max HP',
    modifierType: ModifierType.GENERIC,
    modClass: 'stat', effectTarget: 'hp',
    isRollable: true,
    allowedItemTypes: null, // all item types
    baseValue: 5, valuePerLevel: 1.5,
  },

  generic_flat_dmg: {
    id: 'generic_flat_dmg', name: 'Flat Damage',
    modifierType: ModifierType.GENERIC,
    modClass: 'stat', effectTarget: 'flatDmg',
    isRollable: true,
    allowedItemTypes: null, // all item types
    baseValue: 1, valuePerLevel: 0.5,
  },

  generic_health_regen: {
    id: 'generic_health_regen', name: 'Health Regen',
    modifierType: ModifierType.GENERIC,
    modClass: 'stat', effectTarget: 'healthRegen',
    isRollable: true,
    allowedItemTypes: null, // all item types — rare drop
    baseValue: 1, valuePerLevel: 0.5,
  },

};
