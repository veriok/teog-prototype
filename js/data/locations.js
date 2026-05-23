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
    events: [
      {
        index: 0, type: EventType.FIGHT, label: 'Patrol',
        enemies: ['drowned_soldier_1', 'drowned_soldier_2'],
        enemyRows: { front: ['drowned_soldier_1', 'drowned_soldier_2'], back: [] }
      },
      {
        index: 1, type: EventType.FIGHT, label: 'Storage',
        enemies: ['drowned_soldier_1', 'siege_crossbowman'],
        enemyRows: { front: ['drowned_soldier_1'], back: ['siege_crossbowman'] }
      },
      {
        index: 2, type: EventType.LOOT, label: 'Cache',
        cinematicId: 'chest_found',
        loot: [
          { type: 'item',     definitionId: 'drowned_sword', chance: 0.70, unique: false },
          { type: 'currency', currency: Currency.SOULS,      chance: 1.0,  min: 5, max: 15 },
        ]
      },
      {
        index: 3, type: EventType.ELITE, label: 'Warden',
        enemies: ['siege_warden'],
        enemyRows: { front: ['siege_warden'], back: [] }
      },
      {
        index: 4, type: EventType.BOSS, label: 'Sergeant',
        cinematicId: 'boss_intro_sergeant',
        enemies: ['drowned_sergeant'],
        enemyRows: { front: ['drowned_sergeant'], back: [] }
      }
    ]
  },
  {
    id: 'ruined_gatehouse',
    name: 'The Ruined Gatehouse',
    description: 'The iron portcullis was bent inward by some forgotten siege. The upper floors groan under the weight of something that refuses to leave.',
    icon: 'assets/locations/unknown.png',
    level: 1,
    mapX: 50, mapY: 92,
    stub: true,
    events: []
  },
  {
    id: 'chapel_of_ash',
    name: 'The Chapel of Ash',
    description: 'Where the keep\'s faithful once gathered in devotion, only cold cinders remain. A wind that does not move the candles carries whispered prayers.',
    icon: 'assets/locations/unknown.png',
    level: 1,
    mapX: 76, mapY: 29,
    stub: true,
    events: []
  },
];
