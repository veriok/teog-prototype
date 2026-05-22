// js/data/locations.js

export const locations = [
  {
    id: 'flooded_cellars',
    name: 'The Flooded Cellars',
    description: 'A collapsed wine cellar beneath the east wing, half-submerged in black water. Torches gutter above the waterline.',
    icon: 'assets/locations/unknown.png',
    mapX: 50, mapY: 51,
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
  },
  {
    id: 'ruined_gatehouse',
    name: 'The Ruined Gatehouse',
    description: 'The iron portcullis was bent inward by some forgotten siege. The upper floors groan under the weight of something that refuses to leave.',
    icon: 'assets/locations/unknown.png',
    mapX: 50, mapY: 92,
    stub: true,
    events: []
  },
  {
    id: 'chapel_of_ash',
    name: 'The Chapel of Ash',
    description: 'Where the keep\'s faithful once gathered in devotion, only cold cinders remain. A wind that does not move the candles carries whispered prayers.',
    icon: 'assets/locations/unknown.png',
    mapX: 76, mapY: 29,
    stub: true,
    events: []
  },
];
