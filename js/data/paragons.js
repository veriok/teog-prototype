// js/data/paragons.js
//
// All playable paragon definitions, split from actors.js.
// Each definition may include:
//   unlockedByDefault  — true = available on first launch; false = must be earned
//   unlockCondition    — { trigger, ...params } evaluated by Game._checkParagonUnlocks()
//   unlockCinematicId  — cinematic played the moment the unlock condition fires
//
// Merged into DATA.actors in data/index.js so all DATA.actors[id] lookups
// remain valid. Also exposed separately as DATA.paragons for unlock checks and
// future bark / cinematic-on-event data.

export const paragons = {

  godefroy: {
    id: 'godefroy', name: 'Sir Godefroy', role: 'Knight', icon: '🛡️',
    portrait: 'assets/actors/godefroy.png',
    bio: 'A knight answering Yolande\u2019s desperate plea for defenders. He remembers long roads, rain, and a duty to protect the castle.',
    subtype: 'paragon', row: 'front',
    tags: ['humanoid'],
    skillTypes: ['sword', 'shield', 'flood'],
    baseHP: 140, baseArmor: 0,
      resource: { type: 'resolve', max: 250, current: 0, regenPerSec: 0, decayPerSec: 0 },
    globalSpeed: 1.0,
    abilities: [
      { abilityId: 'sword_slash', rank: 1 },
      { abilityId: 'shield_bash', rank: 1 },
      { abilityId: 'wave_strike', rank: 1 },
    ],
    unlockedByDefault: true,
  },

  lucile: {
    id: 'lucile', name: 'Lucile', role: 'Raven Scholar', icon: '🌿',
    portrait: 'assets/actors/lucile.png',
    bio: 'A young physician and natural philosopher who arrived at the castle alone during heavy rain. She studies the curse as if it were a disease process, cataloguing symptoms no sane person would wish to understand.',
    subtype: 'paragon', row: 'back',
    tags: ['humanoid'],
    skillTypes: ['staff', 'alchemy', 'void'],
    baseHP: 100, baseArmor: 0,
    resource: { type: 'energy', max: 100, current: 100, regenPerSec: 8, decayPerSec: 0 },
    globalSpeed: 1.0,
    abilities: [
      { abilityId: 'staff_strike', rank: 1 },
      { abilityId: 'toss_vial',    rank: 1 },
      { abilityId: 'void_bolt',    rank: 1 },
    ],
    unlockedByDefault:  false,
    unlockCondition:    { trigger: 'defeat_count', count: 3 },
    unlockCinematicId:  'lucile_unlock',
  },

  harrowed_saint: {
    id: 'harrowed_saint', name: 'Harrowed Saint', role: 'Penitent Saint', icon: '⛓️',
    portrait: 'assets/actors/harrowed_saint.png',
    bio: 'A wandering penitent accompanying burial parties through plague villages and battlefields. He claims no sainthood, yet the dead often quiet near him.',
    subtype: 'paragon', row: 'front',
    tags: ['humanoid'],
    skillTypes: ['mace', 'holy', 'shield'],
    baseHP: 120, baseArmor: 0,
    resource: { type: 'rage', max: 100, current: 0, regenPerSec: 0, decayPerSec: 2 },
    globalSpeed: 1.0,
    abilities: [
      { abilityId: 'mace_strike',  rank: 1 },
      { abilityId: 'smite',        rank: 1 },
      { abilityId: 'shield_bash',  rank: 1 },
    ],
    unlockedByDefault:  false,
    unlockCondition:    { trigger: 'zone_conquered', locationId: 'flooded_cellars' }, // TODO: swap to 'chapel_of_ash'
    unlockCinematicId:  'harrowed_saint_unlock',
  },

  far_knight: {
    id: 'far_knight', name: 'The Far-Knight', role: 'Hunter', icon: '🏹',
    portrait: 'assets/actors/far_knight.png',
    bio: 'A wandering hedge knight claiming service to no lord still living. He navigates forests and drowned roads others cannot cross safely.',
    subtype: 'paragon', row: 'front',
    tags: ['humanoid'],
    skillTypes: ['sword', 'bow', 'glamour'],
    baseHP: 110, baseArmor: 0,
      resource: { type: 'rage', max: 100, current: 0, regenPerSec: 0, decayPerSec: 2 },
    globalSpeed: 1.0,
    abilities: [
      { abilityId: '???', rank: 1 },
      { abilityId: '???', rank: 1 },
      { abilityId: '???', rank: 1 },
    ],
    unlockedByDefault: false,
  },

  mercer_widow: {
    id: 'mercer_widow', name: 'Ysabeau, the Mercer Widow', role: 'Mercenary', icon: '🗡️',
    portrait: 'assets/actors/mercer_widow.png',
    bio: 'A caravan widow and former river trader who continues moving supplies through roads abandoned by sane merchants. She knows smugglers\u2019 routes, siege paths, and forgotten crossings.',
    subtype: 'paragon', row: 'back',
    tags: ['humanoid'],
    skillTypes: ['dagger', 'bow', 'alchemy'],
    baseHP: 100, baseArmor: 0,
    resource: { type: 'energy', max: 100, current: 100, regenPerSec: 8, decayPerSec: 0 },
    globalSpeed: 1.0,
    abilities: [
      { abilityId: '???', rank: 1 },
      { abilityId: '???', rank: 1 },
      { abilityId: '???', rank: 1 },
    ],
    unlockedByDefault: false,
  },

  bishop_sevrault: {
    id: 'bishop_sevrault', name: 'Bishop Sevrault', role: 'Bishop', icon: '💀',
    portrait: 'assets/actors/bishop_sevrault.png',
    bio: 'Once an ambitious cleric attached to the ducal court, Sevrault became obsessed with the theological implications of improper death after the flood.',
    subtype: 'paragon', row: 'back',
    tags: ['humanoid'],
    skillTypes: ['mace', 'necromancy', 'fire'],
    baseHP: 90, baseArmor: 0,
    resource: { type: 'energy', max: 100, current: 100, regenPerSec: 8, decayPerSec: 0 },
    globalSpeed: 1.0,
    abilities: [
      { abilityId: '???', rank: 1 },
      { abilityId: '???', rank: 1 },
      { abilityId: '???', rank: 1 },
    ],
    unlockedByDefault: false,
  },

};
