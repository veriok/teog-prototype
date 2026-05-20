// js/data/abilities.js

export const abilities = {

  // ── Aldric — Sword ────────────────────────────────────────────────────
  sword_slash: {
    id: 'sword_slash', name: 'Sword Slash', icon: '⚔️',
    tree: 'sword', tag: 'melee',
    ranks: [
      { rank: 1, cooldown: 2.5, cost: null, damage: 18, damageType: 'physical' },
      { rank: 2, cooldown: 2.5, cost: null, damage: 26, damageType: 'physical' },
      { rank: 3, cooldown: 2.3, cost: null, damage: 35, damageType: 'physical' },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: rank.damageType }];
    }
  },

  rend: {
    id: 'rend', name: 'Rend', icon: '🗡️',
    tree: 'sword', tag: 'melee',
    ranks: [
      { rank: 1, cooldown: 5.0, cost: null, damage: 14, stacks: 1, duration: 6 },
      { rank: 2, cooldown: 4.8, cost: null, damage: 20, stacks: 2, duration: 6 },
      { rank: 3, cooldown: 4.5, cost: null, damage: 28, stacks: 3, duration: 6 },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'physical' },
        { type: 'apply_status', target: targets[0], statusId: 'bleeding', stacks: rank.stacks, duration: rank.duration }
      ];
    }
  },

  shield_bash: {
    id: 'shield_bash', name: 'Shield Bash', icon: '🛡️',
    tree: 'shield', tag: 'melee',
    ranks: [
      { rank: 1, cooldown: 6.0, cost: null, damage: 10, stunDuration: 0.8 },
      { rank: 2, cooldown: 5.5, cost: null, damage: 16, stunDuration: 1.2 },
      { rank: 3, cooldown: 5.0, cost: null, damage: 22, stunDuration: 1.6 },
    ],
    targeting: 'single_enemy_front',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'physical' },
        { type: 'apply_status', target: targets[0], statusId: 'stun', stacks: 1, duration: rank.stunDuration }
      ];
    }
  },

  fortify: {
    id: 'fortify', name: 'Fortify', icon: '🏰',
    tree: 'shield', tag: 'defensive',
    ranks: [
      { rank: 1, cooldown: 10.0, cost: null, guardStacks: 2, healHp: 0 },
      { rank: 2, cooldown: 9.5,  cost: null, guardStacks: 3, healHp: 0 },
      { rank: 3, cooldown: 9.0,  cost: null, guardStacks: 4, healHp: 15 },
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
    tree: 'tactics', tag: 'support',
    ranks: [
      { rank: 1, cooldown: 12.0, cost: null, hasteStacks: 2, hasteDuration: 5 },
      { rank: 2, cooldown: 11.0, cost: null, hasteStacks: 3, hasteDuration: 6 },
      { rank: 3, cooldown: 10.0, cost: null, hasteStacks: 3, hasteDuration: 8, armorRestore: 10 },
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
    tree: 'fire', tag: 'ranged',
    ranks: [
      { rank: 1, cooldown: 2.8, cost: null, damage: 20, burnChance: 0 },
      { rank: 2, cooldown: 2.8, cost: null, damage: 28, burnChance: 0 },
      { rank: 3, cooldown: 2.6, cost: null, damage: 38, burnChance: 0.5 },
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
    tree: 'fire', tag: 'ranged',
    ranks: [
      { rank: 1, cooldown: 5.5, cost: { type: 'energy', amount: 40 }, damage: 35, splashDmg: 15, burnStacks: 0 },
      { rank: 2, cooldown: 5.2, cost: { type: 'energy', amount: 40 }, damage: 48, splashDmg: 22, burnStacks: 0 },
      { rank: 3, cooldown: 5.0, cost: { type: 'energy', amount: 40 }, damage: 65, splashDmg: 30, burnStacks: 1 },
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
    tree: 'void', tag: 'ranged',
    ranks: [
      { rank: 1, cooldown: 3.0, cost: null, damage: 18 },
      { rank: 2, cooldown: 3.0, cost: null, damage: 25 },
      { rank: 3, cooldown: 2.8, cost: null, damage: 34, slowStacks: 1, slowDuration: 3 },
    ],
    targeting: 'single_enemy_any',
    execute(caster, targets, rank) {
      const effects = [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: 'magic'}];
      if (rank.slowStacks) effects.push({ type: 'apply_status', target: targets[0], statusId: 'slow', stacks: rank.slowStacks, duration: rank.slowDuration });
      return effects;
    }
  },

  entropy_field: {
    id: 'entropy_field', name: 'Entropy Field', icon: '🌀',
    tree: 'void', tag: 'ranged',
    ranks: [
      { rank: 1, cooldown: 10.0, cost: { type: 'energy', amount: 15 }, slowStacks: 1, slowDuration: 5 },
      { rank: 2, cooldown: 9.5,  cost: { type: 'energy', amount: 15 }, slowStacks: 2, slowDuration: 6 },
      { rank: 3, cooldown: 9.0,  cost: { type: 'energy', amount: 20 }, slowStacks: 3, slowDuration: 8, threatDrain: 15 },
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

  // ── Enemies ───────────────────────────────────────────────────────────
  heavy_swing: {
    id: 'heavy_swing', name: 'Heavy Swing', icon: '⚔️',
    tag: 'melee',
    ranks: [{ rank: 1, cooldown: 3.2, cost: null, damage: 22 }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: 'physical' }];
    }
  },

  bash: {
    id: 'bash', name: 'Bash', icon: '💢',
    tag: 'melee',
    ranks: [{ rank: 1, cooldown: 8.0, cost: null, damage: 12, stunDuration: 0.6 }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'physical' },
        { type: 'apply_status', target: targets[0], statusId: 'stun', stacks: 1, duration: rank.stunDuration }
      ];
    }
  },

  bolt_shot: {
    id: 'bolt_shot', name: 'Bolt Shot', icon: '🏹',
    tag: 'ranged',
    ranks: [{ rank: 1, cooldown: 2.8, cost: null, damage: 18 }],
    targeting: 'single_player_any',
    execute(caster, targets, rank) {
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: 'physical' }];
    }
  },

  suppressing_fire: {
    id: 'suppressing_fire', name: 'Suppressing Fire', icon: '🎯',
    tag: 'ranged',
    ranks: [{ rank: 1, cooldown: 9.0, cost: null, damage: 10 }],
    targeting: 'all_player_front',
    execute(caster, targets, rank) {
      return targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: 'physical' }));
    }
  },

  gnaw: {
    id: 'gnaw', name: 'Gnaw', icon: '🐀',
    tag: 'melee',
    ranks: [{ rank: 1, cooldown: 1.8, cost: null, damage: 8 }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'physical' },
        { type: 'apply_status', target: targets[0], statusId: 'bleeding', stacks: 1, duration: 6 }
      ];
    }
  },

  swarm: {
    id: 'swarm', name: 'Swarm', icon: '💨',
    tag: 'melee',
    ranks: [{ rank: 1, cooldown: 5.0, cost: null, damage: 5 }],
    targeting: 'all_player_front',
    execute(caster, targets, rank) {
      return targets.map(t => ({ type: 'damage', target: t, amount: rank.damage, damageType: 'physical' }));
    }
  },

  hammer_blow: {
    id: 'hammer_blow', name: 'Hammer Blow', icon: '🔨',
    tag: 'melee',
    ranks: [{ rank: 1, cooldown: 4.0, cost: null, damage: 28, stunDuration: 0.8 }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'physical' },
        { type: 'apply_status', target: targets[0], statusId: 'stun', stacks: 1, duration: rank.stunDuration }
      ];
    }
  },

  shield_slam_enemy: {
    id: 'shield_slam_enemy', name: 'Shield Slam', icon: '🛡️',
    tag: 'melee',
    ranks: [{ rank: 1, cooldown: 7.0, cost: null, damage: 18, guardStacks: 2 }],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'physical' },
        { type: 'apply_status', target: caster, statusId: 'guard', stacks: rank.guardStacks, duration: 12 }
      ];
    }
  },

  brace: {
    id: 'brace', name: 'Brace', icon: '🏰',
    tag: 'defensive',
    ranks: [{ rank: 1, cooldown: 12.0, cost: null, guardStacks: 3 }],
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
    tag: 'melee',
    ranks: [
      { rank: 1, cooldown: 3.0, cost: null, damage: 32 },
      { rank: 2, cooldown: 3.0, cost: null, damage: 42 }, // Phase 2
    ],
    targeting: 'single_player_front',
    execute(caster, targets, rank) {
      return [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: 'physical' }];
    }
  },

  waterlogged_roar: {
    id: 'waterlogged_roar', name: 'Waterlogged Roar', icon: '😤',
    tag: 'cast',
    ranks: [{ rank: 1, cooldown: 12.0, cost: null, slowStacks: 2, slowDuration: 4, selfThreat: 2 }],
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
    tag: 'melee',
    ranks: [{ rank: 1, cooldown: 9.0, cost: null, damage: 20, rootDuration: 3.0 }],
    targeting: 'single_player_any',
    execute(caster, targets, rank) {
      return [
        { type: 'damage', target: targets[0], amount: rank.damage, damageType: 'physical' },
        { type: 'apply_status', target: targets[0], statusId: 'root', stacks: 1, duration: rank.rootDuration }
      ];
    }
  },

  sergeants_will: {
    id: 'sergeants_will', name: "Sergeant's Will", icon: '💪',
    tag: 'cast',
    ranks: [{ rank: 1, cooldown: 10.0, cost: null, hasteStacks: 2, hasteDuration: 6 }],
    targeting: 'self',
    execute(caster, targets, rank) {
      return [{ type: 'apply_status', target: caster, statusId: 'haste', stacks: rank.hasteStacks, duration: rank.hasteDuration }];
    }
  },
};
