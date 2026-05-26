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
  FLOOD:   'flood',
  STAFF:   'staff',
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

// ── Skill trees (ability families) ────────────────────────────────────────
// Used as ability.tree and as the dropdown keys in the Paragon skill panel.
export const SkillType = Object.freeze({
  SWORD:   'sword',
  SHIELD:  'shield',
  TACTICS: 'tactics',
  FIRE:    'fire',
  VOID:    'void',
  FLOOD:   'flood',
  STAFF:   'staff',
});

// ── Ability combat tags ────────────────────────────────────────────────────
// Stored as ability.tags: AbilityTag[]. Used in mod conditions such as
// "+20% to fire abilities" → condition.abilityTag = AbilityTag.FIRE.
export const AbilityTag = Object.freeze({
  MELEE:     'melee',
  RANGED:    'ranged',
  SPELL:     'spell',
  DEFENSIVE: 'defensive',
  SUPPORT:   'support',
  CAST:      'cast',
});

// ── Battlefield deployment cap ─────────────────────────────────────────────
// Maximum number of paragons the player can deploy at once.
// Will be raised by castle upgrades in a future update.
export const MAX_DEPLOYED_PARAGONS = 2;

// ── Event types ─────────────────────────────────────────────────────────
export const EventType = Object.freeze({
  FIGHT:     'fight',
  ELITE:     'elite',
  BOSS:      'boss',
  LOOT:      'loot',
  RANDOM:    'random',    // resolved at runtime from location's randomEventTable
  REST_SPOT: 'rest_spot', // party recovery node; no combat
});

// ── Item sell-value multipliers by rarity ───────────────────────────────────
export const RARITY_VALUE_MULTIPLIER = Object.freeze({
  [Rarity.JUNK]:      0.5,
  [Rarity.COMMON]:    1.0,
  [Rarity.UNCOMMON]:  2.0,
  [Rarity.RARE]:      3.0,
  [Rarity.LEGENDARY]: 5.0,
});

// ── Damage types ──────────────────────────────────────────────────────────────
// Specific leaf types used in ability effects, actor resistances, and status mods.
export const DamageType = Object.freeze({
  // Physical subtypes
  SLASHING:    'slashing',
  PIERCING:    'piercing',
  BLUDGEONING: 'bludgeoning',
  // Elemental subtypes
  FIRE:        'fire',
  COLD:        'cold',
  LIGHTNING:   'lightning',
  // Magical / other
  VOID:        'void',
  ARCANA:      'arcana',
  NATURE:      'nature',
  DECAY:       'decay',
  // Special — bypasses armor and resistance entirely
  TRUE:        'true',
});

// Umbrella categories used for resistance fallback lookup.
export const DAMAGE_CATEGORY = Object.freeze({
  PHYSICAL:  'physical',   // covers slashing / piercing / bludgeoning
  ELEMENTAL: 'elemental',  // covers fire / cold / lightning
  // void / arcana / nature / decay have no umbrella
});

// Maps each leaf DamageType to its umbrella category (if any).
// Used so an actor with { [DAMAGE_CATEGORY.PHYSICAL]: RESISTANT } resists all three physical subtypes.
export const DAMAGE_UMBRELLA = Object.freeze({
  [DamageType.SLASHING]:    DAMAGE_CATEGORY.PHYSICAL,
  [DamageType.PIERCING]:    DAMAGE_CATEGORY.PHYSICAL,
  [DamageType.BLUDGEONING]: DAMAGE_CATEGORY.PHYSICAL,
  [DamageType.FIRE]:        DAMAGE_CATEGORY.ELEMENTAL,
  [DamageType.COLD]:        DAMAGE_CATEGORY.ELEMENTAL,
  [DamageType.LIGHTNING]:   DAMAGE_CATEGORY.ELEMENTAL,
});

// ── Resistance keywords ───────────────────────────────────────────────────────
// NORMAL is intentionally absent — a missing entry always means normal (×1.0 damage).
// Keywords are used in actor definitions; numbers are used for computation.
export const ResistanceKeyword = Object.freeze({
  VULNERABLE:     'vulnerable',      // takes more damage (stored as −0.25; can stack lower)
  RESISTANT:      'resistant',       // −25 % damage
  VERY_RESISTANT: 'very_resistant',  // −50 % damage
  NEAR_IMMUNE:    'near_immune',     // −75 % damage
  IMMUNE:         'immune',          // stored as 1.5 — requires 6 × 25 %-shred stacks to break
});

// Numeric resistance value for each keyword.
// Positive = damage reduced; negative = damage amplified.
// Applied to the full effective damage AFTER armor DR but BEFORE distribution to armor/HP pools.
export const RESISTANCE_VALUE = Object.freeze({
  [ResistanceKeyword.VULNERABLE]:     -0.25,
  [ResistanceKeyword.RESISTANT]:       0.25,
  [ResistanceKeyword.VERY_RESISTANT]:  0.50,
  [ResistanceKeyword.NEAR_IMMUNE]:     0.75,
  [ResistanceKeyword.IMMUNE]:          1.50,
});
