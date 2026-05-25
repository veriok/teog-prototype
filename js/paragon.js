// js/paragon.js — Echoes of Germolles: Paragon Utilities

import { DATA }                        from './data/index.js';
import { XP_PER_LEVEL, SKILL_LEVEL_MAX } from './experience.js';

// ── canEquip ───────────────────────────────────────────────────────────────
// Always returns true until skill-level gating is implemented.
export function canEquip(_item, _paragonDef) {
  return true;
}

// ── getUnlockedAbilities ───────────────────────────────────────────────────
// Returns ability definitions available to the paragon for the given tree.
export function getUnlockedAbilities(skillType, paragonDef) {
  if (!paragonDef?.abilities) return [];
  return paragonDef.abilities
    .map(a => DATA.abilities[a.abilityId])
    .filter(ab => ab && ab.tree === skillType);
}

// ── getCurrentAbilityRank ──────────────────────────────────────────────────
// Returns the rank number the paragon should currently be using for an
// ability, based on the paragon's skill level in that ability's tree.
//
// Only ranks whose levelRequired <= skillLevel AND autoLearn !== false are
// considered. Falls back to rank 1 if none qualify.
export function getCurrentAbilityRank(abilityDef, skillLevel) {
  const eligible = (abilityDef.ranks ?? []).filter(
    r => r.autoLearn !== false && (r.levelRequired ?? 1) <= skillLevel
  );
  return eligible.length ? eligible[eligible.length - 1].rank : 1;
}

// ── checkAbilityRankUps ────────────────────────────────────────────────────
// Compares the rank each autoLearn ability in `skillType` would have at
// `prevLevel` vs `newLevel`. Returns an array of { abilityId, newRank } for
// abilities whose rank increased — so the caller can log them.
//
// paragonDef — actor definition object (from DATA.actors)
// skillType  — SkillType value
// prevLevel  — the skill level before the level-up(s)
// newLevel   — the skill level after the level-up(s)
export function checkAbilityRankUps(paragonDef, skillType, prevLevel, newLevel) {
  const results = [];
  for (const { abilityId } of (paragonDef?.abilities ?? [])) {
    const abDef = DATA.abilities[abilityId];
    if (!abDef || abDef.tree !== skillType) continue;
    const before = getCurrentAbilityRank(abDef, prevLevel);
    const after  = getCurrentAbilityRank(abDef, newLevel);
    if (after > before) results.push({ abilityId, newRank: after });
  }
  return results;
}

// ── processSkillXp ────────────────────────────────────────────────────────
// Applies `xpGain` to `skillType` on `paragonState`. Handles level-ups with
// XP overflow carry. Dispatches a 'skillLevelUp' CustomEvent on document for
// each level gained so other systems (UI, quests) can react.
//
// Returns { newLevel, levelsGained, rankUps[] } where rankUps is the
// combined list from checkAbilityRankUps across all gained levels.
//
// paragonState — the per-paragon state object (mutated in place)
// skillType    — SkillType value
// xpGain       — integer XP to add (≥ 0)
// paragonId    — string id used in the dispatched event detail
// paragonDef   — actor definition object (used for rank-up checks)
export function processSkillXp(paragonState, skillType, xpGain, paragonId, paragonDef) {
  if (xpGain <= 0) return { newLevel: paragonState.skillLevels[skillType] ?? 1, levelsGained: 0, rankUps: [] };

  let level      = paragonState.skillLevels[skillType] ?? 1;
  let xp         = (paragonState.skillXP[skillType]    ?? 0) + xpGain;
  const prevLevel = level;
  const rankUps  = [];

  while (level < SKILL_LEVEL_MAX) {
    const needed = XP_PER_LEVEL[level];
    if (xp < needed) break;
    xp -= needed;
    level++;

    // Collect rank-ups for this level step.
    const ups = checkAbilityRankUps(paragonDef, skillType, level - 1, level);
    rankUps.push(...ups);

    document.dispatchEvent(new CustomEvent('skillLevelUp', {
      detail: { paragonId, skillType, newLevel: level }
    }));
  }

  // If at cap, discard excess XP.
  if (level >= SKILL_LEVEL_MAX) xp = 0;

  paragonState.skillLevels[skillType] = level;
  paragonState.skillXP[skillType]     = xp;

  return { newLevel: level, levelsGained: level - prevLevel, rankUps };
}

