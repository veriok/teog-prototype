// js/stats.js — Echoes of Germolles: Actor Stats & Hit Computation
//
// computeActorStats(actor)
//   Called once per actor in BattleEngine.init() after equipActorItems().
//   Aggregates all Class-A ('stat') modifiers from equipped items into a
//   flat actor.stats object, then writes derived values (maxHP, maxArmor,
//   baseSpeed) back onto the actor.
//
// computeHitDamage(baseDmg, ctx)
//   Called per hit. Gathers all Class-B ('combat') modifiers from every
//   active source (attacker items, passives, status effects, location) and
//   evaluates each against the hit context. Returns final integer damage
//   (minimum 0). Does not mutate actor state.
//
// Hit context shape:
//   {
//     attacker:     ActorRuntime,
//     defender:     ActorRuntime,
//     damageType:   string,        // 'physical'|'fire'|'nature'|'void'|'true'
//     abilityTags:  string[]|null,   // AbilityTag[] — ability.tags from the executing ability
//     isCrit:       boolean,
//     locationMods: CombatModDescriptor[], // from BattleEngine.locationMods
//   }

import { DATA } from './data/index.js';

// ── computeActorStats ───────────────────────────────────────────────────────

export function computeActorStats(actor) {
  // Seed from actor base values; all bonus stats start at zero.
  const s = {
    hp:            actor.maxHP,
    armor:         actor.maxArmor,
    slashingDmg:   0,
    flatDmg:       0,
    critChance:    0,
    speed:         actor.baseSpeed,
    blockBonus:    0,
    armorRegen:    0,
    fireDmgBonus:  0,
    burnDuration:  0,
    voidDmgBonus:  0,
    entropyBonus:  0,
  };

  // Aggregate stat mods from every equipped item slot.
  for (const item of Object.values(actor.equippedItems.getAll()).filter(Boolean)) {
    const allMods = [item.baseAttribute, ...item.slots].filter(Boolean);
    for (const mod of allMods) {
      const tpl = DATA.modifiers[mod.id];
      if (!tpl || tpl.modClass !== 'stat') continue;
      if (!(tpl.effectTarget in s)) continue;
      if (tpl.mode === 'multiply') {
        s[tpl.effectTarget] *= mod.effectValue;
      } else {
        s[tpl.effectTarget] += mod.effectValue;
      }
    }
  }

  // Write derived values back onto the actor.
  actor.maxHP        = Math.round(s.hp);
  actor.currentHP    = Math.min(actor.currentHP, actor.maxHP);
  actor.maxArmor     = Math.round(s.armor);
  // Armor is never persisted between battles, so always restore to full after gear is applied.
  actor.currentArmor = actor.maxArmor;
  actor.baseSpeed    = s.speed;
  actor.stats        = s;

  // ── Skill-level bonuses (paragons only) ──────────────────────────────
  // Each equipped skill contributes +3 HP and (if energy resource) +2 energy
  // per level. Bonuses are additive across both equipped skills.
  if (actor.subtype === 'paragon' && actor.skillLevels && actor.equippedSkillTypes) {
    let skillSum = 0;
    for (const tree of actor.equippedSkillTypes) {
      if (tree) skillSum += actor.skillLevels[tree] ?? 1;
    }
    const hpBonus = skillSum * 3;
    actor.maxHP        += hpBonus;
    actor.currentHP     = Math.min(actor.currentHP + hpBonus, actor.maxHP);
    actor.stats.hp      = actor.maxHP;

    if (actor.resourceType === 'energy') {
      const energyBonus   = skillSum * 2;
      actor.resourceMax  += energyBonus;
      actor.resource      = Math.min(actor.resource + energyBonus, actor.resourceMax);
    }
  }
}

// ── getRankForLevel ─────────────────────────────────────────────────────────
// Returns the highest rank definition in abilityDef whose levelRequired is
// less than or equal to `level`. Falls back to ranks[0] if none qualify.
// Used at spawn time to select the correct rank for an actor's effective level.

export function getRankForLevel(abilityDef, level) {
  const eligible = abilityDef.ranks.filter(r => (r.levelRequired ?? 1) <= level);
  return eligible.length ? eligible[eligible.length - 1] : abilityDef.ranks[0];
}

// ── scaleActorByLevel ───────────────────────────────────────────────────────
// Applies a +5% per level above 1 multiplier to an actor's HP and armor.
// Must be called AFTER computeActorStats() so equipment bonuses are included.
// No-op at level 1.

export function scaleActorByLevel(actor, level) {
  if (level <= 1) return;
  const mult = 1 + (level - 1) * 0.05;
  actor.maxHP        = Math.round(actor.maxHP    * mult);
  actor.currentHP    = Math.round(actor.currentHP * mult);
  actor.maxArmor     = Math.round(actor.maxArmor  * mult);
  actor.currentArmor = Math.round(actor.currentArmor * mult);
  if (actor.stats) {
    actor.stats.hp    = actor.maxHP;
    actor.stats.armor = actor.maxArmor;
  }
}

// ── computeHitDamage ────────────────────────────────────────────────────────

export function computeHitDamage(baseDmg, ctx) {
  let dmg = baseDmg;
  for (const entry of _gatherCombatMods(ctx)) {
    if (!_matchesCondition(entry.condition, ctx)) continue;
    dmg = _applyEffect(dmg, entry, ctx);
  }
  return Math.max(0, Math.round(dmg));
}

// ── _gatherCombatMods ───────────────────────────────────────────────────────
// Collects combat modifiers from all active sources and normalises them into
// a flat array of { condition, effect, effectValue, triggerValue } entries.

function _gatherCombatMods(ctx) {
  const entries = [];

  // 1. Attacker's equipped item combat mods.
  for (const item of Object.values(ctx.attacker.equippedItems.getAll()).filter(Boolean)) {
    for (const mod of [item.baseAttribute, ...item.slots].filter(Boolean)) {
      const tpl = DATA.modifiers[mod.id];
      if (tpl?.modClass !== 'combat') continue;
      entries.push({
        condition:    tpl.condition   ?? null,
        effect:       tpl.effect,
        effectValue:  mod.effectValue,
        triggerValue: mod.triggerValue,
      });
    }
  }

  // 2. Attacker passives (reserved for future passive skills).
  for (const passive of (ctx.attacker.passives ?? [])) {
    const tpl = DATA.modifiers[passive.id];
    if (tpl?.modClass !== 'combat') continue;
    entries.push({
      condition:    tpl.condition   ?? null,
      effect:       tpl.effect,
      effectValue:  passive.effectValue,
      triggerValue: passive.triggerValue,
    });
  }

  // 3. Location modifiers (e.g. Chapel of Ash: ice magic −30%).
  for (const cm of (ctx.locationMods ?? [])) {
    entries.push({
      condition:    cm.condition    ?? null,
      effect:       cm.effect,
      effectValue:  cm.effectValue  ?? 0,
      triggerValue: cm.triggerValue ?? null,
    });
  }

  return entries;
}

// ── _matchesCondition ───────────────────────────────────────────────────────
// Returns true if all fields in the condition descriptor match ctx.
// A null/undefined condition is unconditional — always applies.

function _matchesCondition(condition, ctx) {
  if (!condition) return true;
  if (condition.targetHasTag    != null && !ctx.defender.tags?.includes(condition.targetHasTag))   return false;
  if (condition.attackerHasTag  != null && !ctx.attacker.tags?.includes(condition.attackerHasTag)) return false;
  if (condition.damageType      != null && ctx.damageType   !== condition.damageType)               return false;
  if (condition.abilityTag != null && !(ctx.abilityTags ?? []).includes(condition.abilityTag)) return false;
  if (condition.isCrit          != null && ctx.isCrit       !== condition.isCrit)                   return false;
  if (condition.targetHpBelow   != null) {
    const pct = ctx.defender.currentHP / ctx.defender.maxHP;
    if (pct >= condition.targetHpBelow) return false;
  }
  return true;
}

// ── _applyEffect ────────────────────────────────────────────────────────────
// Applies a single normalised combat-mod entry to dmg and returns the result.
//
// 'damageMultiplier' → dmg × (1 + effectValue)
// 'flatDamage'       → dmg + effectValue
// 'proc'             → effectValue% chance to apply dmg × (1 + triggerValue)

function _applyEffect(dmg, entry, ctx) {
  const { effect, effectValue, triggerValue } = entry;
  switch (effect.type) {
    case 'damageMultiplier': {
      if (effect.damageType != null && ctx.damageType !== effect.damageType) return dmg;
      return dmg * (1 + effectValue);
    }
    case 'flatDamage': {
      if (effect.damageType != null && ctx.damageType !== effect.damageType) return dmg;
      return dmg + effectValue;
    }
    case 'proc': {
      if (Math.random() >= effectValue) return dmg;
      if (effect.damageType != null && ctx.damageType !== effect.damageType) return dmg;
      return dmg * (1 + (triggerValue ?? 0));
    }
    default:
      return dmg;
  }
}
