// js/data/abilities.js

import { SkillType, AbilityTag, DamageType } from '../enums.js';

/** Picks a random damage type from an ability's damageType array. */
function pickDmgType(types) {
  return types[Math.floor(Math.random() * types.length)];
}

export const abilities = {

  // ── Sword ────────────────────────────────────────────────────
  sword_slash: {
    id: 'sword_slash', name: 'Sword Slash', icon: '⚔️',
    tree: SkillType.SWORD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.SLASHING],
    ranks: [
      { rank: 1, cooldown: 2.5, cost: null, damage: 18, levelRequired:  1, autoLearn: true },
      { rank: 2, cooldown: 2.5, cost: null, damage: 26, levelRequired:  6, autoLearn: true },
      { rank: 3, cooldown: 2.5, cost: null, damage: 35, levelRequired: 11, autoLearn: true },
      { rank: 4, cooldown: 2.5, cost: null, damage: 44, levelRequired: 16, autoLearn: true },
      { rank: 5, cooldown: 2.5, cost: null, damage: 52, levelRequired: 21, autoLearn: true },
      { rank: 6, cooldown: 2.5, cost: null, damage: 61, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  rend: {
    id: 'rend', name: 'Rend', icon: '🗡️',
    tree: SkillType.SWORD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.SLASHING],
    ranks: [
      { rank: 1, cooldown: 5.0, cost: 45, damage: 14, stacks: 1, levelRequired:  3, autoLearn: true },
      { rank: 2, cooldown: 5.0, cost: 45, damage: 20, stacks: 1, levelRequired:  8, autoLearn: true },
      { rank: 3, cooldown: 5.0, cost: 45, damage: 28, stacks: 2, levelRequired: 13, autoLearn: true },
      { rank: 4, cooldown: 5.0, cost: 45, damage: 36, stacks: 2, levelRequired: 18, autoLearn: true },
      { rank: 5, cooldown: 5.0, cost: 45, damage: 44, stacks: 2, levelRequired: 23, autoLearn: false },
      { rank: 6, cooldown: 5.0, cost: 45, damage: 52, stacks: 2, levelRequired: 28, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: targets[0], statusId: 'bleeding', stacks: rank.stacks }
      ];
    }
  },

  shield_bash: {
    id: 'shield_bash', name: 'Shield Bash', icon: '🛡️',
    tree: SkillType.SHIELD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 6.0, cost: null, damage: 10, levelRequired:  3, autoLearn: true },
      { rank: 2, cooldown: 5.5, cost: null, damage: 16, levelRequired:  8, autoLearn: true },
      { rank: 3, cooldown: 5.0, cost: null, damage: 22, levelRequired: 13, autoLearn: true },
      { rank: 4, cooldown: 5.0, cost: null, damage: 28, levelRequired: 18, autoLearn: true },
      { rank: 5, cooldown: 5.0, cost: null, damage: 34, levelRequired: 23, autoLearn: false },
      { rank: 6, cooldown: 5.0, cost: null, damage: 40, levelRequired: 28, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: targets[0], statusId: 'stun', stacks: 1 }
      ];
    }
  },

  fortify: {
    id: 'fortify', name: 'Fortify', icon: '🏰',
    tree: SkillType.SHIELD, tags: [AbilityTag.DEFENSIVE],
    ranks: [
      { rank: 1, cooldown: 10.0, cost: null, guardStacks: 2, healHp:  0, levelRequired:  5, autoLearn: true },
      { rank: 2, cooldown:  9.5, cost: null, guardStacks: 3, healHp:  0, levelRequired: 10, autoLearn: true },
      { rank: 3, cooldown:  9.0, cost: null, guardStacks: 4, healHp: 15, levelRequired: 15, autoLearn: true },
      { rank: 4, cooldown:  9.0, cost: null, guardStacks: 5, healHp: 20, levelRequired: 20, autoLearn: true },
      { rank: 5, cooldown:  9.0, cost: null, guardStacks: 5, healHp: 25, levelRequired: 25, autoLearn: false },
      { rank: 6, cooldown:  9.0, cost: null, guardStacks: 6, healHp: 30, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'self',
    execute(caster, targets, rank) {
      const effects = [
        { type: 'apply_status', target: caster, statusId: 'guard', stacks: rank.guardStacks },
      ];
      if (rank.healHp > 0) effects.push({ type: 'heal', target: caster, amount: rank.healHp });
      return effects;
    }
  },

  // ── Fire ─────────────────────────────────────────────────────
  ember_shot: {
    id: 'ember_shot', name: 'Ember Shot', icon: '🔥',
    tree: SkillType.FIRE, tags: [AbilityTag.RANGED],
    damageType: [DamageType.FIRE],
    ranks: [
      { rank: 1, cooldown: 2.8, cost: null, damage: 20, burnChance: 0,   levelRequired: 1, autoLearn: true },
      { rank: 2, cooldown: 2.8, cost: null, damage: 28, burnChance: 0,   levelRequired: 4, autoLearn: true },
      { rank: 3, cooldown: 2.6, cost: null, damage: 38, burnChance: 0.5, levelRequired: 8, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      const effects = [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
      if (rank.burnChance > 0 && Math.random() < rank.burnChance) {
        effects.push({ type: 'apply_status', target: targets[0], statusId: 'burning', stacks: 1 });
      }
      return effects;
    }
  },

  fireball: {
    id: 'fireball', name: 'Fireball', icon: '💥',
    tree: SkillType.FIRE, tags: [AbilityTag.RANGED],
    damageType: [DamageType.FIRE],
    ranks: [
      { rank: 1, cooldown: 5.5, cost: 40, damage: 35, splashDmg: 15, burnStacks: 0, levelRequired: 1, autoLearn: true },
      { rank: 2, cooldown: 5.2, cost: 40, damage: 48, splashDmg: 22, burnStacks: 0, levelRequired: 4, autoLearn: true },
      { rank: 3, cooldown: 5.0, cost: 40, damage: 65, splashDmg: 30, burnStacks: 1, levelRequired: 8, autoLearn: false },
    ],
    targeting: 'single_enemy_with_splash',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      const effects = [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
      if (targets[1]) effects.push({ type: 'damage', target: targets[1], amount: rank.splashDmg, damageType: dmgType });
      if (rank.burnStacks > 0) {
        targets.forEach(t => effects.push({ type: 'apply_status', target: t, statusId: 'burning', stacks: rank.burnStacks }));
      }
      return effects;
    }
  },

  void_bolt: {
    id: 'void_bolt', name: 'Void Bolt', icon: '🌑',
    tree: SkillType.VOID, tags: [AbilityTag.RANGED],
    damageType: [DamageType.VOID],
    ranks: [
      { rank: 1, cooldown: 3.0, cost: null, damage: 18, levelRequired:  1, autoLearn: true },
      { rank: 2, cooldown: 3.0, cost: null, damage: 25, levelRequired:  6, autoLearn: true },
      { rank: 3, cooldown: 2.8, cost: null, damage: 34, levelRequired: 11, autoLearn: true },
      { rank: 4, cooldown: 2.8, cost: null, damage: 43, levelRequired: 16, autoLearn: true },
      { rank: 5, cooldown: 2.8, cost: null, damage: 52, levelRequired: 21, autoLearn: true },
      { rank: 6, cooldown: 2.8, cost: null, damage: 61, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  entropy_field: {
    id: 'entropy_field', name: 'Entropy Field', icon: '🌀',
    tree: SkillType.VOID, tags: [AbilityTag.RANGED],
    ranks: [
      { rank: 1, cooldown: 10.0, cost: 15, slowStacks: 1,                levelRequired:  3, autoLearn: true },
      { rank: 2, cooldown:  9.5, cost: 15, slowStacks: 2,                levelRequired:  8, autoLearn: true },
      { rank: 3, cooldown:  9.0, cost: 20, slowStacks: 3, threatDrain: 15, levelRequired: 13, autoLearn: true },
      { rank: 4, cooldown:  9.0, cost: 20, slowStacks: 3, threatDrain: 15, levelRequired: 18, autoLearn: true },
      { rank: 5, cooldown:  9.0, cost: 20, slowStacks: 3, threatDrain: 15, levelRequired: 23, autoLearn: false },
      { rank: 6, cooldown:  9.0, cost: 20, slowStacks: 3, threatDrain: 15, levelRequired: 28, autoLearn: false },
    ],
    targeting: 'all_enemies',
    execute(caster, targets, rank) {
      const effects = targets.map(t => ({
        type: 'apply_status', target: t, statusId: 'slow', stacks: rank.slowStacks
      }));
      if (rank.threatDrain) targets.forEach(t => effects.push({ type: 'drain_threat', target: t, amount: rank.threatDrain }));
      return effects;
    }
  },

  // ── Aldric — Flood ────────────────────────────────────────────────────
  wave_strike: {
    id: 'wave_strike', name: 'Wave Strike', icon: '🌊',
    tree: SkillType.FLOOD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 3.0, cost: null, damage: 16, levelRequired:  1, autoLearn: true },
      { rank: 2, cooldown: 2.8, cost: null, damage: 24, levelRequired:  6, autoLearn: true },
      { rank: 3, cooldown: 2.6, cost: null, damage: 32, levelRequired: 11, autoLearn: true },
      { rank: 4, cooldown: 2.6, cost: null, damage: 40, levelRequired: 16, autoLearn: true },
      { rank: 5, cooldown: 2.6, cost: null, damage: 48, levelRequired: 21, autoLearn: true },
      { rank: 6, cooldown: 2.6, cost: null, damage: 56, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  tide_surge: {
    id: 'tide_surge', name: 'Tide Surge', icon: '💧',
    tree: SkillType.FLOOD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 7.0, cost: 45, damage: 10, slowStacks: 1, levelRequired:  3, autoLearn: true },
      { rank: 2, cooldown: 6.5, cost: 45, damage: 15, slowStacks: 1, levelRequired:  8, autoLearn: true },
      { rank: 3, cooldown: 6.0, cost: 45, damage: 20, slowStacks: 2, levelRequired: 13, autoLearn: true },
      { rank: 4, cooldown: 6.0, cost: 45, damage: 25, slowStacks: 2, levelRequired: 18, autoLearn: true },
      { rank: 5, cooldown: 6.0, cost: 45, damage: 30, slowStacks: 2, levelRequired: 23, autoLearn: false },
      { rank: 6, cooldown: 6.0, cost: 45, damage: 35, slowStacks: 2, levelRequired: 28, autoLearn: false },
    ],
    targeting: 'all_enemies',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return targets.flatMap(t => [
        { type: 'damage', target: t, amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: t, statusId: 'slow', stacks: rank.slowStacks },
      ]);
    }
  },

  drowning_grasp: {
    id: 'drowning_grasp', name: 'Drowning Grasp', icon: '🫧',
    tree: SkillType.FLOOD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 9.0, cost: 60, damage: 20, levelRequired: 5,  autoLearn: true },
      { rank: 2, cooldown: 8.5, cost: 60, damage: 28, levelRequired: 8,  autoLearn: true },
      { rank: 3, cooldown: 8.0, cost: 60, damage: 38, levelRequired: 12, autoLearn: true },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: targets[0], statusId: 'root', stacks: 1 },
      ];
    }
  },

  tidal_wave: {
    id: 'tidal_wave', name: 'Tidal Wave', icon: '🌀',
    tree: SkillType.FLOOD, tags: [AbilityTag.SPELL],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 14.0, cost: 75, damage: 22, levelRequired:  7, autoLearn: true },
      { rank: 2, cooldown: 13.0, cost: 75, damage: 32, levelRequired: 12, autoLearn: true },
      { rank: 3, cooldown: 12.0, cost: 75, damage: 44, levelRequired: 17, autoLearn: true },
      { rank: 4, cooldown: 12.0, cost: 75, damage: 55, levelRequired: 22, autoLearn: false },
      { rank: 5, cooldown: 12.0, cost: 75, damage: 66, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'all_enemies',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: dmgType }));
    }
  },

  // ── Ysolde — Staff ────────────────────────────────────────────────────
  staff_strike: {
    id: 'staff_strike', name: 'Staff Strike', icon: '🪄',
    tree: SkillType.STAFF, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 2.2, cost: null, damage: 14, levelRequired:  1, autoLearn: true },
      { rank: 2, cooldown: 2.0, cost: null, damage: 20, levelRequired:  6, autoLearn: true },
      { rank: 3, cooldown: 1.8, cost: null, damage: 28, levelRequired: 11, autoLearn: true },
      { rank: 4, cooldown: 1.8, cost: null, damage: 35, levelRequired: 16, autoLearn: true },
      { rank: 5, cooldown: 1.8, cost: null, damage: 42, levelRequired: 21, autoLearn: true },
      { rank: 6, cooldown: 1.8, cost: null, damage: 49, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  crushing_blow: {
    id: 'crushing_blow', name: 'Crushing Blow', icon: '💥',
    tree: SkillType.STAFF, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 7.0, cost: 25, damage: 26, levelRequired:  5, autoLearn: true },
      { rank: 2, cooldown: 6.5, cost: 25, damage: 36, levelRequired: 10, autoLearn: true },
      { rank: 3, cooldown: 6.0, cost: 25, damage: 48, levelRequired: 15, autoLearn: true },
      { rank: 4, cooldown: 6.0, cost: 25, damage: 59, levelRequired: 20, autoLearn: true },
      { rank: 5, cooldown: 6.0, cost: 25, damage: 70, levelRequired: 25, autoLearn: false },
      { rank: 6, cooldown: 6.0, cost: 25, damage: 81, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: targets[0], statusId: 'stun', stacks: 1 },
      ];
    }
  },

  stalwart_guard: {
    id: 'stalwart_guard', name: 'Stalwart Guard', icon: '🛡️',
    tree: SkillType.STAFF, tags: [AbilityTag.DEFENSIVE],
    ranks: [
      { rank: 1, cooldown: 11.0, cost: 20, guardStacks: 2, levelRequired:  7, autoLearn: true },
      { rank: 2, cooldown: 10.5, cost: 20, guardStacks: 3, levelRequired: 12, autoLearn: true },
      { rank: 3, cooldown: 10.0, cost: 20, guardStacks: 4, levelRequired: 17, autoLearn: true },
      { rank: 4, cooldown: 10.0, cost: 20, guardStacks: 4, levelRequired: 22, autoLearn: false },
      { rank: 5, cooldown: 10.0, cost: 20, guardStacks: 5, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'self',
    execute(caster, targets, rank) {
      return [
        { type: 'apply_status', target: caster, statusId: 'guard', stacks: rank.guardStacks },
      ];
    }
  },

  sweeping_arc: {
    id: 'sweeping_arc', name: 'Sweeping Arc', icon: '🌙',
    tree: SkillType.STAFF, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 6.0, cost: 30, damage: 12, levelRequired:  3, autoLearn: true },
      { rank: 2, cooldown: 5.5, cost: 30, damage: 18, levelRequired:  8, autoLearn: true },
      { rank: 3, cooldown: 5.0, cost: 30, damage: 26, levelRequired: 13, autoLearn: true },
      { rank: 4, cooldown: 5.0, cost: 30, damage: 33, levelRequired: 18, autoLearn: true },
      { rank: 5, cooldown: 5.0, cost: 30, damage: 40, levelRequired: 23, autoLearn: false },
      { rank: 6, cooldown: 5.0, cost: 30, damage: 47, levelRequired: 28, autoLearn: false },
    ],
    targeting: 'cleave',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: dmgType }));
    }
  },

  // ── Shield (additional) ───────────────────────────────────────────────
  shield_strike: {
    id: 'shield_strike', name: 'Shield Strike', icon: '🛡️',
    tree: SkillType.SHIELD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 2.5, cost: null, damage: 14, levelRequired:  1, autoLearn: true },
      { rank: 2, cooldown: 2.5, cost: null, damage: 20, levelRequired:  6, autoLearn: true },
      { rank: 3, cooldown: 2.5, cost: null, damage: 28, levelRequired: 11, autoLearn: true },
      { rank: 4, cooldown: 2.5, cost: null, damage: 35, levelRequired: 16, autoLearn: true },
      { rank: 5, cooldown: 2.5, cost: null, damage: 42, levelRequired: 21, autoLearn: true },
      { rank: 6, cooldown: 2.5, cost: null, damage: 49, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  burning_bulwark: {
    id: 'burning_bulwark', name: 'Burning Bulwark', icon: '🔥',
    tree: SkillType.SHIELD, tags: [AbilityTag.DEFENSIVE],
    ranks: [
      { rank: 1, cooldown: 10.0, cost: null, retaliationStacks: 2, levelRequired:  7, autoLearn: true },
      { rank: 2, cooldown:  9.5, cost: null, retaliationStacks: 3, levelRequired: 12, autoLearn: true },
      { rank: 3, cooldown:  9.0, cost: null, retaliationStacks: 3, levelRequired: 17, autoLearn: true },
      { rank: 4, cooldown:  9.0, cost: null, retaliationStacks: 3, levelRequired: 22, autoLearn: false },
      { rank: 5, cooldown:  9.0, cost: null, retaliationStacks: 4, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'self',
    execute(caster, targets, rank) {
      return [{ type: 'apply_status', target: caster, statusId: 'fire_retaliation', stacks: rank.retaliationStacks }];
    }
  },

  shield_wall: {
    id: 'shield_wall', name: 'Shield Wall', icon: '🏰',
    tree: SkillType.SHIELD, tags: [AbilityTag.DEFENSIVE],
    ranks: [
      { rank: 1, cooldown: 10.0, cost: null, guardStacks: 3, levelRequired:  9, autoLearn: true },
      { rank: 2, cooldown:  9.5, cost: null, guardStacks: 4, levelRequired: 14, autoLearn: true },
      { rank: 3, cooldown:  9.0, cost: null, guardStacks: 5, levelRequired: 19, autoLearn: true },
      { rank: 4, cooldown:  9.0, cost: null, guardStacks: 5, levelRequired: 24, autoLearn: false },
      { rank: 5, cooldown:  9.0, cost: null, guardStacks: 6, levelRequired: 29, autoLearn: false },
    ],
    targeting: 'self',
    execute(caster, targets, rank) {
      return [{ type: 'apply_status', target: caster, statusId: 'guard', stacks: rank.guardStacks }];
    }
  },

  iron_fortress: {
    id: 'iron_fortress', name: 'Iron Fortress', icon: '⚙️',
    tree: SkillType.SHIELD, tags: [AbilityTag.DEFENSIVE],
    ranks: [
      { rank: 1, cooldown: 14.0, cost: null, armorAmount: 40, levelRequired: 15, autoLearn: true },
      { rank: 2, cooldown: 13.0, cost: null, armorAmount: 55, levelRequired: 20, autoLearn: true },
      { rank: 3, cooldown: 12.0, cost: null, armorAmount: 70, levelRequired: 25, autoLearn: false },
      { rank: 4, cooldown: 12.0, cost: null, armorAmount: 85, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'self',
    execute(caster, targets, rank) {
      return [{ type: 'restore_armor', target: caster, amount: rank.armorAmount }];
    }
  },

  defenders_call: {
    id: 'defenders_call', name: "Defender's Call", icon: '📣',
    tree: SkillType.SHIELD, tags: [AbilityTag.SUPPORT],
    ranks: [
      { rank: 1, cooldown: 12.0, cost: null, guardStacks: 1, levelRequired: 11, autoLearn: true },
      { rank: 2, cooldown: 11.5, cost: null, guardStacks: 2, levelRequired: 16, autoLearn: true },
      { rank: 3, cooldown: 11.0, cost: null, guardStacks: 2, levelRequired: 21, autoLearn: true },
      { rank: 4, cooldown: 11.0, cost: null, guardStacks: 3, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'all_allies',
    execute(caster, targets, rank) {
      return targets.map(t => ({ type: 'apply_status', target: t, statusId: 'guard', stacks: rank.guardStacks }));
    }
  },

  retribution: {
    id: 'retribution', name: 'Retribution', icon: '⚖️',
    tree: SkillType.SHIELD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 10.0, cost: null, damage: 20, levelRequired: 17, autoLearn: false },
      { rank: 2, cooldown:  9.5, cost: null, damage: 28, levelRequired: 22, autoLearn: false },
      { rank: 3, cooldown:  9.0, cost: null, damage: 38, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      const missingFraction = 1 - (caster.currentHP / caster.maxHP);
      const bonus = Math.min(0.5, missingFraction * 0.51);
      const finalDamage = Math.round(rank.damage * (1 + bonus));
      return [{ type: 'damage', target: targets[0], amount: finalDamage, damageType: dmgType }];
    }
  },

  // ── Sword (additional) ────────────────────────────────────────────────
  piercing_thrust: {
    id: 'piercing_thrust', name: 'Piercing Thrust', icon: '🗡️',
    tree: SkillType.SWORD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.PIERCING],
    ranks: [
      { rank: 1, cooldown: 4.5, cost: 60, damage: 22, levelRequired:  5, autoLearn: true },
      { rank: 2, cooldown: 4.5, cost: 60, damage: 32, levelRequired: 10, autoLearn: true },
      { rank: 3, cooldown: 4.0, cost: 60, damage: 44, levelRequired: 15, autoLearn: true },
      { rank: 4, cooldown: 4.0, cost: 60, damage: 55, levelRequired: 20, autoLearn: true },
      { rank: 5, cooldown: 4.0, cost: 60, damage: 66, levelRequired: 25, autoLearn: false },
      { rank: 6, cooldown: 4.0, cost: 60, damage: 77, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  parry: {
    id: 'parry', name: 'Parry', icon: '🔄',
    tree: SkillType.SWORD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.SLASHING],
    ranks: [
      { rank: 1, cooldown: 8.0, cost: 75, damage: 20, levelRequired:  7, autoLearn: true },
      { rank: 2, cooldown: 7.5, cost: 75, damage: 28, levelRequired: 12, autoLearn: true },
      { rank: 3, cooldown: 7.0, cost: 75, damage: 38, levelRequired: 17, autoLearn: true },
      { rank: 4, cooldown: 7.0, cost: 75, damage: 47, levelRequired: 22, autoLearn: false },
      { rank: 5, cooldown: 7.0, cost: 75, damage: 56, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: caster, statusId: 'guard', stacks: 1 },
      ];
    }
  },

  blade_cleave: {
    id: 'blade_cleave', name: 'Blade Cleave', icon: '🌙',
    tree: SkillType.SWORD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.SLASHING],
    ranks: [
      { rank: 1, cooldown: 7.0, cost: 90, damage: 20, levelRequired:  9, autoLearn: true },
      { rank: 2, cooldown: 6.5, cost: 90, damage: 28, levelRequired: 14, autoLearn: true },
      { rank: 3, cooldown: 6.0, cost: 90, damage: 38, levelRequired: 19, autoLearn: true },
      { rank: 4, cooldown: 6.0, cost: 90, damage: 47, levelRequired: 24, autoLearn: false },
      { rank: 5, cooldown: 6.0, cost: 90, damage: 56, levelRequired: 29, autoLearn: false },
    ],
    targeting: 'cleave',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: dmgType }));
    }
  },

  flaming_blade: {
    id: 'flaming_blade', name: 'Flaming Blade', icon: '🔥',
    tree: SkillType.SWORD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.FIRE],
    ranks: [
      { rank: 1, cooldown: 6.0, cost: 110, damage: 26, levelRequired: 11, autoLearn: true },
      { rank: 2, cooldown: 5.5, cost: 110, damage: 36, levelRequired: 16, autoLearn: true },
      { rank: 3, cooldown: 5.0, cost: 110, damage: 48, levelRequired: 21, autoLearn: true },
      { rank: 4, cooldown: 5.0, cost: 110, damage: 59, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: targets[0], statusId: 'fire_vulnerable', stacks: 1 },
      ];
    }
  },

  decapitate: {
    id: 'decapitate', name: 'Decapitate', icon: '💀',
    tree: SkillType.SWORD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.TRUE],
    ranks: [
      { rank: 1, cooldown: 16.0, cost: 120, damage: 60,  levelRequired: 17, autoLearn: false },
      { rank: 2, cooldown: 15.0, cost: 120, damage: 85,  levelRequired: 22, autoLearn: false },
      { rank: 3, cooldown: 14.0, cost: 120, damage: 110, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType, ignoresGuard: true }];
    }
  },

  riposte: {
    id: 'riposte', name: 'Riposte', icon: '⚔️',
    tree: SkillType.SWORD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.PIERCING],
    ranks: [
      { rank: 1, cooldown: 6.5, cost: 80, damage: 22, levelRequired: 15, autoLearn: true },
      { rank: 2, cooldown: 6.0, cost: 80, damage: 32, levelRequired: 20, autoLearn: true },
      { rank: 3, cooldown: 5.5, cost: 80, damage: 44, levelRequired: 25, autoLearn: false },
      { rank: 4, cooldown: 5.5, cost: 80, damage: 55, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: caster, statusId: 'guard', stacks: 2 },
      ];
    }
  },

  // ── Flood (additional) ────────────────────────────────────────────────
  icy_current: {
    id: 'icy_current', name: 'Icy Current', icon: '🧊',
    tree: SkillType.FLOOD, tags: [AbilityTag.SPELL],
    damageType: [DamageType.COLD],
    ranks: [
      { rank: 1, cooldown: 5.0, cost: 85, damage: 24, levelRequired:  9, autoLearn: true },
      { rank: 2, cooldown: 4.8, cost: 85, damage: 34, levelRequired: 14, autoLearn: true },
      { rank: 3, cooldown: 4.5, cost: 85, damage: 46, levelRequired: 19, autoLearn: true },
      { rank: 4, cooldown: 4.5, cost: 85, damage: 57, levelRequired: 24, autoLearn: false },
      { rank: 5, cooldown: 4.5, cost: 85, damage: 68, levelRequired: 29, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  undertow: {
    id: 'undertow', name: 'Undertow', icon: '🌀',
    tree: SkillType.FLOOD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 10.0, cost: 100, damage: 38, levelRequired: 11, autoLearn: true },
      { rank: 2, cooldown:  9.5, cost: 100, damage: 52, levelRequired: 16, autoLearn: true },
      { rank: 3, cooldown:  9.0, cost: 100, damage: 68, levelRequired: 21, autoLearn: true },
      { rank: 4, cooldown:  9.0, cost: 100, damage: 83, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      const effects = [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
      if (Math.random() < 0.5) effects.push({ type: 'apply_status', target: targets[0], statusId: 'stun', stacks: 1 });
      return effects;
    }
  },

  maelstrom: {
    id: 'maelstrom', name: 'Maelstrom', icon: '🌊',
    tree: SkillType.FLOOD, tags: [AbilityTag.SPELL],
    damageType: [DamageType.COLD],
    ranks: [
      { rank: 1, cooldown: 16.0, cost: 120, damage: 28, levelRequired: 15, autoLearn: true },
      { rank: 2, cooldown: 15.0, cost: 120, damage: 40, levelRequired: 20, autoLearn: true },
      { rank: 3, cooldown: 14.0, cost: 120, damage: 54, levelRequired: 25, autoLearn: false },
      { rank: 4, cooldown: 14.0, cost: 120, damage: 67, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'all_enemies',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: dmgType }));
    }
  },

  consuming_torrent: {
    id: 'consuming_torrent', name: 'Consuming Torrent', icon: '💧',
    tree: SkillType.FLOOD, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 14.0, cost: 110, damage: 48, restoreResourceOnKill: 90, levelRequired: 17, autoLearn: false },
      { rank: 2, cooldown: 13.0, cost: 110, damage: 66, restoreResourceOnKill: 90, levelRequired: 22, autoLearn: false },
      { rank: 3, cooldown: 12.0, cost: 110, damage: 86, restoreResourceOnKill: 90, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  // ── Staff (additional) ────────────────────────────────────────────────
  double_hit: {
    id: 'double_hit', name: 'Double Hit', icon: '✌️',
    tree: SkillType.STAFF, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 6.0, cost: 35, damage: 18, levelRequired:  9, autoLearn: true },
      { rank: 2, cooldown: 5.5, cost: 35, damage: 25, levelRequired: 14, autoLearn: true },
      { rank: 3, cooldown: 5.0, cost: 35, damage: 34, levelRequired: 19, autoLearn: true },
      { rank: 4, cooldown: 5.0, cost: 35, damage: 42, levelRequired: 24, autoLearn: false },
      { rank: 5, cooldown: 5.0, cost: 35, damage: 50, levelRequired: 29, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
      ];
    }
  },

  lightning_rod: {
    id: 'lightning_rod', name: 'Lightning Rod', icon: '⚡',
    tree: SkillType.STAFF, tags: [AbilityTag.SPELL],
    damageType: [DamageType.LIGHTNING],
    ranks: [
      { rank: 1, cooldown: 7.0, cost: 45, damage: 30, levelRequired: 11, autoLearn: true },
      { rank: 2, cooldown: 6.5, cost: 45, damage: 42, levelRequired: 16, autoLearn: true },
      { rank: 3, cooldown: 6.0, cost: 45, damage: 56, levelRequired: 21, autoLearn: true },
      { rank: 4, cooldown: 6.0, cost: 45, damage: 69, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'random_enemy',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  lunge: {
    id: 'lunge', name: 'Lunge', icon: '🏃',
    tree: SkillType.STAFF, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 5.0, cost: 35, damage: 24, levelRequired: 15, autoLearn: true },
      { rank: 2, cooldown: 4.7, cost: 35, damage: 34, levelRequired: 20, autoLearn: true },
      { rank: 3, cooldown: 4.5, cost: 35, damage: 46, levelRequired: 25, autoLearn: false },
      { rank: 4, cooldown: 4.5, cost: 35, damage: 57, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      const effects = [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
      if (Math.random() < 0.30) effects.push({ type: 'apply_status', target: targets[0], statusId: 'stun', stacks: 1 });
      return effects;
    }
  },

  deflective_spin: {
    id: 'deflective_spin', name: 'Deflective Spin', icon: '🌀',
    tree: SkillType.STAFF, tags: [AbilityTag.DEFENSIVE],
    ranks: [
      { rank: 1, cooldown: 9.0, cost: 40, guardStacks: 1, retaliationStacks: 2, levelRequired: 17, autoLearn: false },
      { rank: 2, cooldown: 8.5, cost: 40, guardStacks: 2, retaliationStacks: 2, levelRequired: 22, autoLearn: false },
      { rank: 3, cooldown: 8.0, cost: 40, guardStacks: 2, retaliationStacks: 3, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'self',
    execute(caster, targets, rank) {
      return [
        { type: 'apply_status', target: caster, statusId: 'lightning_retaliation', stacks: rank.retaliationStacks },
        { type: 'apply_status', target: caster, statusId: 'guard', stacks: rank.guardStacks },
      ];
    }
  },

  // ── Alchemy ───────────────────────────────────────────────────────────
  toss_vial: {
    id: 'toss_vial', name: 'Toss Vial', icon: '⚗️',
    tree: SkillType.ALCHEMY, tags: [AbilityTag.RANGED],
    damageType: [DamageType.FIRE, DamageType.LIGHTNING, DamageType.COLD],
    ranks: [
      { rank: 1, cooldown: 2.5, cost: null, damage: 18, levelRequired:  1, autoLearn: true },
      { rank: 2, cooldown: 2.5, cost: null, damage: 26, levelRequired:  6, autoLearn: true },
      { rank: 3, cooldown: 2.5, cost: null, damage: 35, levelRequired: 11, autoLearn: true },
      { rank: 4, cooldown: 2.5, cost: null, damage: 44, levelRequired: 16, autoLearn: true },
      { rank: 5, cooldown: 2.5, cost: null, damage: 52, levelRequired: 21, autoLearn: true },
      { rank: 6, cooldown: 2.5, cost: null, damage: 61, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  healing_draught: {
    id: 'healing_draught', name: 'Healing Draught', icon: '🧪',
    tree: SkillType.ALCHEMY, tags: [AbilityTag.SUPPORT],
    ranks: [
      { rank: 1, cooldown: 8.0, cost: 15, regenStacks: 2, levelRequired:  3, autoLearn: true },
      { rank: 2, cooldown: 7.5, cost: 15, regenStacks: 3, levelRequired:  8, autoLearn: true },
      { rank: 3, cooldown: 7.0, cost: 15, regenStacks: 4, levelRequired: 13, autoLearn: true },
      { rank: 4, cooldown: 7.0, cost: 15, regenStacks: 4, levelRequired: 18, autoLearn: true },
      { rank: 5, cooldown: 7.0, cost: 15, regenStacks: 4, levelRequired: 23, autoLearn: false },
      { rank: 6, cooldown: 7.0, cost: 15, regenStacks: 5, levelRequired: 28, autoLearn: false },
    ],
    targeting: 'single_player_any',
    execute(caster, targets, rank) {
      return [{ type: 'apply_status', target: targets[0], statusId: 'regen', stacks: rank.regenStacks }];
    }
  },

  poison_vial: {
    id: 'poison_vial', name: 'Poison Vial', icon: '☠️',
    tree: SkillType.ALCHEMY, tags: [AbilityTag.RANGED],
    damageType: [DamageType.NATURE],
    ranks: [
      { rank: 1, cooldown: 6.0, cost: 20, damage: 12, poisonStacks: 1, levelRequired:  5, autoLearn: true },
      { rank: 2, cooldown: 5.5, cost: 20, damage: 18, poisonStacks: 2, levelRequired: 10, autoLearn: true },
      { rank: 3, cooldown: 5.0, cost: 20, damage: 24, poisonStacks: 3, levelRequired: 15, autoLearn: true },
      { rank: 4, cooldown: 5.0, cost: 20, damage: 30, poisonStacks: 3, levelRequired: 20, autoLearn: true },
      { rank: 5, cooldown: 5.0, cost: 20, damage: 36, poisonStacks: 3, levelRequired: 25, autoLearn: false },
      { rank: 6, cooldown: 5.0, cost: 20, damage: 42, poisonStacks: 3, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: targets[0], statusId: 'poisoned', stacks: rank.poisonStacks },
      ];
    }
  },

  alchemical_surge: {
    id: 'alchemical_surge', name: 'Alchemical Surge', icon: '✨',
    tree: SkillType.ALCHEMY, tags: [AbilityTag.SUPPORT],
    ranks: [
      { rank: 1, cooldown: 12.0, cost: 25, resourceAmount: 30, hasteStacks: 1, levelRequired:  7, autoLearn: true },
      { rank: 2, cooldown: 11.0, cost: 25, resourceAmount: 40, hasteStacks: 1, levelRequired: 12, autoLearn: true },
      { rank: 3, cooldown: 10.0, cost: 25, resourceAmount: 50, hasteStacks: 2, levelRequired: 17, autoLearn: true },
      { rank: 4, cooldown: 10.0, cost: 25, resourceAmount: 55, hasteStacks: 2, levelRequired: 22, autoLearn: false },
      { rank: 5, cooldown: 10.0, cost: 25, resourceAmount: 60, hasteStacks: 2, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'self',
    execute(caster, targets, rank) {
      return [
        { type: 'restore_resource', target: caster, amount: rank.resourceAmount },
        { type: 'apply_status', target: caster, statusId: 'haste', stacks: rank.hasteStacks },
      ];
    }
  },

  caustic_splash: {
    id: 'caustic_splash', name: 'Caustic Splash', icon: '🧪',
    tree: SkillType.ALCHEMY, tags: [AbilityTag.SPELL],
    ranks: [
      { rank: 1, cooldown: 8.0, cost: 35, armorDamage: 20, levelRequired:  9, autoLearn: true },
      { rank: 2, cooldown: 7.5, cost: 35, armorDamage: 28, levelRequired: 14, autoLearn: true },
      { rank: 3, cooldown: 7.0, cost: 35, armorDamage: 38, levelRequired: 19, autoLearn: true },
      { rank: 4, cooldown: 7.0, cost: 35, armorDamage: 47, levelRequired: 24, autoLearn: false },
      { rank: 5, cooldown: 7.0, cost: 35, armorDamage: 56, levelRequired: 29, autoLearn: false },
    ],
    targeting: 'cleave',
    execute(caster, targets, rank) {
      return targets.map(t => ({ type: 'damage_armor', target: t, amount: rank.armorDamage }));
    }
  },

  transmutation: {
    id: 'transmutation', name: 'Transmutation', icon: '🔮',
    tree: SkillType.ALCHEMY, tags: [AbilityTag.SUPPORT],
    ranks: [
      { rank: 1, cooldown: 12.0, cost: 45, healAmount: 35, armorAmount: 20, levelRequired: 11, autoLearn: true },
      { rank: 2, cooldown: 11.0, cost: 45, healAmount: 50, armorAmount: 28, levelRequired: 16, autoLearn: true },
      { rank: 3, cooldown: 10.0, cost: 45, healAmount: 65, armorAmount: 38, levelRequired: 21, autoLearn: true },
      { rank: 4, cooldown: 10.0, cost: 45, healAmount: 80, armorAmount: 46, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'single_player_any',
    execute(caster, targets, rank) {
      return [
        { type: 'heal', target: targets[0], amount: rank.healAmount },
        { type: 'restore_armor', target: targets[0], amount: rank.armorAmount },
      ];
    }
  },

  poison_cloud: {
    id: 'poison_cloud', name: 'Poison Cloud', icon: '🌫️',
    tree: SkillType.ALCHEMY, tags: [AbilityTag.SPELL],
    ranks: [
      { rank: 1, cooldown: 12.0, cost: 30, poisonStacks: 1, levelRequired: 15, autoLearn: true },
      { rank: 2, cooldown: 11.5, cost: 30, poisonStacks: 2, levelRequired: 20, autoLearn: true },
      { rank: 3, cooldown: 11.0, cost: 30, poisonStacks: 3, levelRequired: 25, autoLearn: false },
      { rank: 4, cooldown: 11.0, cost: 30, poisonStacks: 3, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'all_enemies',
    execute(caster, targets, rank) {
      return targets.map(t => ({ type: 'apply_status', target: t, statusId: 'poisoned', stacks: rank.poisonStacks }));
    }
  },

  elixir_of_mending: {
    id: 'elixir_of_mending', name: 'Elixir of Mending', icon: '💊',
    tree: SkillType.ALCHEMY, tags: [AbilityTag.SUPPORT],
    ranks: [
      { rank: 1, cooldown: 12.0, cost: 40, regenStacks: 1, levelRequired: 17, autoLearn: false },
      { rank: 2, cooldown: 11.5, cost: 40, regenStacks: 2, levelRequired: 22, autoLearn: false },
      { rank: 3, cooldown: 11.0, cost: 40, regenStacks: 3, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'all_allies',
    execute(caster, targets, rank) {
      return targets.map(t => ({ type: 'apply_status', target: t, statusId: 'regen', stacks: rank.regenStacks }));
    }
  },

  // ── Void (additional) ─────────────────────────────────────────────────
  void_tear: {
    id: 'void_tear', name: 'Void Tear', icon: '🌑',
    tree: SkillType.VOID, tags: [AbilityTag.SPELL],
    damageType: [DamageType.VOID],
    ranks: [
      { rank: 1, cooldown: 5.0, cost: 25, damage: 20, levelRequired:  5, autoLearn: true },
      { rank: 2, cooldown: 4.7, cost: 25, damage: 28, levelRequired: 10, autoLearn: true },
      { rank: 3, cooldown: 4.5, cost: 25, damage: 38, levelRequired: 15, autoLearn: true },
      { rank: 4, cooldown: 4.5, cost: 25, damage: 47, levelRequired: 20, autoLearn: true },
      { rank: 5, cooldown: 4.5, cost: 25, damage: 56, levelRequired: 25, autoLearn: false },
      { rank: 6, cooldown: 4.5, cost: 25, damage: 65, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: targets[0], statusId: 'void_vulnerability', stacks: 1 },
      ];
    }
  },

  nullify: {
    id: 'nullify', name: 'Nullify', icon: '🚫',
    tree: SkillType.VOID, tags: [AbilityTag.SPELL],
    damageType: [DamageType.ARCANA],
    ranks: [
      { rank: 1, cooldown: 7.0, cost: 35, damage: 24, levelRequired:  7, autoLearn: true },
      { rank: 2, cooldown: 6.5, cost: 35, damage: 34, levelRequired: 12, autoLearn: true },
      { rank: 3, cooldown: 6.0, cost: 35, damage: 46, levelRequired: 17, autoLearn: true },
      { rank: 4, cooldown: 6.0, cost: 35, damage: 57, levelRequired: 22, autoLearn: false },
      { rank: 5, cooldown: 6.0, cost: 35, damage: 68, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      const effects = [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
      if (Math.random() < 0.40) effects.push({ type: 'apply_status', target: targets[0], statusId: 'root', stacks: 1 });
      return effects;
    }
  },

  entropic_pulse: {
    id: 'entropic_pulse', name: 'Entropic Pulse', icon: '🌀',
    tree: SkillType.VOID, tags: [AbilityTag.SPELL],
    damageType: [DamageType.VOID],
    ranks: [
      { rank: 1, cooldown: 10.0, cost: 45, damage: 20, levelRequired:  9, autoLearn: true },
      { rank: 2, cooldown:  9.5, cost: 45, damage: 28, levelRequired: 14, autoLearn: true },
      { rank: 3, cooldown:  9.0, cost: 45, damage: 38, levelRequired: 19, autoLearn: true },
      { rank: 4, cooldown:  9.0, cost: 45, damage: 47, levelRequired: 24, autoLearn: false },
      { rank: 5, cooldown:  9.0, cost: 45, damage: 56, levelRequired: 29, autoLearn: false },
    ],
    targeting: 'all_enemies',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return targets.flatMap(t => {
        const effects = [{ type: 'damage', target: t, amount: rank.damage, damageType: dmgType }];
        if (Math.random() < 0.30) effects.push({ type: 'apply_status', target: t, statusId: 'slow', stacks: 1 });
        return effects;
      });
    }
  },

  void_collapse: {
    id: 'void_collapse', name: 'Void Collapse', icon: '⚫',
    tree: SkillType.VOID, tags: [AbilityTag.SPELL],
    damageType: [DamageType.VOID],
    ranks: [
      { rank: 1, cooldown: 12.0, cost: 55, damage: 36, levelRequired: 11, autoLearn: true },
      { rank: 2, cooldown: 11.0, cost: 55, damage: 50, levelRequired: 16, autoLearn: true },
      { rank: 3, cooldown: 10.0, cost: 55, damage: 66, levelRequired: 21, autoLearn: true },
      { rank: 4, cooldown: 10.0, cost: 55, damage: 81, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      const stacks = targets[0]?.getStatus?.('void_vulnerability')?.stacks ?? 0;
      const amount = Math.round(rank.damage * (1 + stacks * 0.25));
      return [{ type: 'damage', target: targets[0], amount, damageType: dmgType }];
    }
  },

  blur_veil: {
    id: 'blur_veil', name: 'Blur Veil', icon: '👁️',
    tree: SkillType.VOID, tags: [AbilityTag.SPELL],
    ranks: [
      { rank: 1, cooldown: 12.0, cost: 30, blurStacks: 2, levelRequired: 15, autoLearn: true },
      { rank: 2, cooldown: 11.0, cost: 30, blurStacks: 3, levelRequired: 20, autoLearn: true },
      { rank: 3, cooldown: 10.0, cost: 30, blurStacks: 3, levelRequired: 25, autoLearn: false },
      { rank: 4, cooldown: 10.0, cost: 30, blurStacks: 3, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'self',
    execute(caster, targets, rank) {
      return [{ type: 'apply_status', target: caster, statusId: 'blur', stacks: rank.blurStacks }];
    }
  },

  conjure_shadow: {
    id: 'conjure_shadow', name: 'Conjure Shadow', icon: '👻',
    tree: SkillType.VOID, tags: [AbilityTag.SPELL],
    ranks: [
      { rank: 1, cooldown: 20.0, cost: 60, levelRequired: 17, autoLearn: false },
      { rank: 2, cooldown: 18.0, cost: 60, levelRequired: 22, autoLearn: false },
      { rank: 3, cooldown: 16.0, cost: 60, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      if (!targets[0]) return [];
      return [{ type: 'conjure_shadow', target: targets[0] }];
    }
  },

  // ── Mace ──────────────────────────────────────────────────────────────
  mace_strike: {
    id: 'mace_strike', name: 'Mace Strike', icon: '🔨',
    tree: SkillType.MACE, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 2.8, cost: null, damage: 18, levelRequired:  1, autoLearn: true },
      { rank: 2, cooldown: 2.8, cost: null, damage: 26, levelRequired:  6, autoLearn: true },
      { rank: 3, cooldown: 2.8, cost: null, damage: 36, levelRequired: 11, autoLearn: true },
      { rank: 4, cooldown: 2.8, cost: null, damage: 45, levelRequired: 16, autoLearn: true },
      { rank: 5, cooldown: 2.8, cost: null, damage: 54, levelRequired: 21, autoLearn: true },
      { rank: 6, cooldown: 2.8, cost: null, damage: 63, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  reckless_smash: {
    id: 'reckless_smash', name: 'Reckless Smash', icon: '💢',
    tree: SkillType.MACE, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 5.5, cost: 30, damage: 22, levelRequired:  3, autoLearn: true },
      { rank: 2, cooldown: 5.0, cost: 30, damage: 32, levelRequired:  8, autoLearn: true },
      { rank: 3, cooldown: 4.5, cost: 30, damage: 44, levelRequired: 13, autoLearn: true },
      { rank: 4, cooldown: 4.5, cost: 30, damage: 55, levelRequired: 18, autoLearn: true },
      { rank: 5, cooldown: 4.5, cost: 30, damage: 66, levelRequired: 23, autoLearn: false },
      { rank: 6, cooldown: 4.5, cost: 30, damage: 77, levelRequired: 28, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      const effects = [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
      if (Math.random() < 0.40) effects.push({ type: 'apply_status', target: targets[0], statusId: 'stun', stacks: 1 });
      return effects;
    }
  },

  bone_crack: {
    id: 'bone_crack', name: 'Bone Crack', icon: '💀',
    tree: SkillType.MACE, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 6.5, cost: 40, damage: 18, levelRequired:  5, autoLearn: true },
      { rank: 2, cooldown: 6.0, cost: 40, damage: 26, levelRequired: 10, autoLearn: true },
      { rank: 3, cooldown: 5.5, cost: 40, damage: 36, levelRequired: 15, autoLearn: true },
      { rank: 4, cooldown: 5.5, cost: 40, damage: 45, levelRequired: 20, autoLearn: true },
      { rank: 5, cooldown: 5.5, cost: 40, damage: 54, levelRequired: 25, autoLearn: false },
      { rank: 6, cooldown: 5.5, cost: 40, damage: 63, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: targets[0], statusId: 'weakness', stacks: 1 },
      ];
    }
  },

  earth_shatter: {
    id: 'earth_shatter', name: 'Earth Shatter', icon: '🪨',
    tree: SkillType.MACE, tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [
      { rank: 1, cooldown: 10.0, cost: 55, damage: 20, levelRequired:  7, autoLearn: true },
      { rank: 2, cooldown:  9.5, cost: 55, damage: 28, levelRequired: 12, autoLearn: true },
      { rank: 3, cooldown:  9.0, cost: 55, damage: 38, levelRequired: 17, autoLearn: true },
      { rank: 4, cooldown:  9.0, cost: 55, damage: 47, levelRequired: 22, autoLearn: false },
      { rank: 5, cooldown:  9.0, cost: 55, damage: 56, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'all_enemies',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: dmgType }));
    }
  },

  shocking_blow: {
    id: 'shocking_blow', name: 'Shocking Blow', icon: '⚡',
    tree: SkillType.MACE, tags: [AbilityTag.MELEE],
    damageType: [DamageType.LIGHTNING],
    ranks: [
      { rank: 1, cooldown: 6.0, cost: 65, damage: 28, levelRequired:  9, autoLearn: true },
      { rank: 2, cooldown: 5.5, cost: 65, damage: 40, levelRequired: 14, autoLearn: true },
      { rank: 3, cooldown: 5.0, cost: 65, damage: 54, levelRequired: 19, autoLearn: true },
      { rank: 4, cooldown: 5.0, cost: 65, damage: 67, levelRequired: 24, autoLearn: false },
      { rank: 5, cooldown: 5.0, cost: 65, damage: 80, levelRequired: 29, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  last_rites: {
    id: 'last_rites', name: 'Last Rites', icon: '⚰️',
    tree: SkillType.MACE, tags: [AbilityTag.MELEE],
    damageType: [DamageType.TRUE],
    ranks: [
      { rank: 1, cooldown: 18.0, cost: 80, damage: 50, levelRequired: 17, autoLearn: false },
      { rank: 2, cooldown: 17.0, cost: 80, damage: 70, levelRequired: 22, autoLearn: false },
      { rank: 3, cooldown: 16.0, cost: 80, damage: 90, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType, ignoresGuard: true }];
    }
  },

  storm_throw: {
    id: 'storm_throw', name: 'Storm Throw', icon: '🌩️',
    tree: SkillType.MACE, tags: [AbilityTag.RANGED],
    damageType: [DamageType.LIGHTNING],
    ranks: [
      { rank: 1, cooldown: 5.0, cost: 50, damage: 26, levelRequired: 11, autoLearn: true },
      { rank: 2, cooldown: 4.7, cost: 50, damage: 36, levelRequired: 16, autoLearn: true },
      { rank: 3, cooldown: 4.5, cost: 50, damage: 48, levelRequired: 21, autoLearn: true },
      { rank: 4, cooldown: 4.5, cost: 50, damage: 59, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: targets[0], statusId: 'lightning_vulnerable', stacks: 1 },
      ];
    }
  },

  energize_self: {
    id: 'energize_self', name: 'Energize', icon: '⚡',
    tree: SkillType.MACE, tags: [AbilityTag.SUPPORT],
    ranks: [
      { rank: 1, cooldown: 10.0, cost: 60, energizeStacks: 2, levelRequired: 15, autoLearn: true },
      { rank: 2, cooldown:  9.5, cost: 60, energizeStacks: 3, levelRequired: 20, autoLearn: true },
      { rank: 3, cooldown:  9.0, cost: 60, energizeStacks: 3, levelRequired: 25, autoLearn: false },
      { rank: 4, cooldown:  9.0, cost: 60, energizeStacks: 3, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'self',
    execute(caster, targets, rank) {
      return [{ type: 'apply_status', target: caster, statusId: 'energize', stacks: rank.energizeStacks }];
    }
  },

  // ── Holy ──────────────────────────────────────────────────────────────
  smite: {
    id: 'smite', name: 'Smite', icon: '✝️',
    tree: SkillType.HOLY, tags: [AbilityTag.SPELL],
    damageType: [DamageType.LIGHTNING],
    ranks: [
      { rank: 1, cooldown: 2.5, cost: null, damage: 18, levelRequired:  1, autoLearn: true },
      { rank: 2, cooldown: 2.5, cost: null, damage: 26, levelRequired:  6, autoLearn: true },
      { rank: 3, cooldown: 2.5, cost: null, damage: 35, levelRequired: 11, autoLearn: true },
      { rank: 4, cooldown: 2.5, cost: null, damage: 44, levelRequired: 16, autoLearn: true },
      { rank: 5, cooldown: 2.5, cost: null, damage: 52, levelRequired: 21, autoLearn: true },
      { rank: 6, cooldown: 2.5, cost: null, damage: 61, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  lay_on_hands: {
    id: 'lay_on_hands', name: 'Lay on Hands', icon: '🤲',
    tree: SkillType.HOLY, tags: [AbilityTag.SUPPORT],
    ranks: [
      { rank: 1, cooldown: 7.0, cost: 25, healAmount:  35, regenStacks: 1, levelRequired:  3, autoLearn: true },
      { rank: 2, cooldown: 6.5, cost: 25, healAmount:  50, regenStacks: 2, levelRequired:  8, autoLearn: true },
      { rank: 3, cooldown: 6.0, cost: 25, healAmount:  65, regenStacks: 2, levelRequired: 13, autoLearn: true },
      { rank: 4, cooldown: 6.0, cost: 25, healAmount:  80, regenStacks: 2, levelRequired: 18, autoLearn: true },
      { rank: 5, cooldown: 6.0, cost: 25, healAmount:  95, regenStacks: 2, levelRequired: 23, autoLearn: false },
      { rank: 6, cooldown: 6.0, cost: 25, healAmount: 110, regenStacks: 2, levelRequired: 28, autoLearn: false },
    ],
    targeting: 'single_player_any',
    execute(caster, targets, rank) {
      return [
        { type: 'heal', target: targets[0], amount: rank.healAmount },
        { type: 'apply_status', target: targets[0], statusId: 'regen', stacks: rank.regenStacks },
      ];
    }
  },

  holy_flame: {
    id: 'holy_flame', name: 'Holy Flame', icon: '🕯️',
    tree: SkillType.HOLY, tags: [AbilityTag.SPELL],
    damageType: [DamageType.FIRE],
    ranks: [
      { rank: 1, cooldown: 4.5, cost: 35, damage: 20, levelRequired:  5, autoLearn: true },
      { rank: 2, cooldown: 4.2, cost: 35, damage: 28, levelRequired: 10, autoLearn: true },
      { rank: 3, cooldown: 4.0, cost: 35, damage: 38, levelRequired: 15, autoLearn: true },
      { rank: 4, cooldown: 4.0, cost: 35, damage: 47, levelRequired: 20, autoLearn: true },
      { rank: 5, cooldown: 4.0, cost: 35, damage: 56, levelRequired: 25, autoLearn: false },
      { rank: 6, cooldown: 4.0, cost: 35, damage: 65, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  consecrate: {
    id: 'consecrate', name: 'Consecrate', icon: '✨',
    tree: SkillType.HOLY, tags: [AbilityTag.SUPPORT],
    ranks: [
      { rank: 1, cooldown: 10.0, cost: 50, guardStacks: 2, levelRequired:  7, autoLearn: true },
      { rank: 2, cooldown:  9.5, cost: 50, guardStacks: 3, levelRequired: 12, autoLearn: true },
      { rank: 3, cooldown:  9.0, cost: 50, guardStacks: 4, levelRequired: 17, autoLearn: true },
      { rank: 4, cooldown:  9.0, cost: 50, guardStacks: 4, levelRequired: 22, autoLearn: false },
      { rank: 5, cooldown:  9.0, cost: 50, guardStacks: 5, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'all_allies',
    execute(caster, targets, rank) {
      return targets.map(t => ({ type: 'apply_status', target: t, statusId: 'guard', stacks: rank.guardStacks }));
    }
  },

  benediction: {
    id: 'benediction', name: 'Benediction', icon: '💫',
    tree: SkillType.HOLY, tags: [AbilityTag.SUPPORT],
    ranks: [
      { rank: 1, cooldown: 10.0, cost: 65, healAmount: 30, levelRequired:  9, autoLearn: true },
      { rank: 2, cooldown:  9.5, cost: 65, healAmount: 42, levelRequired: 14, autoLearn: true },
      { rank: 3, cooldown:  9.0, cost: 65, healAmount: 56, levelRequired: 19, autoLearn: true },
      { rank: 4, cooldown:  9.0, cost: 65, healAmount: 69, levelRequired: 24, autoLearn: false },
      { rank: 5, cooldown:  9.0, cost: 65, healAmount: 82, levelRequired: 29, autoLearn: false },
    ],
    targeting: 'two_lowest_hp_allies',
    execute(caster, targets, rank) {
      return targets.map(t => ({ type: 'heal', target: t, amount: rank.healAmount }));
    }
  },

  divine_wrath: {
    id: 'divine_wrath', name: 'Divine Wrath', icon: '🌟',
    tree: SkillType.HOLY, tags: [AbilityTag.SPELL],
    damageType: [DamageType.FIRE],
    ranks: [
      { rank: 1, cooldown: 10.0, cost: 80, damage: 26, levelRequired: 11, autoLearn: true },
      { rank: 2, cooldown:  9.5, cost: 80, damage: 36, levelRequired: 16, autoLearn: true },
      { rank: 3, cooldown:  9.0, cost: 80, damage: 48, levelRequired: 21, autoLearn: true },
      { rank: 4, cooldown:  9.0, cost: 80, damage: 59, levelRequired: 26, autoLearn: false },
    ],
    targeting: 'all_enemies',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: dmgType }));
    }
  },

  holy_light: {
    id: 'holy_light', name: 'Holy Light', icon: '💛',
    tree: SkillType.HOLY, tags: [AbilityTag.SUPPORT],
    ranks: [
      { rank: 1, cooldown: 12.0, cost: 70, healAmount:  60, guardStacks: 1, levelRequired: 15, autoLearn: true },
      { rank: 2, cooldown: 11.0, cost: 70, healAmount:  85, guardStacks: 2, levelRequired: 20, autoLearn: true },
      { rank: 3, cooldown: 10.0, cost: 70, healAmount: 110, guardStacks: 2, levelRequired: 25, autoLearn: false },
      { rank: 4, cooldown: 10.0, cost: 70, healAmount: 135, guardStacks: 2, levelRequired: 30, autoLearn: false },
    ],
    targeting: 'single_player_any',
    execute(caster, targets, rank) {
      return [
        { type: 'heal', target: targets[0], amount: rank.healAmount },
        { type: 'apply_status', target: targets[0], statusId: 'guard', stacks: rank.guardStacks },
      ];
    }
  },

  resurrection: {
    id: 'resurrection', name: 'Resurrection', icon: '🕊️',
    tree: SkillType.HOLY, tags: [AbilityTag.SPELL],
    persistentCooldown: true,
    ranks: [
      { rank: 1, cooldown: 120.0, cost: 100, levelRequired: 17, autoLearn: false },
      { rank: 2, cooldown: 110.0, cost: 100, levelRequired: 22, autoLearn: false },
      { rank: 3, cooldown: 100.0, cost: 100, levelRequired: 27, autoLearn: false },
    ],
    targeting: 'dead_ally',
    execute(caster, targets, rank) {
      if (!targets[0]) return [];
      return [{ type: 'revive', target: targets[0], fraction: 0.25 }];
    }
  },

  // ── Enemies ───────────────────────────────────────────────────────────
  heavy_swing: {
    id: 'heavy_swing', name: 'Heavy Swing', icon: '⚔️',
    tags: [AbilityTag.MELEE],
    damageType: [DamageType.SLASHING],
    ranks: [{ rank: 1, cooldown: 3.2, cost: null, damage: 16, levelRequired: 1, autoLearn: true }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  bash: {
    id: 'bash', name: 'Bash', icon: '💢',
    tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [{ rank: 1, cooldown: 15.0, cost: null, damage: 8, levelRequired: 1, autoLearn: true }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: targets[0], statusId: 'stun', stacks: 1 }
      ];
    }
  },

  bolt_shot: {
    id: 'bolt_shot', name: 'Bolt Shot', icon: '🏹',
    tags: [AbilityTag.RANGED],
    damageType: [DamageType.PIERCING],
    ranks: [{ rank: 1, cooldown: 2.8, cost: null, damage: 18, levelRequired: 1, autoLearn: true }],
    targeting: 'single_player_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  suppressing_fire: {
    id: 'suppressing_fire', name: 'Suppressing Fire', icon: '🎯',
    tags: [AbilityTag.RANGED],
    damageType: [DamageType.PIERCING],
    ranks: [{ rank: 1, cooldown: 9.0, cost: null, damage: 10, levelRequired: 1, autoLearn: true }],
    targeting: 'all_player_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: dmgType }));
    }
  },

  gnaw: {
    id: 'gnaw', name: 'Gnaw', icon: '🐀',
    tags: [AbilityTag.MELEE],
    damageType: [DamageType.PIERCING],
    ranks: [{ rank: 1, cooldown: 1.8, cost: null, damage: 8, levelRequired: 1, autoLearn: true }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: targets[0], statusId: 'bleeding', stacks: 1 }
      ];
    }
  },

  swarm: {
    id: 'swarm', name: 'Swarm', icon: '💨',
    tags: [AbilityTag.MELEE],
    damageType: [DamageType.PIERCING],
    ranks: [{ rank: 1, cooldown: 5.0, cost: null, damage: 5, levelRequired: 1, autoLearn: true }],
    targeting: 'all_player_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: dmgType }));
    }
  },

  hammer_blow: {
    id: 'hammer_blow', name: 'Hammer Blow', icon: '🔨',
    tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [{ rank: 1, cooldown: 4.0, cost: null, damage: 28, levelRequired: 1, autoLearn: true }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: targets[0], statusId: 'stun', stacks: 1 }
      ];
    }
  },

  shield_slam_enemy: {
    id: 'shield_slam_enemy', name: 'Shield Slam', icon: '🛡️',
    tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [{ rank: 1, cooldown: 7.0, cost: null, damage: 18, guardStacks: 2, levelRequired: 1, autoLearn: true }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: caster, statusId: 'guard', stacks: rank.guardStacks }
      ];
    }
  },

  brace: {
    id: 'brace', name: 'Brace', icon: '🏰',
    tags: [AbilityTag.DEFENSIVE],
    ranks: [{ rank: 1, cooldown: 12.0, cost: null, guardStacks: 3, levelRequired: 1, autoLearn: true }],
    targeting: 'self',
    execute(caster, targets, rank) {
      return [
        { type: 'apply_status', target: caster, statusId: 'guard', stacks: rank.guardStacks },
      ];
    }
  },

  command_strike: {
    id: 'command_strike', name: 'Command Strike', icon: '⚔️',
    tags: [AbilityTag.MELEE],
    damageType: [DamageType.SLASHING],
    ranks: [
      { rank: 1, cooldown: 3.0, cost: null, damage: 32, levelRequired: 1, autoLearn: true },
      { rank: 2, cooldown: 3.0, cost: null, damage: 42, levelRequired: 5, autoLearn: true }, // Phase 2
    ],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType }];
    }
  },

  waterlogged_roar: {
    id: 'waterlogged_roar', name: 'Waterlogged Roar', icon: '😤',
    tags: [AbilityTag.SPELL],
    ranks: [{ rank: 1, cooldown: 12.0, cost: null, slowStacks: 2, selfThreat: 2, levelRequired: 1, autoLearn: true }],
    targeting: 'all_players',
    execute(caster, targets, rank) {
      const effects = targets.map(t => ({
        type: 'apply_status', target: t, statusId: 'slow', stacks: rank.slowStacks
      }));
      effects.push({ type: 'gain_threat', target: caster, amount: rank.selfThreat });
      return effects;
    }
  },

  choking_grip: {
    id: 'choking_grip', name: 'Choking Grip', icon: '✊',
    tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [{ rank: 1, cooldown: 9.0, cost: null, damage: 20, levelRequired: 1, autoLearn: true }],
    targeting: 'single_player_any',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: dmgType },
        { type: 'apply_status', target: targets[0], statusId: 'root', stacks: 1 }
      ];
    }
  },

  sergeants_will: {
    id: 'sergeants_will', name: "Sergeant's Will", icon: '💪',
    tags: [AbilityTag.SPELL],
    ranks: [{ rank: 1, cooldown: 10.0, cost: null, hasteStacks: 2, levelRequired: 1, autoLearn: true }],
    targeting: 'self',
    execute(caster, targets, rank) {
      return [{ type: 'apply_status', target: caster, statusId: 'haste', stacks: rank.hasteStacks }];
    }
  },

  // ── Threat Abilities ─────────────────────────────────────────────────────
  // Triggered when an enemy's threat bar reaches 100.  No cooldown, no cost.

  desperate_flail: {
    id: 'desperate_flail', name: 'Desperate Flail', icon: '💥',
    tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [{ rank: 1, cooldown: null, cost: null, damage: 25, ignoresGuard: true }],
    targeting: 'single_player_any',
    execute(caster, targets, rank) {
      const t      = targets[Math.floor(Math.random() * targets.length)];
      const dmgType = pickDmgType(this.damageType);
      return [{ type: 'damage', target: t, amount: rank.damage, damageType: dmgType, ignoresGuard: rank.ignoresGuard }];
    }
  },

  headshot: {
    id: 'headshot', name: 'Headshot', icon: '🎯',
    tags: [AbilityTag.RANGED],
    damageType: [DamageType.PIERCING],
    ranks: [{ rank: 1, cooldown: null, cost: null, damage: 35, stunChance: 0.5 }],
    targeting: 'single_player_any',
    execute(caster, targets, rank) {
      const t      = targets[Math.floor(Math.random() * targets.length)];
      const dmgType = pickDmgType(this.damageType);
      const effects = [{ type: 'damage', target: t, amount: rank.damage, damageType: dmgType }];
      if (Math.random() < rank.stunChance) effects.push({ type: 'apply_status', target: t, statusId: 'stun', stacks: 1 });
      return effects;
    }
  },

  wardens_wrath: {
    id: 'wardens_wrath', name: "Warden's Wrath", icon: '🔨',
    tags: [AbilityTag.MELEE],
    damageType: [DamageType.BLUDGEONING],
    ranks: [{ rank: 1, cooldown: null, cost: null, damage: 45, slowStacks: 2 }],
    targeting: 'single_player_highest_hp',
    execute(caster, targets, rank) {
      const maxHpTarget = targets.reduce((a, b) => a.currentHP > b.currentHP ? a : b);
      const dmgType     = pickDmgType(this.damageType);
      return [
        { type: 'damage', target: maxHpTarget, amount: rank.damage, damageType: dmgType },
        ...targets.map(t => ({ type: 'apply_status', target: t, statusId: 'slow', stacks: rank.slowStacks })),
      ];
    }
  },

  rising_tide: {
    id: 'rising_tide', name: 'Rising Tide', icon: '🌊',
    tags: [AbilityTag.SPELL],
    damageType: [DamageType.BLUDGEONING],
    isPhaseTransition: true,
    ranks: [{ rank: 1, cooldown: null, cost: null, damage: 35, stacks: 2, armorRestore: 60 }],
    targeting: 'all_players',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      const effects = targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: dmgType }));
      targets.forEach(t => effects.push({ type: 'apply_status', target: t, statusId: 'bleeding', stacks: rank.stacks }));
      effects.push({ type: 'restore_armor', target: caster, amount: rank.armorRestore });
      return effects;
    }
  },

  deep_takes_all: {
    id: 'deep_takes_all', name: 'The Deep Takes All', icon: '🌑',
    tags: [AbilityTag.SPELL],
    damageType: [DamageType.TRUE],
    ranks: [{ rank: 1, cooldown: null, cost: null, damage: 50, slowStacks: 3 }],
    targeting: 'all_players',
    execute(caster, targets, rank) {
      const dmgType = pickDmgType(this.damageType);
      const effects = targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: dmgType }));
      targets.forEach(t => effects.push({ type: 'apply_status', target: t, statusId: 'slow', stacks: rank.slowStacks }));
      return effects;
    }
  },
};
