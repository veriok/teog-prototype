// js/experience.js — Echoes of Germolles: Paragon Skill XP & Leveling Math
//
// All constants and pure functions related to skill experience and leveling
// are kept here so tuning values are easy to find and adjust.

// ── Constants ──────────────────────────────────────────────────────────────

export const SKILL_LEVEL_MAX = 30;

// Base XP awarded for defeating one normal level-1 enemy.
export const BASE_ENEMY_XP = 40;

// Additional XP added to the base per enemy level above 1.
// e.g. lv 1 = 40, lv 2 = 55, lv 5 = 100, lv 10 = 175.
export const LEVEL_XP_BONUS = 15;

// Multipliers applied on top of BASE_ENEMY_XP based on enemy subclass.
export const ELITE_XP_MULTIPLIER = 2.0;  // +100 %
export const BOSS_XP_MULTIPLIER  = 4.0;  // +300 %

// Level-difference window for full XP. Beyond this the penalty kicks in.
export const LEVEL_FULL_RANGE = 3;

// XP reduction per level of difference outside the full-range window (8 %).
// Applied independently in both directions (too-high enemy AND too-low enemy).
export const LEVEL_XP_REDUCTION = 0.08;

// Difference beyond which 0 XP is awarded (anti-power-leveling).
export const LEVEL_XP_CUTOFF = 11;

// ── XP thresholds ──────────────────────────────────────────────────────────
// XP_PER_LEVEL[n] is the total XP required to advance FROM level n TO n+1.
// Index 0 is unused (no level 0). Index 30 is unused (level 30 is the cap).
// Growth rate: ~22 % per tier, starting at 400.
// Pacing guide:
//   Early  (lv  1–5 ): ~5 combats ≈ 1–2 levels  (fast)
//   Mid    (lv 10–15): ~17 combats per level      (moderate)
//   Late   (lv 25–30): ~40+ combats per level     (slow)
export const XP_PER_LEVEL = Object.freeze([
        0,  // [0]  unused
      400,  // [1]  lv 1 → 2
      490,  // [2]  lv 2 → 3
      600,  // [3]  lv 3 → 4
      730,  // [4]  lv 4 → 5
      890,  // [5]  lv 5 → 6
     1085,  // [6]  lv 6 → 7
     1325,  // [7]  lv 7 → 8
     1615,  // [8]  lv 8 → 9
     1970,  // [9]  lv 9 → 10
     2400,  // [10] lv 10 → 11
     2925,  // [11] lv 11 → 12
     3570,  // [12] lv 12 → 13
     4355,  // [13] lv 13 → 14
     5315,  // [14] lv 14 → 15
     6485,  // [15] lv 15 → 16
     7910,  // [16] lv 16 → 17
     9650,  // [17] lv 17 → 18
    11770,  // [18] lv 18 → 19
    14360,  // [19] lv 19 → 20
    17520,  // [20] lv 20 → 21
    21375,  // [21] lv 21 → 22
    26075,  // [22] lv 22 → 23
    31815,  // [23] lv 23 → 24
    38815,  // [24] lv 24 → 25
    47355,  // [25] lv 25 → 26
    57775,  // [26] lv 26 → 27
    70485,  // [27] lv 27 → 28
    85990,  // [28] lv 28 → 29
   105000,  // [29] lv 29 → 30
]);

// ── xpForEnemy ─────────────────────────────────────────────────────────────
// Returns the XP a skill at `skillLevel` earns for defeating `enemy`.
//
// enemy      — ActorRuntime (needs .level and .subclass)
// skillLevel — current skill level of the paragon skill being trained
//
// Diminishing returns are symmetric: fighting an enemy much higher than the
// skill level is limited to prevent power-levelling; fighting much lower
// enemies is limited to prevent farming trivial content.

export function xpForEnemy(enemy, skillLevel) {
  const diff = Math.abs(enemy.level - skillLevel);

  if (diff > LEVEL_XP_CUTOFF) return 0;

  const dimFactor = diff <= LEVEL_FULL_RANGE
    ? 1.0
    : 1.0 - (diff - LEVEL_FULL_RANGE) * LEVEL_XP_REDUCTION;

  let multiplier = 1.0;
  if (enemy.subclass === 'elite') multiplier = ELITE_XP_MULTIPLIER;
  if (enemy.subclass === 'boss')  multiplier = BOSS_XP_MULTIPLIER;

  const base = BASE_ENEMY_XP + ((enemy.level ?? 1) - 1) * LEVEL_XP_BONUS;
  return Math.max(0, Math.floor(base * multiplier * dimFactor));
}

// ── computeParagonLevel ────────────────────────────────────────────────────
// Derives the paragon's effective level from the two equipped skill levels.
// Used as the "character level" for stat scaling and other effects.
//
// skillLevels       — { [skillType]: number }
// equippedSkillTypes — [skillType, skillType]  (the two active panels)

export function computeParagonLevel(skillLevels, equippedSkillTypes) {
  const levels = (equippedSkillTypes ?? [])
    .filter(Boolean)
    .map(t => skillLevels?.[t] ?? 1);
  if (levels.length === 0) return 1;
  const avg = levels.reduce((sum, l) => sum + l, 0) / levels.length;
  return Math.max(1, Math.floor(avg));
}
