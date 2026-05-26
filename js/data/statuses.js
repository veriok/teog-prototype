// js/data/statuses.js
import { DamageType } from '../enums.js';

export const statuses = {
  bleeding: {
    id: 'bleeding', label: 'Bleed', icon: '🩸',
    cssClass: 'status-bleeding',
    stackMode: 'stack', maxStacks: 5,
    tickInterval: 1.0,
    tickEffect: (actor, stacks) => ({ type: 'damage', amount: 3 * stacks, damageType: 'slashing', source: 'Bleeding' }),
    tooltip: 'Deals 3 slashing damage per stack each second.'
  },
  burning: {
    id: 'burning', label: 'Burn', icon: '🔥',
    cssClass: 'status-burning',
    stackMode: 'stack', maxStacks: 5,
    tickInterval: 1.0,
    tickEffect: (actor, stacks) => ({ type: 'damage', amount: 2 * stacks, damageType: 'fire', source: 'Burning' }),
    tooltip: 'Deals 2 fire damage per stack each second.'
  },
  stun: {
    id: 'stun', label: 'Stun', icon: '⚡',
    cssClass: 'status-stun',
    stackMode: 'unique', maxStacks: 1,
    freezesCooldowns: true,
    tooltip: 'Freezes all cooldowns. Cannot act.'
  },
  slow: {
    id: 'slow', label: 'Slow', icon: '❄️',
    cssClass: 'status-slow',
    stackMode: 'stack', maxStacks: 5,
    speedModPerStack: -0.15,
    tooltip: 'Reduces GlobalSpeed by 0.15 per stack (minimum 0.1).'
  },
  haste: {
    id: 'haste', label: 'Haste', icon: '⚡',
    cssClass: 'status-haste',
    stackMode: 'stack', maxStacks: 5,
    speedModPerStack: 0.15,
    tooltip: 'Increases GlobalSpeed by 0.15 per stack.'
  },
  guard: {
    id: 'guard', label: 'Guard', icon: '🛡️',
    cssClass: 'status-guard',
    stackMode: 'stack', maxStacks: 6,
    absorbPerStack: 5,
    tooltip: 'Absorbs 5 damage per stack before Armor is hit. Consumed on hit.'
  },
  root: {
    id: 'root', label: 'Root', icon: '🌿',
    cssClass: 'status-root',
    stackMode: 'unique', maxStacks: 1,
    blocksMelee: true,
    tooltip: 'Blocks melee abilities. Cooldowns drain normally.'
  },
  armor_shred: {
    id: 'armor_shred', label: 'Shred', icon: '💀',
    cssClass: 'status-armor_shred',
    stackMode: 'stack', maxStacks: 4,
    armorReductionPerStack: 15,
    tooltip: 'Reduces effective Armor by 15 per stack.'
  },
  regen: {
    id: 'regen', label: 'Regen', icon: '💚',
    cssClass: 'status-regen',
    stackMode: 'stack', maxStacks: 5,
    tickInterval: 1.0,
    // target must be set explicitly so _applyEffect can resolve it
    tickEffect: (actor, stacks) => ({ type: 'heal', target: actor, amount: stacks * 4, source: 'Regeneration' }),
    tooltip: 'Restores 4 HP per stack each second. Stripped immediately when combat ends.',
  },

  void_exposed: {
    id: 'void_exposed', label: 'Void Exposed', icon: '🌑',
    cssClass: 'status-void_exposed',
    stackMode: 'stack', maxStacks: 3,
    resistanceMod: { [DamageType.VOID]: -0.12 },
    tooltip: 'Reduces Void resistance by 12% per stack (max 3 stacks = −36%).',
  },
};
