// js/data/actors.js
import { DamageType, ResistanceKeyword } from '../enums.js';

export const actors = {

  drowned_soldier_1: {
    id: 'drowned_soldier_1', name: 'Drowned Soldier', role: 'Infantry', icon: '💀',
    portrait: 'assets/actors/drowned_soldier.png',
    subtype: 'enemy', row: 'front',
    tags: ['undead', 'humanoid'],
    baseHP: 60, baseArmor: 30,
    resource: { type: 'threat', max: 100, current: 0 },
    globalSpeed: 0.90,
    abilities: [
      { abilityId: 'heavy_swing', rank: 1 },
      { abilityId: 'bash',        rank: 1 },
    ],
    resistances: {
      [DamageType.VOID]:        ResistanceKeyword.RESISTANT,
      [DamageType.PIERCING]:    ResistanceKeyword.RESISTANT,
      [DamageType.NATURE]:      ResistanceKeyword.VULNERABLE,
      [DamageType.BLUDGEONING]: ResistanceKeyword.VULNERABLE,
    },
    specialAttack: {
      name: 'Desperate Flail', icon: '💥',
      execute(caster, targets) {
        const t = targets[Math.floor(Math.random() * targets.length)];
        return [{ type: 'damage', target: t, amount: 25, damageType: 'bludgeoning', ignoresGuard: true, source: 'Desperate Flail' }];
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
    subtype: 'enemy', row: 'front',
    tags: ['undead', 'humanoid'],
    baseHP: 60, baseArmor: 30,
    resource: { type: 'threat', max: 100, current: 0 },
    globalSpeed: 0.90,
    abilities: [
      { abilityId: 'heavy_swing', rank: 1 },
      { abilityId: 'bash',        rank: 1 },
    ],
    resistances: {
      [DamageType.VOID]:        ResistanceKeyword.RESISTANT,
      [DamageType.PIERCING]:    ResistanceKeyword.RESISTANT,
      [DamageType.NATURE]:      ResistanceKeyword.VULNERABLE,
      [DamageType.BLUDGEONING]: ResistanceKeyword.VULNERABLE,
    },
    specialAttack: {
      name: 'Desperate Flail', icon: '💥',
      execute(caster, targets) {
        const t = targets[Math.floor(Math.random() * targets.length)];
        return [{ type: 'damage', target: t, amount: 25, damageType: 'bludgeoning', ignoresGuard: true, source: 'Desperate Flail' }];
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
    subtype: 'enemy', row: 'back',
    tags: ['undead', 'humanoid'],
    baseHP: 50, baseArmor: 25,
    resource: { type: 'threat', max: 100, current: 0 },
    globalSpeed: 1.00,
    abilities: [
      { abilityId: 'bolt_shot',        rank: 1 },
      { abilityId: 'suppressing_fire', rank: 1 },
    ],
    resistances: {
      [DamageType.VOID]:        ResistanceKeyword.RESISTANT,
      [DamageType.PIERCING]:    ResistanceKeyword.RESISTANT,
      [DamageType.NATURE]:      ResistanceKeyword.VULNERABLE,
      [DamageType.BLUDGEONING]: ResistanceKeyword.VULNERABLE,
    },
    specialAttack: {
      name: 'Headshot', icon: '🎯',
      execute(caster, targets) {
        const t = targets[Math.floor(Math.random() * targets.length)];
        const effects = [{ type: 'damage', target: t, amount: 35, damageType: 'piercing', source: 'Headshot' }];
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
    subtype: 'enemy', subclass: 'elite', row: 'front', levelAdjustment: 1,
    tags: ['undead', 'humanoid'],
    baseHP: 80, baseArmor: 45,
    resource: { type: 'threat', max: 100, current: 0 },
    globalSpeed: 0.80,
    abilities: [
      { abilityId: 'hammer_blow',      rank: 1 },
      { abilityId: 'shield_slam_enemy',rank: 1 },
      { abilityId: 'brace',            rank: 1 },
    ],
    resistances: {
      [DamageType.VOID]:        ResistanceKeyword.RESISTANT,
      [DamageType.PIERCING]:    ResistanceKeyword.RESISTANT,
      [DamageType.NATURE]:      ResistanceKeyword.VULNERABLE,
      [DamageType.BLUDGEONING]: ResistanceKeyword.VULNERABLE,
    },
    specialAttack: {
      name: "Warden's Wrath", icon: '🔨',
      execute(caster, targets) {
        const maxHpTarget = targets.reduce((a, b) => a.currentHP > b.currentHP ? a : b);
        return [
          { type: 'damage', target: maxHpTarget, amount: 45, damageType: 'bludgeoning', source: "Warden's Wrath" },
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
    subtype: 'enemy', subclass: 'boss', row: 'front', levelAdjustment: 2,
    tags: ['undead', 'humanoid'],
    baseHP: 135, baseArmor: 60,
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
    resistances: {
      [DamageType.VOID]:        ResistanceKeyword.RESISTANT,
      [DamageType.PIERCING]:    ResistanceKeyword.RESISTANT,
      [DamageType.NATURE]:      ResistanceKeyword.VULNERABLE,
      [DamageType.BLUDGEONING]: ResistanceKeyword.VULNERABLE,
    },
    specialAttack: {
      name: 'Rising Tide', icon: '🌊', isPhaseTransition: true,
      execute(caster, targets) {
        const effects = targets.map(t => ({ type: 'damage', target: t, amount: 35, damageType: 'bludgeoning', source: 'Rising Tide' }));
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
        const effects = targets.map(t => ({ type: 'damage', target: t, amount: 50, damageType: 'true', source: 'The Deep Takes All' }));
        targets.forEach(t => effects.push({ type: 'apply_status', target: t, statusId: 'slow', stacks: 3, duration: 6 }));
        return effects;
      }
    }
  },
};
