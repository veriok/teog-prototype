// js/paragon.js — Echoes of Germolles: Paragon Utilities
//
// canEquip(item, paragonDef)
//   Returns true if the paragon meets the requirements to equip the given
//   ItemInstance. Currently unconditional — future implementation will gate
//   on mod tier vs paragon skill level.
//
// getUnlockedAbilities(skillType, paragonDef)
//   Returns the ability definitions available to the paragon for the given
//   skill tree. Currently returns all abilities in the paragon's definition
//   that match the tree. Future implementation will filter by skill level.

import { DATA } from './data/index.js';

// ── canEquip ───────────────────────────────────────────────────────────────
// item       — ItemInstance
// paragonDef — actor definition object (from DATA.actors)
//
// Always returns true until skill-level gating is implemented.

export function canEquip(_item, _paragonDef) {
  return true;
}

// ── getUnlockedAbilities ───────────────────────────────────────────────────
// skillType  — SkillType enum value (e.g. SkillType.SWORD)
// paragonDef — actor definition object (from DATA.actors)
//
// Returns ability definition objects whose tree matches skillType and whose
// abilityId appears in the paragon's abilities list.

export function getUnlockedAbilities(skillType, paragonDef) {
  if (!paragonDef?.abilities) return [];
  return paragonDef.abilities
    .map(a => DATA.abilities[a.abilityId])
    .filter(ab => ab && ab.tree === skillType);
}
