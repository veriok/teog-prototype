// js/data.js — Echoes of Germolles: MVP Game Data

const DATA = {

  // ── Status Effect Definitions ──────────────────────────────────────────
  statuses: {
    bleeding: {
      id: 'bleeding', label: 'Bleed', icon: '🩸',
      cssClass: 'status-bleeding',
      stackMode: 'stack', maxStacks: 5,
      tickInterval: 1.0,
      tickEffect: (actor, stacks) => ({ type: 'damage', amount: 3 * stacks, damageType: 'physical', source: 'Bleeding' }),
      tooltip: 'Deals 3 physical damage per stack each second.'
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
    }
  },

  // ── Ability Definitions ────────────────────────────────────────────────
  abilities: {

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
        { rank: 1, cooldown: 5.5, cost: null,     primaryDmg: 35, splashDmg: 15, burnStacks: 0 },
        { rank: 2, cooldown: 5.2, cost: null,     primaryDmg: 48, splashDmg: 22, burnStacks: 0 },
        { rank: 3, cooldown: 5.0, cost: { type: 'energy', amount: 15 }, primaryDmg: 65, splashDmg: 30, burnStacks: 1 },
      ],
      targeting: 'single_enemy_with_splash',
      execute(caster, targets, rank) {
        const effects = [{ type: 'damage', target: targets[0], amount: rank.primaryDmg, damageType: 'fire' }];
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
        { rank: 1, cooldown: 3.0, cost: null, damage: 18, armorPierce: 0.5 },
        { rank: 2, cooldown: 3.0, cost: null, damage: 25, armorPierce: 0.5 },
        { rank: 3, cooldown: 2.8, cost: null, damage: 34, armorPierce: 0.6, slowStacks: 1, slowDuration: 3 },
      ],
      targeting: 'single_enemy_any',
      execute(caster, targets, rank) {
        const effects = [{ type: 'damage', target: targets[0], amount: rank.damage, damageType: 'magic', armorPierce: rank.armorPierce }];
        if (rank.slowStacks) effects.push({ type: 'apply_status', target: targets[0], statusId: 'slow', stacks: rank.slowStacks, duration: rank.slowDuration });
        return effects;
      }
    },

    entropy_field: {
      id: 'entropy_field', name: 'Entropy Field', icon: '🌀',
      tree: 'void', tag: 'ranged',
      ranks: [
        { rank: 1, cooldown: 10.0, cost: null,                       slowStacks: 2, slowDuration: 5 },
        { rank: 2, cooldown: 9.5,  cost: { type: 'energy', amount: 15 }, slowStacks: 3, slowDuration: 6 },
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
  },

  // ── Actor Definitions ──────────────────────────────────────────────────
  actors: {

    aldric: {
      id: 'aldric', name: 'Sir Aldric', role: 'Knight', icon: '🛡️',
      portrait: 'assets/actors/aldric.png',
      subtype: 'paragon', row: 'front',
      baseHP: 160, baseArmor: 80,
      resource: { type: 'rage', max: 100, current: 0, regenPerSec: 0, decayPerSec: 2 },
      globalSpeed: 1.0,
      abilities: [
        { abilityId: 'sword_slash',  rank: 1 },
        { abilityId: 'rend',         rank: 1 },
        { abilityId: 'shield_bash',  rank: 1 },
        { abilityId: 'fortify',      rank: 1 },
      ]
    },

    ysolde: {
      id: 'ysolde', name: 'Ysolde', role: 'Mage', icon: '🔮',
      portrait: 'assets/actors/ysolde.png',
      subtype: 'paragon', row: 'back',
      baseHP: 95, baseArmor: 30,
      resource: { type: 'energy', max: 100, current: 100, regenPerSec: 8, decayPerSec: 0 },
      globalSpeed: 1.0,
      abilities: [
        { abilityId: 'ember_shot',    rank: 1 },
        { abilityId: 'fireball',      rank: 1 },
        { abilityId: 'void_bolt',     rank: 1 },
        { abilityId: 'entropy_field', rank: 1 },
      ]
    },

    drowned_soldier_1: {
      id: 'drowned_soldier_1', name: 'Drowned Soldier', role: 'Infantry', icon: '💀',
      portrait: 'assets/actors/drowned_soldier.png',
      subtype: 'enemy', row: 'front', level: 2,
      baseHP: 85, baseArmor: 40,
      resource: { type: 'threat', max: 100, current: 0 },
      globalSpeed: 0.85,
      abilities: [
        { abilityId: 'heavy_swing', rank: 1 },
        { abilityId: 'bash',        rank: 1 },
      ],
      specialAttack: {
        name: 'Desperate Flail', icon: '💥',
        execute(caster, targets) {
          const t = targets[Math.floor(Math.random() * targets.length)];
          return [{ type: 'damage', target: t, amount: 35, damageType: 'physical', ignoresGuard: true, source: 'Desperate Flail' }];
        }
      }
    },

    drowned_soldier_2: {
      id: 'drowned_soldier_2', name: 'Drowned Soldier', role: 'Infantry', icon: '💀',
      portrait: 'assets/actors/drowned_soldier.png',
      subtype: 'enemy', row: 'front', level: 2,
      baseHP: 85, baseArmor: 40,
      resource: { type: 'threat', max: 100, current: 0 },
      globalSpeed: 0.85,
      abilities: [
        { abilityId: 'heavy_swing', rank: 1 },
        { abilityId: 'bash',        rank: 1 },
      ],
      specialAttack: {
        name: 'Desperate Flail', icon: '💥',
        execute(caster, targets) {
          const t = targets[Math.floor(Math.random() * targets.length)];
          return [{ type: 'damage', target: t, amount: 35, damageType: 'physical', ignoresGuard: true, source: 'Desperate Flail' }];
        }
      }
    },

    siege_crossbowman: {
      id: 'siege_crossbowman', name: 'Siege Crossbowman', role: 'Ranged', icon: '🏹',
      portrait: 'assets/actors/siege_crossbowman.png',
      subtype: 'enemy', row: 'back', level: 2,
      baseHP: 55, baseArmor: 15,
      resource: { type: 'threat', max: 100, current: 0 },
      globalSpeed: 1.05,
      abilities: [
        { abilityId: 'bolt_shot',        rank: 1 },
        { abilityId: 'suppressing_fire', rank: 1 },
      ],
      specialAttack: {
        name: 'Headshot', icon: '🎯',
        execute(caster, targets) {
          const t = targets[Math.floor(Math.random() * targets.length)];
          const effects = [{ type: 'damage', target: t, amount: 40, damageType: 'physical', source: 'Headshot' }];
          if (Math.random() < 0.5) effects.push({ type: 'apply_status', target: t, statusId: 'stun', stacks: 1, duration: 1.0 });
          return effects;
        }
      }
    },

    siege_warden: {
      id: 'siege_warden', name: 'Siege Warden', role: 'Elite Guard', icon: '⚔️',
      portrait: 'assets/actors/siege_warden.png',
      subtype: 'enemy', subclass: 'elite', row: 'front', level: 4,
      baseHP: 180, baseArmor: 90,
      resource: { type: 'threat', max: 100, current: 0 },
      globalSpeed: 0.80,
      abilities: [
        { abilityId: 'hammer_blow',      rank: 1 },
        { abilityId: 'shield_slam_enemy',rank: 1 },
        { abilityId: 'brace',            rank: 1 },
      ],
      specialAttack: {
        name: "Warden's Wrath", icon: '🔨',
        execute(caster, targets) {
          const maxHpTarget = targets.reduce((a, b) => a.currentHP > b.currentHP ? a : b);
          return [
            { type: 'damage', target: maxHpTarget, amount: 60, damageType: 'physical', source: "Warden's Wrath" },
            ...targets.map(t => ({ type: 'apply_status', target: t, statusId: 'slow', stacks: 2, duration: 4 }))
          ];
        }
      }
    },

    drowned_sergeant: {
      id: 'drowned_sergeant', name: 'The Drowned Sergeant', role: 'Boss', icon: '☠️',
      portrait: 'assets/actors/drowned_sergeant.png',
      subtype: 'enemy', subclass: 'boss', row: 'front', level: 6,
      baseHP: 420, baseArmor: 120,
      resource: { type: 'threat', max: 100, current: 0 },
      globalSpeed: 0.90,
      abilities: [
        { abilityId: 'command_strike',   rank: 1 },
        { abilityId: 'waterlogged_roar', rank: 1 },
        { abilityId: 'choking_grip',     rank: 1 },
      ],
      phase2Abilities: [
        { abilityId: 'command_strike',   rank: 2 },
        { abilityId: 'waterlogged_roar', rank: 1 },
        { abilityId: 'choking_grip',     rank: 1 },
        { abilityId: 'sergeants_will',   rank: 1 },
      ],
      specialAttack: {
        name: 'Rising Tide', icon: '🌊', isPhaseTransition: true,
        execute(caster, targets) {
          const effects = targets.map(t => ({ type: 'damage', target: t, amount: 45, damageType: 'physical', source: 'Rising Tide' }));
          targets.forEach(t => effects.push({ type: 'apply_status', target: t, statusId: 'bleeding', stacks: 2, duration: 8 }));
          effects.push({ type: 'restore_armor', target: caster, amount: 60 });
          return effects;
        }
      },
      phase2SpecialAttack: {
        name: 'The Deep Takes All', icon: '🌑',
        execute(caster, targets) {
          const effects = targets.map(t => ({ type: 'damage', target: t, amount: 70, damageType: 'true', source: 'The Deep Takes All' }));
          targets.forEach(t => effects.push({ type: 'apply_status', target: t, statusId: 'slow', stacks: 3, duration: 6 }));
          return effects;
        }
      }
    },
  },

  // ── Zone/Event Definitions ─────────────────────────────────────────────
  zone: {
    id: 'flooded_cellars',
    name: 'The Flooded Cellars',
    description: 'A collapsed wine cellar beneath the east wing, half-submerged in black water. Torches gutter above the waterline.',
    events: [
      {
        index: 0, type: 'fight', label: 'Patrol',
        enemies: ['drowned_soldier_1', 'drowned_soldier_2'],
        enemyRows: { front: ['drowned_soldier_1', 'drowned_soldier_2'], back: [] }
      },
      {
        index: 1, type: 'fight', label: 'Storage',
        enemies: ['drowned_soldier_1', 'siege_crossbowman'],
        enemyRows: { front: ['drowned_soldier_1'], back: ['siege_crossbowman'] }
      },
      {
        index: 2, type: 'loot', label: 'Cache',
        loot: ['Soldier\'s Shortsword (Common)', 'Iron Scraps ×2', '15 Copper Coins']
      },
      {
        index: 3, type: 'elite', label: 'Warden',
        enemies: ['siege_warden'],
        enemyRows: { front: ['siege_warden'], back: [] }
      },
      {
        index: 4, type: 'boss', label: 'Sergeant',
        enemies: ['drowned_sergeant'],
        enemyRows: { front: ['drowned_sergeant'], back: [] }
      }
    ]
  }
};
