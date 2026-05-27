// js/data/locations.js

import { EventType, Currency } from '../enums.js';

export const locations = [
  {
    id: 'flooded_cellars',
    name: 'The Flooded Cellars',
    description: 'A collapsed wine cellar beneath the east wing, half-submerged in black water. Torches gutter above the waterline.',
    icon: 'assets/locations/unknown.png',
    level: 1,
    mapX: 50, mapY: 51,
    combatMods: [],

    // ── Random event resolution pool ────────────────────────────────────
    // When a RANDOM node is entered, one entry is chosen by weighted roll.
    // maxPerRun: if set, the event type can only be resolved that many times per run.
    // composition: overrides the default front/back slot count for combat events.
    // requirements: standard requirement array; entry is excluded if it fails.
    randomEventTable: [
      {
        type: EventType.FIGHT, weight: 5,
        composition: { front: { min: 1, max: 2 }, back: { min: 0, max: 1 } },
      },
      {
        type: EventType.LOOT, weight: 2, maxPerRun: 1,
        loot: [
          { type: 'item',     definitionId: 'drowned_sword', chance: 0.55, unique: false },
          { type: 'currency', currency: Currency.SOULS,      chance: 1.0,  min: 3, max: 10 },
        ],
      },
    ],

    // ── Enemy spawn pool for random combat events ────────────────────────
    // preferredRow: 'front' | 'back' — used to fill the appropriate row first.
    // weight: relative probability of being chosen.
    enemyPool: [
      { actorId: 'drowned_soldier_1', weight: 5, preferredRow: 'front' },
      { actorId: 'drowned_soldier_2', weight: 5, preferredRow: 'front' },
      { actorId: 'siege_crossbowman', weight: 3, preferredRow: 'back'  },
    ],

    events: [
      // Fixed — always the opening skirmish.
      {
        index: 0, type: EventType.FIGHT, label: 'Patrol',
        enemies: ['drowned_soldier_1'],
        enemyRows: { front: ['drowned_soldier_1'], back: [] },
      },
      { index: 1, type: EventType.RANDOM },
      { index: 2, type: EventType.RANDOM },
      {
        index: 3, type: EventType.ELITE, label: 'Warden',
        enemies: ['siege_warden'],
        enemyRows: { front: ['siege_warden'], back: [] },
      },
      {
        index: 4, type: EventType.REST_SPOT, label: 'Waterline Alcove',
        loreText: 'A dry ledge above the flood. Someone sheltered here before - empty ration tins, a guttered torch still warm to the touch. Your paragons catch their breath.',
        healPercent: 0.30,
      },
      {
        index: 6, type: EventType.BOSS, label: 'Sergeant',
        cinematicId: 'boss_intro_sergeant',
        enemies: ['drowned_sergeant'],
        enemyRows: { front: ['drowned_sergeant'], back: [] },
      },
    ],
  },
  {
    id: 'ruined_gatehouse',
    name: 'The Ruined Gatehouse',
    description: 'The iron portcullis was bent inward by some forgotten siege. The upper floors groan under the weight of something that refuses to leave.',
    icon: 'assets/locations/unknown.png',
    level: 1,
    mapX: 50, mapY: 92,
    stub: true,
    combatMods: [],
    randomEventTable: [],
    enemyPool: [],
    events: [],
  },
  {
    id: 'chapel_of_ash',
    name: 'The Chapel of Ash',
    description: 'Where the keep\'s faithful once gathered in devotion, only cold cinders remain. A wind that does not move the candles carries whispered prayers.',
    icon: 'assets/locations/unknown.png',
    level: 1,
    mapX: 76, mapY: 29,
    stub: true,
    combatMods: [],
    randomEventTable: [],
    enemyPool: [],
    events: [],
  },
];
