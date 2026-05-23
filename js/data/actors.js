// js/data/actors.js

export const actors = {

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
    },
    dropTable: [
      { definitionId: 'drowned_sword',  chance: 0.50, unique: false },
      { definitionId: 'drowned_shield', chance: 0.30, unique: false },
    ],
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
    },
    dropTable: [
      { definitionId: 'drowned_sword',  chance: 0.50, unique: false },
      { definitionId: 'drowned_shield', chance: 0.30, unique: false },
    ],
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
    },
    dropTable: [
      { definitionId: 'drowned_sword', chance: 0.25, unique: false },
    ],
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
    },
    dropTable: [
      { definitionId: 'warden_helm', chance: 0.40, unique: false },
    ],
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
    dropTable: [
      { definitionId: 'sergeant_medallion', chance: 1.00, unique: true },
      { definitionId: 'drowned_sword',      chance: 0.80, unique: false },
    ],
    phase2SpecialAttack: {
      name: 'The Deep Takes All', icon: '🌑',
      execute(caster, targets) {
        const effects = targets.map(t => ({ type: 'damage', target: t, amount: 70, damageType: 'true', source: 'The Deep Takes All' }));
        targets.forEach(t => effects.push({ type: 'apply_status', target: t, statusId: 'slow', stacks: 3, duration: 6 }));
        return effects;
      }
    }
  },
};
