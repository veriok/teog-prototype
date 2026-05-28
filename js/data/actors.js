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
    specialAttackId: 'desperate_flail',
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
    specialAttackId: 'desperate_flail',
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
    specialAttackId: 'headshot',
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
    specialAttackId: 'wardens_wrath',
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
    specialAttackId: 'rising_tide',
    dropTable: [
      { definitionId: 'sergeant_medallion', chance: 1.00, unique: true },
      { definitionId: 'drowned_sword',      chance: 0.80, unique: false },
    ],
    phase2SpecialAttackId: 'deep_takes_all',
  },
};
