// js/inventory.js — Echoes of Germolles: Inventory & Item Runtime

import { ItemType, ModifierType, Rarity, RARITY_SLOT_COUNT, RARITY_VALUE_MULTIPLIER } from './enums.js';
import { DATA } from './data/index.js';

// Auto-incrementing instance ID — reset on page load (not persisted).
// Use instanceId only for in-session tracking; save/load uses definitionId + slot data.
let _nextInstanceId = 1;

// ── Modifier ───────────────────────────────────────────────────────────────
// A fully resolved modifier instance. Represents one bonus from an item base
// attribute, a rolled mod slot, a passive skill, or a status effect.
//
// effectValue = template.baseValue + template.valuePerLevel * level

export class Modifier {
  constructor({ id, name, level, modifierType, effectValue, triggerValue = null }) {
    this.id           = id;
    this.name         = name;
    this.level        = level;
    this.modifierType = modifierType;
    this.effectValue  = effectValue;
    this.triggerValue = triggerValue;
  }
}

// ── ItemInstance ───────────────────────────────────────────────────────────
// The dynamic component of a dropped item: rarity, base attribute, and
// rolled mod slots.
//
// Do not construct directly in gameplay code — use rollItemInstance().

export class ItemInstance {
  constructor({ definitionId, rarity, baseAttribute, slots, isUnique = false }) {
    this.instanceId    = _nextInstanceId++;
    this.definitionId  = definitionId;
    this.rarity        = rarity;
    this.baseAttribute = baseAttribute; // Modifier — fixed at drop, not rolled
    this.slots         = slots;         // Modifier[] — rolled at drop
    this.isUnique      = isUnique;      // true = only one obtainable per playthrough
    this.currentStack  = 1;             // Reserved for future stacking support
  }

  // Returns false if the slot composition violates constraints:
  //   • slot count exceeds the rarity's allowance
  //   • more than 1 GENERIC modifier type present
  //   • more than 2 distinct non-GENERIC modifier types present
  validate() {
    if (this.slots.length > RARITY_SLOT_COUNT[this.rarity]) return false;

    const types           = this.slots.map(s => s.modifierType);
    const genericCount    = types.filter(t => t === ModifierType.GENERIC).length;
    const nonGenericTypes = new Set(types.filter(t => t !== ModifierType.GENERIC));

    return genericCount <= 1 && nonGenericTypes.size <= 2;
  }

  // ── Serialization ────────────────────────────────────────────────────
  // Returns a plain JSON-safe object. instanceId is intentionally omitted —
  // it is ephemeral and will be re-assigned on deserialize.
  serialize() {
    return {
      definitionId:  this.definitionId,
      rarity:        this.rarity,
      isUnique:      this.isUnique,
      baseAttribute: this.baseAttribute
        ? { id: this.baseAttribute.id, level: this.baseAttribute.level }
        : null,
      slots: this.slots.map(m => ({ id: m.id, level: m.level })),
    };
  }

  // Reconstructs an ItemInstance from a serialized snapshot.
  // Returns null if the definition or base modifier cannot be resolved.
  static deserialize(raw) {
    if (!raw?.definitionId) return null;
    const baseTpl = raw.baseAttribute ? DATA.modifiers[raw.baseAttribute.id] : null;
    const baseAttribute = baseTpl
      ? new Modifier({
          id:           baseTpl.id,
          name:         baseTpl.name,
          level:        raw.baseAttribute.level,
          modifierType: baseTpl.modifierType,
          effectValue:  baseTpl.baseValue + baseTpl.valuePerLevel * raw.baseAttribute.level,
          triggerValue: baseTpl.triggerBaseValue != null
            ? baseTpl.triggerBaseValue + baseTpl.triggerValuePerLevel * raw.baseAttribute.level
            : null,
        })
      : null;

    const slots = (raw.slots ?? []).map(s => {
      const tpl = DATA.modifiers[s.id];
      if (!tpl) return null;
      return new Modifier({
        id:           tpl.id,
        name:         tpl.name,
        level:        s.level,
        modifierType: tpl.modifierType,
        effectValue:  tpl.baseValue + tpl.valuePerLevel * s.level,
        triggerValue: tpl.triggerBaseValue != null
          ? tpl.triggerBaseValue + tpl.triggerValuePerLevel * s.level
          : null,
      });
    }).filter(Boolean);

    return new ItemInstance({
      definitionId:  raw.definitionId,
      rarity:        raw.rarity,
      isUnique:      raw.isUnique ?? false,
      baseAttribute,
      slots,
    });
  }
}

// ── rollItemInstance ────────────────────────────────────────────────────────
// Creates a fully rolled ItemInstance.
//
// definitionId  — key into DATA.items
// rarity        — Rarity enum value; determines slot count
// level         — actor level at drop time; scales all modifier effectValues

export function rollItemInstance(definitionId, rarity, level) {
  const definition = DATA.items[definitionId];
  if (!definition) throw new Error(`rollItemInstance: unknown item id "${definitionId}"`);

  const baseTpl = DATA.modifiers[definition.baseAttributeId];
  if (!baseTpl) throw new Error(`rollItemInstance: unknown modifier id "${definition.baseAttributeId}"`);

  const baseAttribute = _resolveModifier(baseTpl, level);

  const slotCount       = RARITY_SLOT_COUNT[rarity];
  const slots           = [];
  let   genericUsed     = 0;
  const nonGenericTypes = new Set();

  // Pre-filter to rollable templates that are valid for this item type.
  // ATTRIBUTE type is reserved for base attributes and must never roll.
  // allowedItemTypes: null means the mod is available on every item type.
  const itemType = definition.type;
  const rollable  = Object.values(DATA.modifiers).filter(
    m => m.isRollable
      && m.modifierType !== ModifierType.ATTRIBUTE
      && (!m.allowedItemTypes || m.allowedItemTypes.includes(itemType))
  );

  const rolledIds = new Set(); // prevents the same mod appearing twice

  for (let i = 0; i < slotCount; i++) {
    // Narrow candidates: no duplicates, and within the type budget.
    const candidates = rollable.filter(m => {
      if (rolledIds.has(m.id)) return false;
      if (m.modifierType === ModifierType.GENERIC) return genericUsed < 1;
      return nonGenericTypes.size < 2 || nonGenericTypes.has(m.modifierType);
    });

    if (candidates.length === 0) break;

    const tpl = candidates[Math.floor(Math.random() * candidates.length)];
    rolledIds.add(tpl.id);

    if (tpl.modifierType === ModifierType.GENERIC) {
      genericUsed++;
    } else {
      nonGenericTypes.add(tpl.modifierType);
    }

    slots.push(_resolveModifier(tpl, level));
  }

  return new ItemInstance({ definitionId, rarity, baseAttribute, slots });
}

function _resolveModifier(template, level) {
  return new Modifier({
    id:           template.id,
    name:         template.name,
    level,
    modifierType: template.modifierType,
    effectValue:  template.baseValue + template.valuePerLevel * level,
    triggerValue: template.triggerBaseValue != null
      ? template.triggerBaseValue + template.triggerValuePerLevel * level
      : null,
  });
}

// ── Inventory ──────────────────────────────────────────────────────────────
// A fixed-capacity bag of ItemInstances. Overflow is silently skipped.

export class Inventory {
  constructor(capacity = 20) {
    this.capacity = capacity;
    this.slots    = []; // ItemInstance[]
  }

  get isFull() { return this.slots.length >= this.capacity; }

  // Returns true if the item was added, false if the inventory is full.
  add(item) {
    if (this.isFull) return false;
    this.slots.push(item);
    return true;
  }

  // Removes and returns the item at index, or null if out of bounds.
  remove(index) {
    if (index < 0 || index >= this.slots.length) return null;
    return this.slots.splice(index, 1)[0];
  }

  get(index) {
    return this.slots[index] ?? null;
  }

  // ── Serialization ────────────────────────────────────────────────────
  // Returns an array of serialized item snapshots (no nulls — compact form).
  serialize() {
    return this.slots.map(item => item.serialize());
  }

  // Repopulates the inventory from a serialized array.
  // Silently skips entries that cannot be resolved.
  load(rawArray) {
    this.slots = [];
    if (!Array.isArray(rawArray)) return;
    for (const raw of rawArray) {
      const item = ItemInstance.deserialize(raw);
      if (item) this.slots.push(item);
    }
  }
}

// ── EquippedItems ──────────────────────────────────────────────────────────
// One ItemInstance per equipment slot, keyed by ItemType.
// Extends EventTarget so the UI (or any system) can react to changes without
// polling. Subscribe with:
//
//   equippedItems.addEventListener('equip',   e => { e.detail.itemType, e.detail.item, e.detail.previous })
//   equippedItems.addEventListener('unequip', e => { e.detail.itemType, e.detail.item })

export class EquippedItems extends EventTarget {
  constructor() {
    super();
    this._slots = Object.fromEntries(
      Object.values(ItemType).map(t => [t, null])
    );
  }

  // Places item in the slot matching its definition's ItemType.
  // Returns the item that was previously in that slot, or null.
  equip(item) {
    const def = DATA.items[item.definitionId];
    if (!def) throw new Error(`EquippedItems.equip: unknown item definition "${item.definitionId}"`);

    const itemType = def.type;
    const previous = this._slots[itemType];
    this._slots[itemType] = item;

    this.dispatchEvent(new CustomEvent('equip', {
      detail: { itemType, item, previous },
    }));

    return previous;
  }

  // Clears the given slot and returns the item that was there, or null.
  unequip(itemType) {
    const item = this._slots[itemType];
    if (!item) return null;

    this._slots[itemType] = null;

    this.dispatchEvent(new CustomEvent('unequip', {
      detail: { itemType, item },
    }));

    return item;
  }

  get(itemType) {
    return this._slots[itemType] ?? null;
  }

  // Returns a shallow copy of the full slot map.
  getAll() {
    return { ...this._slots };
  }

  // ── Serialization ────────────────────────────────────────────────────
  // Returns a plain object keyed by ItemType with serialized items or null.
  serialize() {
    return Object.fromEntries(
      Object.entries(this._slots).map(([k, v]) => [k, v ? v.serialize() : null])
    );
  }

  // Reconstructs an EquippedItems instance from a serialized snapshot.
  // Silently skips slots whose item data cannot be resolved.
  static deserialize(data) {
    const instance = new EquippedItems();
    if (!data) return instance;
    for (const [itemType, raw] of Object.entries(data)) {
      if (!raw) continue;
      try {
        const item = ItemInstance.deserialize(raw);
        if (item) instance._slots[itemType] = item;
      } catch (e) {
        console.warn('EquippedItems.deserialize: skipping slot', itemType, e);
      }
    }
    return instance;
  }
}

// ── getItemValue ─────────────────────────────────────────────────────────────────────────────
// Computes the gold value of an item instance.
//   base value × rarity multiplier × (1 + 1% per mod level)
// Used for sell pricing (typically half this is awarded).

export function getItemValue(item) {
  const def   = DATA.items[item.definitionId];
  const rMult = RARITY_VALUE_MULTIPLIER[item.rarity] ?? 1;
  const mMult = 1 + item.slots.reduce((acc, mod) => acc + mod.level * 0.01, 0);
  return Math.round(def.value * rMult * mMult);
}
