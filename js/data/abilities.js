// js/data/abilities.js

import { SkillType, AbilityTag } from '../enums.js';

export const abilities = {

  // ── Aldric — Sword ────────────────────────────────────────────────────
  sword_slash: {
    id: 'sword_slash', name: 'Sword Slash', icon: '⚔️',
    tree: SkillType.SWORD, tags: [AbilityTag.MELEE],
    ranks: [
      { rank: 1, cooldown: 2.5, cost: null, damage: 18, damageType: 'slashing', levelRequired: 1, autoLearn: true },
      { rank: 2, cooldown: 2.5, cost: null, damage: 26, damageType: 'slashing', levelRequired: 4, autoLearn: true },
      { rank: 3, cooldown: 2.3, cost: null, damage: 35, damageType: 'slashing', levelRequired: 8, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: rank.damageType }];
    }
  },

  rend: {
    id: 'rend', name: 'Rend', icon: '🗡️',
    tree: SkillType.SWORD, tags: [AbilityTag.MELEE],
    ranks: [
      { rank: 1, cooldown: 5.0, cost: null, damage: 14, stacks: 1, duration: 6, levelRequired: 1, autoLearn: true },
      { rank: 2, cooldown: 4.8, cost: null, damage: 20, stacks: 2, duration: 6, levelRequired: 4, autoLearn: true },
      { rank: 3, cooldown: 4.5, cost: null, damage: 28, stacks: 3, duration: 6, levelRequired: 8, autoLearn: false },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'slashing' },
        { type: 'apply_status', target: targets[0], statusId: 'bleeding', stacks: rank.stacks, duration: rank.duration }
      ];
    }
  },

  shield_bash: {
    id: 'shield_bash', name: 'Shield Bash', icon: '🛡️',
    tree: SkillType.SHIELD, tags: [AbilityTag.MELEE],
    ranks: [
      { rank: 1, cooldown: 6.0, cost: null, damage: 10, stunDuration: 0.8, levelRequired: 1, autoLearn: true },
      { rank: 2, cooldown: 5.5, cost: null, damage: 16, stunDuration: 1.2, levelRequired: 4, autoLearn: true },
      { rank: 3, cooldown: 5.0, cost: null, damage: 22, stunDuration: 1.6, levelRequired: 8, autoLearn: true },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'bludgeoning' },
        { type: 'apply_status', target: targets[0], statusId: 'stun', stacks: 1, duration: rank.stunDuration }
      ];
    }
  },

  fortify: {
    id: 'fortify', name: 'Fortify', icon: '🏰',
    tree: SkillType.SHIELD, tags: [AbilityTag.DEFENSIVE],
    ranks: [
      { rank: 1, cooldown: 10.0, cost: null, guardStacks: 2, healHp: 0,  levelRequired: 1, autoLearn: true },
      { rank: 2, cooldown: 9.5,  cost: null, guardStacks: 3, healHp: 0,  levelRequired: 4, autoLearn: true },
      { rank: 3, cooldown: 9.0,  cost: null, guardStacks: 4, healHp: 15, levelRequired: 8, autoLearn: false },
    ],
    targeting: 'self',
    execute(caster, targets, rank) {
      const effects = [
        { type: 'apply_status', target: caster, statusId: 'guard', stacks: rank.guardStacks, duration: 12 },
        { type: 'combat_refresh', target: caster }
      ];
      if (rank.healHp > 0) effects.push({ type: 'heal', target: caster, amount: rank.healHp });
      return effects;
    }
  },

  rally: {
    id: 'rally', name: 'Rally', icon: '📯',
    tree: SkillType.TACTICS, tags: [AbilityTag.SUPPORT],
    ranks: [
      { rank: 1, cooldown: 12.0, cost: null, hasteStacks: 2, hasteDuration: 5,                levelRequired: 1, autoLearn: true },
      { rank: 2, cooldown: 11.0, cost: null, hasteStacks: 3, hasteDuration: 6,                levelRequired: 4, autoLearn: true },
      { rank: 3, cooldown: 10.0, cost: null, hasteStacks: 3, hasteDuration: 8, armorRestore: 10, levelRequired: 8, autoLearn: false },
    ],
    targeting: 'all_allies',
    execute(caster, targets, rank) {
      const effects = targets.map(t => ({
        type: 'apply_status', target: t, statusId: 'haste', stacks: rank.hasteStacks, duration: rank.hasteDuration
      }));
      if (rank.armorRestore) targets.forEach(t => effects.push({ type: 'restore_armor', target: t, amount: rank.armorRestore }));
      return effects;
    }
  },

  // ── Ysolde — Fire ─────────────────────────────────────────────────────
  ember_shot: {
    id: 'ember_shot', name: 'Ember Shot', icon: '🔥',
    tree: SkillType.FIRE, tags: [AbilityTag.RANGED],
    ranks: [
      { rank: 1, cooldown: 2.8, cost: null, damage: 20, burnChance: 0,   levelRequired: 1, autoLearn: true },
      { rank: 2, cooldown: 2.8, cost: null, damage: 28, burnChance: 0,   levelRequired: 4, autoLearn: true },
      { rank: 3, cooldown: 2.6, cost: null, damage: 38, burnChance: 0.5, levelRequired: 8, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const effects = [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: 'fire' }];
      if (rank.burnChance > 0 && Math.random() < rank.burnChance) {
        effects.push({ type: 'apply_status', target: targets[0], statusId: 'burning', stacks: 1, duration: 8 });
      }
      return effects;
    }
  },

  fireball: {
    id: 'fireball', name: 'Fireball', icon: '💥',
    tree: SkillType.FIRE, tags: [AbilityTag.RANGED],
    ranks: [
      { rank: 1, cooldown: 5.5, cost: { type: 'energy', amount: 40 }, damage: 35, splashDmg: 15, burnStacks: 0, levelRequired: 1, autoLearn: true },
      { rank: 2, cooldown: 5.2, cost: { type: 'energy', amount: 40 }, damage: 48, splashDmg: 22, burnStacks: 0, levelRequired: 4, autoLearn: true },
      { rank: 3, cooldown: 5.0, cost: { type: 'energy', amount: 40 }, damage: 65, splashDmg: 30, burnStacks: 1, levelRequired: 8, autoLearn: false },
    ],
    targeting: 'single_enemy_with_splash',
    execute(caster, targets, rank) {
      const effects = [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: 'fire' }];
      if (targets[1]) effects.push({ type: 'damage', target: targets[1], amount: rank.splashDmg, damageType: 'fire' });
      if (rank.burnStacks > 0) {
        targets.forEach(t => effects.push({ type: 'apply_status', target: t, statusId: 'burning', stacks: rank.burnStacks, duration: 8 }));
      }
      return effects;
    }
  },

  void_bolt: {
    id: 'void_bolt', name: 'Void Bolt', icon: '🌑',
    tree: SkillType.VOID, tags: [AbilityTag.RANGED],
    ranks: [
      { rank: 1, cooldown: 3.0, cost: null, damage: 18,                               levelRequired: 1, autoLearn: true },
      { rank: 2, cooldown: 3.0, cost: null, damage: 25,                               levelRequired: 4, autoLearn: true },
      { rank: 3, cooldown: 2.8, cost: null, damage: 34, slowStacks: 1, slowDuration: 3, voidExposeChance: 0.20, levelRequired: 8, autoLearn: false },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const effects = [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: 'void' }];
      if (rank.slowStacks) effects.push({ type: 'apply_status', target: targets[0], statusId: 'slow', stacks: rank.slowStacks, duration: rank.slowDuration });
      if (rank.voidExposeChance && Math.random() < rank.voidExposeChance) {
        effects.push({ type: 'apply_status', target: targets[0], statusId: 'void_exposed', stacks: 1, duration: 8 });
      }
      return effects;
    }
  },

  entropy_field: {
    id: 'entropy_field', name: 'Entropy Field', icon: '🌀',
    tree: SkillType.VOID, tags: [AbilityTag.RANGED],
    ranks: [
      { rank: 1, cooldown: 10.0, cost: { type: 'energy', amount: 15 }, slowStacks: 1, slowDuration: 5,                levelRequired: 1, autoLearn: true },
      { rank: 2, cooldown: 9.5,  cost: { type: 'energy', amount: 15 }, slowStacks: 2, slowDuration: 6,                levelRequired: 4, autoLearn: true },
      { rank: 3, cooldown: 9.0,  cost: { type: 'energy', amount: 20 }, slowStacks: 3, slowDuration: 8, threatDrain: 15, levelRequired: 8, autoLearn: false },
    ],
    targeting: 'all_enemies',
    execute(caster, targets, rank) {
      const effects = targets.map(t => ({
        type: 'apply_status', target: t, statusId: 'slow', stacks: rank.slowStacks, duration: rank.slowDuration
      }));
      if (rank.threatDrain) targets.forEach(t => effects.push({ type: 'drain_threat', target: t, amount: rank.threatDrain }));
      return effects;
    }
  },

  // ── Aldric — Flood ────────────────────────────────────────────────────
  wave_strike: {
    id: 'wave_strike', name: 'Wave Strike', icon: '🌊',
    tree: SkillType.FLOOD, tags: [AbilityTag.MELEE],
    ranks: [
      { rank: 1, cooldown: 3.0, cost: null, damage: 16, levelRequired: 1,  autoLearn: true },
      { rank: 2, cooldown: 2.8, cost: null, damage: 24, levelRequired: 5,  autoLearn: true },
      { rank: 3, cooldown: 2.6, cost: null, damage: 32, levelRequired: 10, autoLearn: true },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'bludgeoning' }
      ];
    }
  },

  tide_surge: {
    id: 'tide_surge', name: 'Tide Surge', icon: '💧',
    tree: SkillType.FLOOD, tags: [AbilityTag.MELEE],
    ranks: [
      { rank: 1, cooldown: 7.0, cost: null, damage: 10, slowStacks: 1, slowDuration: 4, levelRequired: 1,  autoLearn: true },
      { rank: 2, cooldown: 6.5, cost: null, damage: 15, slowStacks: 1, slowDuration: 5, levelRequired: 5,  autoLearn: true },
      { rank: 3, cooldown: 6.0, cost: null, damage: 20, slowStacks: 2, slowDuration: 5, levelRequired: 10, autoLearn: true },
    ],
    targeting: 'all_enemies',
    execute(caster, targets, rank) {
      return targets.flatMap(t => [
        { type: 'damage', target: t, amount: rank.damage, damageType: 'bludgeoning' },
        { type: 'apply_status', target: t, statusId: 'slow', stacks: rank.slowStacks, duration: rank.slowDuration },
      ]);
    }
  },

  drowning_grasp: {
    id: 'drowning_grasp', name: 'Drowning Grasp', icon: '🫧',
    tree: SkillType.FLOOD, tags: [AbilityTag.MELEE],
    ranks: [
      { rank: 1, cooldown: 9.0, cost: null, damage: 20, rootDuration: 2.5, levelRequired: 1,  autoLearn: true },
      { rank: 2, cooldown: 8.5, cost: null, damage: 28, rootDuration: 3.0, levelRequired: 5,  autoLearn: true },
      { rank: 3, cooldown: 8.0, cost: null, damage: 38, rootDuration: 4.0, levelRequired: 10, autoLearn: true },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'bludgeoning' },
        { type: 'apply_status', target: targets[0], statusId: 'root', stacks: 1, duration: rank.rootDuration },
      ];
    }
  },

  tidal_wave: {
    id: 'tidal_wave', name: 'Tidal Wave', icon: '🌀',
    tree: SkillType.FLOOD, tags: [AbilityTag.CAST],
    ranks: [
      { rank: 1, cooldown: 14.0, cost: null, damage: 22, shredStacks: 1, levelRequired: 1,  autoLearn: true },
      { rank: 2, cooldown: 13.0, cost: null, damage: 32, shredStacks: 2, levelRequired: 5,  autoLearn: true },
      { rank: 3, cooldown: 12.0, cost: null, damage: 44, shredStacks: 3, levelRequired: 10, autoLearn: true },
    ],
    targeting: 'all_enemies',
    execute(caster, targets, rank) {
      return targets.flatMap(t => [
        { type: 'damage', target: t, amount: rank.damage, damageType: 'bludgeoning' },
        { type: 'apply_status', target: t, statusId: 'armor_shred', stacks: rank.shredStacks, duration: 12 },
      ]);
    }
  },

  // ── Ysolde — Staff ────────────────────────────────────────────────────
  staff_strike: {
    id: 'staff_strike', name: 'Staff Strike', icon: '🪄',
    tree: SkillType.STAFF, tags: [AbilityTag.MELEE],
    ranks: [
      { rank: 1, cooldown: 2.2, cost: null, damage: 14, damageType: 'bludgeoning', levelRequired: 1,  autoLearn: true },
      { rank: 2, cooldown: 2.0, cost: null, damage: 20, damageType: 'bludgeoning', levelRequired: 5,  autoLearn: true },
      { rank: 3, cooldown: 1.8, cost: null, damage: 28, damageType: 'bludgeoning', levelRequired: 10, autoLearn: true },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: rank.damageType }];
    }
  },

  crushing_blow: {
    id: 'crushing_blow', name: 'Crushing Blow', icon: '💥',
    tree: SkillType.STAFF, tags: [AbilityTag.MELEE],
    ranks: [
      { rank: 1, cooldown: 7.0, cost: null, damage: 26, stunDuration: 0.8, levelRequired: 1,  autoLearn: true },
      { rank: 2, cooldown: 6.5, cost: null, damage: 36, stunDuration: 1.2, levelRequired: 5,  autoLearn: true },
      { rank: 3, cooldown: 6.0, cost: null, damage: 48, stunDuration: 1.6, levelRequired: 10, autoLearn: true },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'bludgeoning' },
        { type: 'apply_status', target: targets[0], statusId: 'stun', stacks: 1, duration: rank.stunDuration },
      ];
    }
  },

  stalwart_guard: {
    id: 'stalwart_guard', name: 'Stalwart Guard', icon: '🛡️',
    tree: SkillType.STAFF, tags: [AbilityTag.DEFENSIVE],
    ranks: [
      { rank: 1, cooldown: 11.0, cost: null, guardStacks: 2, levelRequired: 1,  autoLearn: true },
      { rank: 2, cooldown: 10.5, cost: null, guardStacks: 3, levelRequired: 5,  autoLearn: true },
      { rank: 3, cooldown: 10.0, cost: null, guardStacks: 4, levelRequired: 10, autoLearn: true },
    ],
    targeting: 'self',
    execute(caster, targets, rank) {
      return [
        { type: 'apply_status', target: caster, statusId: 'guard', stacks: rank.guardStacks, duration: 12 },
        { type: 'combat_refresh', target: caster },
      ];
    }
  },

  sweeping_arc: {
    id: 'sweeping_arc', name: 'Sweeping Arc', icon: '🌙',
    tree: SkillType.STAFF, tags: [AbilityTag.MELEE],
    ranks: [
      { rank: 1, cooldown: 6.0, cost: null, damage: 12, levelRequired: 1,  autoLearn: true },
      { rank: 2, cooldown: 5.5, cost: null, damage: 18, levelRequired: 5,  autoLearn: true },
      { rank: 3, cooldown: 5.0, cost: null, damage: 26, levelRequired: 10, autoLearn: true },
    ],
    targeting: 'all_player_front',
    execute(caster, targets, rank) {
      return targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: 'bludgeoning' }));
    }
  },

  // ── Enemies ───────────────────────────────────────────────────────────
  heavy_swing: {
    id: 'heavy_swing', name: 'Heavy Swing', icon: '⚔️',
    tags: [AbilityTag.MELEE],
    ranks: [{ rank: 1, cooldown: 3.2, cost: null, damage: 22, levelRequired: 1, autoLearn: true }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: 'slashing' }];
    }
  },

  bash: {
    id: 'bash', name: 'Bash', icon: '💢',
    tags: [AbilityTag.MELEE],
    ranks: [{ rank: 1, cooldown: 8.0, cost: null, damage: 12, stunDuration: 0.6, levelRequired: 1, autoLearn: true }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'bludgeoning' },
        { type: 'apply_status', target: targets[0], statusId: 'stun', stacks: 1, duration: rank.stunDuration }
      ];
    }
  },

  bolt_shot: {
    id: 'bolt_shot', name: 'Bolt Shot', icon: '🏹',
    tags: [AbilityTag.RANGED],
    ranks: [{ rank: 1, cooldown: 2.8, cost: null, damage: 18, levelRequired: 1, autoLearn: true }],
    targeting: 'single_player_any',
    execute(caster, targets, rank) {
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: 'piercing' }];
    }
  },

  suppressing_fire: {
    id: 'suppressing_fire', name: 'Suppressing Fire', icon: '🎯',
    tags: [AbilityTag.RANGED],
    ranks: [{ rank: 1, cooldown: 9.0, cost: null, damage: 10, levelRequired: 1, autoLearn: true }],
    targeting: 'all_player_front',
    execute(caster, targets, rank) {
      return targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: 'piercing' }));
    }
  },

  gnaw: {
    id: 'gnaw', name: 'Gnaw', icon: '🐀',
    tags: [AbilityTag.MELEE],
    ranks: [{ rank: 1, cooldown: 1.8, cost: null, damage: 8, levelRequired: 1, autoLearn: true }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'piercing' },
        { type: 'apply_status', target: targets[0], statusId: 'bleeding', stacks: 1, duration: 6 }
      ];
    }
  },

  swarm: {
    id: 'swarm', name: 'Swarm', icon: '💨',
    tags: [AbilityTag.MELEE],
    ranks: [{ rank: 1, cooldown: 5.0, cost: null, damage: 5, levelRequired: 1, autoLearn: true }],
    targeting: 'all_player_front',
    execute(caster, targets, rank) {
      return targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: 'piercing' }));
    }
  },

  hammer_blow: {
    id: 'hammer_blow', name: 'Hammer Blow', icon: '🔨',
    tags: [AbilityTag.MELEE],
    ranks: [{ rank: 1, cooldown: 4.0, cost: null, damage: 28, stunDuration: 0.8, levelRequired: 1, autoLearn: true }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'bludgeoning' },
        { type: 'apply_status', target: targets[0], statusId: 'stun', stacks: 1, duration: rank.stunDuration }
      ];
    }
  },

  shield_slam_enemy: {
    id: 'shield_slam_enemy', name: 'Shield Slam', icon: '🛡️',
    tags: [AbilityTag.MELEE],
    ranks: [{ rank: 1, cooldown: 7.0, cost: null, damage: 18, guardStacks: 2, levelRequired: 1, autoLearn: true }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'bludgeoning' },
        { type: 'apply_status', target: caster, statusId: 'guard', stacks: rank.guardStacks, duration: 12 }
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
        { type: 'apply_status', target: caster, statusId: 'guard', stacks: rank.guardStacks, duration: 12 },
        { type: 'combat_refresh', target: caster }
      ];
    }
  },

  command_strike: {
    id: 'command_strike', name: 'Command Strike', icon: '⚔️',
    tags: [AbilityTag.MELEE],
    ranks: [
      { rank: 1, cooldown: 3.0, cost: null, damage: 32, levelRequired: 1, autoLearn: true },
      { rank: 2, cooldown: 3.0, cost: null, damage: 42, levelRequired: 5, autoLearn: true }, // Phase 2
    ],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: 'slashing' }];
    }
  },

  waterlogged_roar: {
    id: 'waterlogged_roar', name: 'Waterlogged Roar', icon: '😤',
    tags: [AbilityTag.CAST],
    ranks: [{ rank: 1, cooldown: 12.0, cost: null, slowStacks: 2, slowDuration: 4, selfThreat: 2, levelRequired: 1, autoLearn: true }],
    targeting: 'all_players',
    execute(caster, targets, rank) {
      const effects = targets.map(t => ({
        type: 'apply_status', target: t, statusId: 'slow', stacks: rank.slowStacks, duration: rank.slowDuration
      }));
      effects.push({ type: 'gain_threat', target: caster, amount: rank.selfThreat });
      return effects;
    }
  },

  choking_grip: {
    id: 'choking_grip', name: 'Choking Grip', icon: '✊',
    tags: [AbilityTag.MELEE],
    ranks: [{ rank: 1, cooldown: 9.0, cost: null, damage: 20, rootDuration: 3.0, levelRequired: 1, autoLearn: true }],
    targeting: 'single_player_any',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'bludgeoning' },
        { type: 'apply_status', target: targets[0], statusId: 'root', stacks: 1, duration: rank.rootDuration }
      ];
    }
  },

  sergeants_will: {
    id: 'sergeants_will', name: "Sergeant's Will", icon: '💪',
    tags: [AbilityTag.CAST],
    ranks: [{ rank: 1, cooldown: 10.0, cost: null, hasteStacks: 2, hasteDuration: 6, levelRequired: 1, autoLearn: true }],
    targeting: 'self',
    execute(caster, targets, rank) {
      return [{ type: 'apply_status', target: caster, statusId: 'haste', stacks: rank.hasteStacks, duration: rank.hasteDuration }];
    }
  },
};
