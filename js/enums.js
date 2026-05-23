// js/enums.js — Echoes of Germolles: Shared Enumerations

// ── Equipment slot types ───────────────────────────────────────────────────
export const ItemType = Object.freeze({
  MAIN_HAND: 'main_hand',
  OFFHAND:   'offhand',
  HELMET:    'helmet',
  BODY:      'body',
  BOOTS:     'boots',
  GLOVES:    'gloves',
  BELT:      'belt',
  CLOAK:     'cloak',
  RING:      'ring',
  AMULET:    'amulet',
});

// ── Item sub-classifications (optional on definitions) ─────────────────────
export const ItemSubtype = Object.freeze({
  SWORD:        'sword',
  SHIELD:       'shield',
  AXE:          'axe',
  HEAVY_CHEST:  'heavy_chest',
  MEDIUM_CHEST: 'medium_chest',
  LIGHT_CHEST:  'light_chest',
});

// ── Drop rarity ────────────────────────────────────────────────────────────
export const Rarity = Object.freeze({
  JUNK:      'junk',
  COMMON:    'common',
  UNCOMMON:  'uncommon',
  RARE:      'rare',
  LEGENDARY: 'legendary',
});

// Number of rollable mod slots granted by each rarity tier.
export const RARITY_SLOT_COUNT = Object.freeze({
  [Rarity.JUNK]:      0,
  [Rarity.COMMON]:    1,
  [Rarity.UNCOMMON]:  2,
  [Rarity.RARE]:      3,
  [Rarity.LEGENDARY]: 4,
});

// Global rarity distribution used when rolling dropped item rarity.
// Weights must sum to 1.0. Tune these for game feel.
export const RARITY_WEIGHTS = Object.freeze({
  [Rarity.JUNK]:      0.40,
  [Rarity.COMMON]:    0.35,
  [Rarity.UNCOMMON]:  0.15,
  [Rarity.RARE]:      0.08,
  [Rarity.LEGENDARY]: 0.02,
});

// ── Modifier categories ────────────────────────────────────────────────────
// Mirrors the ability tree names plus a catch-all GENERIC category.
// Used to categorise modifiers on items, passive skills, and status effects.
export const ModifierType = Object.freeze({
  SWORD:   'sword',
  SHIELD:  'shield',
  TACTICS: 'tactics',
  FIRE:    'fire',
  VOID:    'void',
  GENERIC: 'generic',
  ATTRIBUTE: 'attribute',
});

// ── In-game currencies ─────────────────────────────────────────────────────────
export const Currency = Object.freeze({
  SOULS: 'souls',
});

// Display metadata for each currency.
export const CURRENCY_CONFIG = Object.freeze({
  [Currency.SOULS]: { label: 'Souls', icon: '💀' },
});
