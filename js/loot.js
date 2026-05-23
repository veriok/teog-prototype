// js/loot.js — Echoes of Germolles: Loot Generation
//
// Two-phase loot flow:
//   1. rollEnemyItems()  — called at enemy spawn; produces drop records
//                          stored on ActorRuntime.droppedItems
//   2. generateLoot()    — called after battle; transfers drop records to the
//                          player's Inventory, applying unique-drop tracking
//
// A drop record has shape: { item: ItemInstance, definitionId, unique }
// The metadata is kept alongside the item so generateLoot() is self-contained
// and does not need to re-query actor definitions.

import { RARITY_WEIGHTS } from './enums.js';
import { rollItemInstance } from './inventory.js';

// ── rollRarity ─────────────────────────────────────────────────────────────
// Weighted random pick from RARITY_WEIGHTS. Private to this module.

function rollRarity() {
  const entries = Object.entries(RARITY_WEIGHTS);
  let roll = Math.random();
  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  // Floating-point guard: return the last entry if roll never reaches 0.
  return entries[entries.length - 1][0];
}

// ── rollEnemyItems ─────────────────────────────────────────────────────────
// Rolls drop records for a spawning enemy from its definition's drop table.
// Unique-drop tracking is NOT applied here — enemies always carry their
// rolled items into battle; uniqueness is only enforced at drop time.
//
// actorDefinition  — entry from DATA.actors (must have a dropTable array)
// level            — enemy's level; passed through to rollItemInstance()
//
// Returns an array of drop records: { item, definitionId, unique }[]

export function rollEnemyItems(actorDefinition, level) {
  if (!actorDefinition.dropTable?.length) return [];

  const records = [];

  for (const entry of actorDefinition.dropTable) {
    if (Math.random() > entry.chance) continue;

    const rarity = rollRarity();
    const item   = rollItemInstance(entry.definitionId, rarity, level);

    records.push({ item, definitionId: entry.definitionId, unique: entry.unique });
  }

  return records;
}

// ── generateLoot ───────────────────────────────────────────────────────────
// Transfers drop records from defeated ActorRuntimes to the player's
// Inventory. Respects unique-drop tracking in gameState.
//
// defeatedActors   — ActorRuntime[] with a droppedItems property set at spawn
// inventory        — player's Inventory instance
// gameState        — live game state object; must contain uniqueDroppedItems[]

export function generateLoot(defeatedActors, inventory, gameState) {
  for (const actor of defeatedActors) {
    if (!actor.droppedItems?.length) continue;

    for (const { item, definitionId, unique } of actor.droppedItems) {
      if (unique && gameState.uniqueDroppedItems.includes(definitionId)) continue;

      const added = inventory.add(item);

      if (added && unique) {
        gameState.uniqueDroppedItems.push(definitionId);
      }
    }
  }
}
