// js/loot.js — Echoes of Germolles: Loot Generation
//
// Three exported functions cover the full loot lifecycle:
//
//   equipActorItems(actorDef, actorRuntime)
//     Called at actor spawn. Rolls the drop table and equips resulting items
//     directly on actorRuntime.equippedItems. Items are tagged isUnique so
//     collectBattleLoot can enforce the unique-drop rule at transfer time.
//
//   collectBattleLoot(defeatedEnemies, inventory, gameState, onOverflow?)
//     Called after a victorious battle. Reads each dead enemy's equippedItems,
//     applies unique-drop filtering, and adds items to the player's Inventory.
//     Returns { added: ItemInstance[], overflowed: ItemInstance[] }.
//     onOverflow(item) is called for each item that did not fit — reserved for
//     future UI handling (e.g. item-destruction choice).
//
//   collectContainerLoot(lootEvent, inventory, gameState, zoneLevel, onOverflow?)
//     Called when a LOOT event is resolved. Processes each entry in
//     lootEvent.loot (type 'item' or 'currency'), rolls chances, mutates
//     gameState.currencies for currency entries, adds items to inventory.
//     Returns { added: ItemInstance[], currencies: {[key]: number}, overflowed: ItemInstance[] }.

import { RARITY_WEIGHTS } from './enums.js';
import { rollItemInstance } from './inventory.js';

// ── rollRarity ──────────────────────────────────────────────────────────────
// Weighted random pick from RARITY_WEIGHTS. Private to this module.

function rollRarity() {
  const entries = Object.entries(RARITY_WEIGHTS);
  let roll = Math.random();
  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return entries[entries.length - 1][0];
}

// ── equipActorItems ─────────────────────────────────────────────────────────
// Rolls the actor's drop table and equips resulting ItemInstances onto
// actorRuntime.equippedItems. Items that fail their chance roll are skipped.
// The isUnique flag is preserved on each item for later use in collectBattleLoot.

export function equipActorItems(actorDef, actorRuntime) {
  if (!actorDef?.dropTable?.length) return;

  for (const entry of actorDef.dropTable) {
    if (Math.random() > entry.chance) continue;

    const rarity = rollRarity();
    const item   = rollItemInstance(entry.definitionId, rarity, actorDef.level ?? 1);
    item.isUnique = entry.unique;

    try {
      actorRuntime.equippedItems.equip(item);
    } catch (e) {
      console.warn('equipActorItems: failed to equip item', entry.definitionId, e);
    }
  }
}

// ── collectBattleLoot ───────────────────────────────────────────────────────
// Transfers items from defeated enemies' equippedItems to the player Inventory.
// Unique items are checked against gameState.uniqueDroppedItems before adding.
// onOverflow(item) fires for items that could not fit in inventory.

export function collectBattleLoot(defeatedEnemies, inventory, gameState, onOverflow = null) {
  const added      = [];
  const overflowed = [];

  for (const actor of defeatedEnemies) {
    if (!actor.equippedItems) continue;

    const items = Object.values(actor.equippedItems.getAll()).filter(Boolean);

    for (const item of items) {
      if (item.isUnique && gameState.uniqueDroppedItems.includes(item.definitionId)) continue;

      if (inventory.add(item)) {
        added.push(item);
        if (item.isUnique) gameState.uniqueDroppedItems.push(item.definitionId);
      } else {
        overflowed.push(item);
        if (onOverflow) onOverflow(item);
      }
    }
  }

  return { added, overflowed };
}

// ── collectContainerLoot ────────────────────────────────────────────────────
// Resolves a LOOT event definition. Each entry is either an item drop or a
// currency award. Currency amounts are mutated directly on gameState.currencies.
// onOverflow(item) fires for item drops that could not fit in inventory.

export function collectContainerLoot(lootEvent, inventory, gameState, zoneLevel, onOverflow = null) {
  const added      = [];
  const overflowed = [];
  const currencies = {};

  for (const entry of (lootEvent.loot ?? [])) {
    if (Math.random() > entry.chance) continue;

    if (entry.type === 'item') {
      if (entry.unique && gameState.uniqueDroppedItems.includes(entry.definitionId)) continue;

      const rarity = rollRarity();
      const item   = rollItemInstance(entry.definitionId, rarity, zoneLevel ?? 1);
      item.isUnique = entry.unique;

      if (inventory.add(item)) {
        added.push(item);
        if (entry.unique) gameState.uniqueDroppedItems.push(entry.definitionId);
      } else {
        overflowed.push(item);
        if (onOverflow) onOverflow(item);
      }

    } else if (entry.type === 'currency') {
      const amount = Math.floor(Math.random() * (entry.max - entry.min + 1)) + entry.min;
      gameState.currencies[entry.currency] = (gameState.currencies[entry.currency] ?? 0) + amount;
      currencies[entry.currency] = (currencies[entry.currency] ?? 0) + amount;
    }
  }

  return { added, currencies, overflowed };
}
