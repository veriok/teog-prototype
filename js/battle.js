// js/battle.js — Echoes of Germolles: Battle Engine

import { DATA }           from './data/index.js';
import { UI }             from './ui.js';
import { EquippedItems }  from './inventory.js';
import { equipActorItems } from './loot.js';
import { computeActorStats, getRankForLevel, scaleActorByLevel, computeHitDamage } from './stats.js';
import { DAMAGE_UMBRELLA, RESISTANCE_VALUE } from './enums.js';

const TICK = 0.1; // seconds per tick

// Returns the actual resource amount an actor must spend for a given base cost.
// Energy  = 100 % of base.
// Rage    = 25 % of base, rounded up.
// Resolve = 33 % of base, rounded up.
function effectiveCost(resourceType, baseAmount) {
  if (resourceType === 'rage')    return Math.ceil(baseAmount * 0.25);
  if (resourceType === 'resolve') return Math.ceil(baseAmount * 0.33);
  return baseAmount; // energy, threat, none
}

export class ActorRuntime {
  static _nextId = 0;
  constructor(def) {
    this.id          = def.id;
    this.defId       = def.id;
    this.name        = def.name;
    this.role        = def.role;
    this.icon        = def.icon;
    this.portrait    = def.portrait || null;
    this.subtype     = def.subtype;   // 'paragon' | 'enemy'
    this.subclass    = def.subclass || null; // 'elite' | 'boss' | null
    this.row         = def.row;       // 'front' | 'back'
    this.level       = def.level || 1;
    this.tags        = def.tags  ?? [];

    this.maxHP       = def.baseHP;
    this.currentHP   = def.baseHP;
    this.maxArmor    = def.baseArmor;
    this.currentArmor= def.baseArmor;

    // Resource
    const r          = def.resource;
    this.resourceType= r.type;        // 'energy'|'rage'|'threat'|'none'
    this.resourceMax = r.max;
    this.resource    = r.current ?? 0;
    this.resourceRegen = r.regenPerSec || 0;
    this.resourceDecay = r.decayPerSec || 0;
    this.lastActedTime = 0; // for decay tracking

    this.globalSpeed = def.globalSpeed || 1.0;
    this.baseSpeed   = def.globalSpeed || 1.0;

    // Build ability runtimes
    const abilityDefs = def.abilities || [];
    this.abilities = abilityDefs.map(a => {
      const abDef = DATA.abilities[a.abilityId];
      if (!abDef) { console.warn('Missing ability:', a.abilityId); return null; }
      const rankDef = abDef.ranks[a.rank - 1] || abDef.ranks[0];
      return {
        id: abDef.id, name: abDef.name, icon: abDef.icon,
        tags: abDef.tags ?? [], targeting: abDef.targeting,
        execute: abDef.execute.bind(abDef),
        currentRank: a.rank, rankDef,
        maxCooldown: rankDef.cooldown,
        currentCooldown: rankDef.cooldown * Math.random(), // stagger starts
        cost: rankDef.cost || null,
        isPassive: abDef.isPassive || false,
      };
    }).filter(Boolean);

    // Status effects: Map<statusId, { stacks, duration, tickAccum }>
    this.statuses = new Map();

    // Threat/Rage (enemies only)
    this.threatRage   = 0;
    this.phase        = 1; // boss phases
    this.phase2Active = false;

    // Boss specifics
    this.specialAttack     = def.specialAttack || null;
    this.phase2SpecialAttack = def.phase2SpecialAttack || null;
    this.phase2Abilities   = def.phase2Abilities || null;

    // Equipped items — loot bookkeeping; does not affect combat stats
    this.equippedItems = new EquippedItems();

    // Combat stats — populated by computeActorStats() in BattleEngine.init()
    this.passives = [];
    this.stats    = {};

    // Resistances — keyword map copied from definition so it can be mutated at runtime
    // (e.g. by ability effects or future item mods). Missing key = NORMAL (×1.0 damage).
    this.resistances = def.resistances ? { ...def.resistances } : {};

    // Unique runtime identity — used as caster key in status entries
    this._runtimeId = ActorRuntime._nextId++;

    // Accumulator for passive item-based regen (fires every 5 real seconds)
    this.regenTickAccum = 0;

    // Flags
    this.isDead      = false;
    this.isActing    = false; // prevents re-queue in same tick
  }

  // ── Resistance helper ─────────────────────────────────────────────────
  // Returns the effective numeric resistance for a given damage type.
  // void_exposed uses the ACTIVE entry's effectiveValuePerStack (caster-scaled).
  // High end is capped at 1.0 (IMMUNE ceiling). Low end is unclamped.
  getEffectiveResistance(damageType) {
    // 1. Specific type first, then umbrella category fallback
    let keyword = this.resistances[damageType];
    if (keyword == null) {
      const umbrella = DAMAGE_UMBRELLA[damageType];
      if (umbrella != null) keyword = this.resistances[umbrella];
    }
    let resistVal = keyword != null ? (RESISTANCE_VALUE[keyword] ?? 0) : 0;

    // 2. void_exposed: use active entry's effectiveValuePerStack (strongest-wins entry)
    const voidExposed = this.getStatus('void_exposed');
    if (voidExposed && damageType === 'void') {
      resistVal -= voidExposed.stacks * voidExposed.effectiveValuePerStack;
    }

    // 3. Cap at 1.0 (IMMUNE); no floor clamp
    return Math.min(1.0, resistVal);
  }

  // ── Computed GlobalSpeed ──────────────────────────────────────────────
  computeGlobalSpeed() {
    if (this.hasStatus('stun')) return 0;
    let speed = this.baseSpeed;
    const haste = this.getStatus('haste'); // returns active (strongest) entry
    const slow  = this.getStatus('slow');
    if (haste) speed += haste.stacks * 0.15;
    if (slow)  speed -= slow.stacks  * 0.15;
    return Math.max(0.1, speed);
  }

  // ── Status helpers ────────────────────────────────────────────────────
  // Statuses are keyed by `${statusId}:${casterId}` to allow multiple casters
  // to each maintain independent entries for the same status type.

  hasStatus(id) {
    for (const entry of this.statuses.values()) {
      if (entry.statusId === id) return true;
    }
    return false;
  }

  // Returns the "active" (strongest) entry for non-tick statuses,
  // or the first found entry for tick statuses (all tick entries are active).
  getStatus(id) {
    const def = DATA.statuses[id];
    if (!def) return null;
    let best = null;
    for (const entry of this.statuses.values()) {
      if (entry.statusId !== id) continue;
      if (!best) { best = entry; continue; }
      if (def.compareByDuration) {
        if (entry.stacks > best.stacks) best = entry;
      } else {
        const eVal = entry.stacks * entry.effectiveValuePerStack;
        const bVal = best.stacks   * best.effectiveValuePerStack;
        if (eVal > bVal) best = entry;
      }
    }
    return best;
  }

  // All entries for a given statusId (for UI rendering).
  getAllStatusEntries(id) {
    const result = [];
    for (const entry of this.statuses.values()) {
      if (entry.statusId === id) result.push(entry);
    }
    return result;
  }

  // All entries across all statuses as a flat array (for UI).
  getAllStatusEntriesAll() {
    return [...this.statuses.values()];
  }

  // Apply a status from a caster. Duration is derived: 1 stack = 2 real seconds.
  applyStatus(id, stacks, caster) {
    const def = DATA.statuses[id];
    if (!def) return;

    // Compute the per-stack effective value from the caster's stats at apply time.
    const snap = caster?.stats ?? {};
    let evps;
    switch (id) {
      case 'guard':   evps = 5 + (snap.blockBonus   ?? 0); break;
      case 'burning': evps = 4 + (snap.burnDmgBonus ?? 0); break;
      case 'bleeding':evps = 6 + (snap.bleedDmgBonus ?? 0); break;
      case 'regen':   evps = 4; break;
      default:        evps = def.compareBase ?? 1; break;
    }

    const casterId   = caster?._runtimeId ?? 0;
    const casterName = caster?.name ?? 'Unknown';
    const entryKey   = `${id}:${casterId}`;
    const existing   = this.statuses.get(entryKey);

    if (def.stackMode === 'unique') {
      // Always 1 stack; reset tick timer on re-apply
      this.statuses.set(entryKey, {
        statusId: id, entryKey, casterId, casterName,
        statsSnapshot: { ...snap },
        stacks: 1, tickAccum: 0, effectiveValuePerStack: evps, isActive: false,
      });
    } else if (def.stackMode === 'stack') {
      if (existing) {
        // Same caster reapplies — add stacks, keep tick accumulator going
        existing.stacks = Math.min(existing.stacks + stacks, def.maxStacks);
      } else {
        this.statuses.set(entryKey, {
          statusId: id, entryKey, casterId, casterName,
          statsSnapshot: { ...snap },
          stacks: Math.min(stacks, def.maxStacks), tickAccum: 0,
          effectiveValuePerStack: evps, isActive: false,
        });
      }
    }
  }

  // Remove all entries for a given statusId.
  removeStatus(id) {
    for (const key of this.statuses.keys()) {
      if (key.startsWith(`${id}:`)) this.statuses.delete(key);
    }
  }

  // Clear every status (called at battle end).
  clearAllStatuses() { this.statuses.clear(); }

  // ── Resource helpers ──────────────────────────────────────────────────
  canAfford(cost) {
    if (!cost) return true;
    return this.resource >= effectiveCost(this.resourceType, cost.amount);
  }

  spendResource(cost) {
    if (!cost) return;
    this.resource = Math.max(0, this.resource - effectiveCost(this.resourceType, cost.amount));
  }

  // ── Armor computation ──────────────────────────────────────────────────
  effectiveArmor() {
    return this.currentArmor;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export class BattleEngine {
  constructor(eventDef, onTick, onLog, onBattleEnd, onActorDied) {
    this.eventDef    = eventDef;
    this.onTick      = onTick;       // called after each tick for UI updates
    this.onLog       = onLog;        // (message, type) => void
    this.onBattleEnd = onBattleEnd;  // ('victory'|'defeat') => void
    this.onActorDied = onActorDied || (() => {});  // (actor) => void

    this.paragons    = [];
    this.enemies     = [];
    this.allActors   = [];

    this.tickTimer   = null;
    this.battleTime  = 0;
    this.active      = false;
    this.ended       = false;
    this.speedMult   = 1;

    this._resolutionQueue = [];
  }

  // ── Build actors ───────────────────────────────────────────────────────
  // deployConfig: Array of {
  //   actorId:            string,
  //   row:                'front'|'back',
  //   slotIndex:          number,
  //   abilityIds:         string[],        // non-null ability ids from both skill panels
  //   equippedItems:      EquippedItems,
  //   startingHP:         number|null,     // if set, overrides full HP
  //   skillLevels:        { [skillType]: number },  // current level per tree
  //   equippedSkillTypes: string[],        // the two active skill panel trees
  // }
  init(deployConfig, eventDef, locationLevel = 1, locationMods = []) {
    this.locationMods = locationMods;
    this.paragons = deployConfig.map(cfg => {
      const def   = DATA.actors[cfg.actorId];
      const actor = new ActorRuntime({ ...def, row: cfg.row });

      // Attach skill progression data so stats.js and XP logic can read it.
      actor.skillLevels        = cfg.skillLevels        ?? {};
      actor.equippedSkillTypes = cfg.equippedSkillTypes ?? [];

      // Replace abilities with only those the player has assigned.
      // Rank is derived from the paragon's current skill level in that tree.
      actor.abilities = (cfg.abilityIds ?? []).map(abilityId => {
        const abDef = DATA.abilities[abilityId];
        if (!abDef) return null;
        const skillLevel = cfg.skillLevels?.[abDef.tree] ?? 1;
        const rankDef    = getRankForLevel(abDef, skillLevel);
        return {
          id: abDef.id, name: abDef.name, icon: abDef.icon,
          tags: abDef.tags ?? [], targeting: abDef.targeting,
          execute: abDef.execute.bind(abDef),
          currentRank: rankDef.rank, rankDef,
          maxCooldown: rankDef.cooldown,
          currentCooldown: rankDef.cooldown * Math.random(),
          cost: rankDef.cost || null,
          isPassive: abDef.isPassive || false,
        };
      }).filter(Boolean);

      // Use pre-built EquippedItems from paragon state (already deserialized).
      actor.equippedItems = cfg.equippedItems ?? actor.equippedItems;
      computeActorStats(actor);
      // Apply persisted HP from previous event if provided (HP does not regen between combats).
      if (cfg.startingHP != null) {
        actor.currentHP = Math.min(actor.maxHP, Math.max(0, cfg.startingHP));
      }
      // Restore persisted Resolve (carries across combats within a run).
      if (cfg.startingResolve != null && actor.resourceType === 'resolve') {
        actor.resource = Math.min(actor.resourceMax, Math.max(0, cfg.startingResolve));
      }
      return actor;
    });
    this.enemies  = [];

    const rows = eventDef.enemyRows;
    Object.entries(rows).forEach(([row, ids]) => {
      ids.forEach(id => {
        const baseDef = DATA.actors[id];
        const effectiveLevel = Math.max(1, locationLevel + (baseDef.levelAdjustment ?? 0));

        const scaledAbilities = (baseDef.abilities ?? []).map(a => {
          const abDef = DATA.abilities[a.abilityId];
          if (!abDef) return a;
          return { abilityId: a.abilityId, rank: getRankForLevel(abDef, effectiveLevel).rank };
        });

        const scaledPhase2 = (baseDef.phase2Abilities ?? []).map(a => {
          const abDef = DATA.abilities[a.abilityId];
          if (!abDef) return a;
          return { abilityId: a.abilityId, rank: getRankForLevel(abDef, effectiveLevel).rank };
        });

        const def = {
          ...baseDef, row,
          abilities: scaledAbilities,
          ...(baseDef.phase2Abilities ? { phase2Abilities: scaledPhase2 } : {}),
        };
        const actor = new ActorRuntime(def);
        actor.level = effectiveLevel;
        equipActorItems(baseDef, actor);
        computeActorStats(actor);
        scaleActorByLevel(actor, effectiveLevel);
        this.enemies.push(actor);
      });
    });

    this.allActors = [...this.paragons, ...this.enemies];
    this.log('The battle begins.', 'system');
  }

  // ── Start / Stop ───────────────────────────────────────────────────────
  start() {
    this.active = true;
    this._scheduleNext();
  }

  stop() {
    this.active = false;
    if (this.tickTimer) { clearTimeout(this.tickTimer); this.tickTimer = null; }
  }

  setSpeed(mult) {
    this.speedMult = mult;
  }

  pause()  { this.stop(); }
  resume() { if (!this.active && !this.ended) this.start(); }

  _scheduleNext() {
    if (!this.active) return;
    this.tickTimer = setTimeout(() => {
      this._tick();
      this._scheduleNext();
    }, (TICK / this.speedMult) * 1000);
  }

  // ── Main Tick ──────────────────────────────────────────────────────────
  _tick() {
    if (this.ended) return;
    this.battleTime += TICK;

    const living = this.allActors.filter(a => !a.isDead);

    // ── Phase 1: Collect ─────────────────────────────────────────────────
    this._resolutionQueue = [];

    living.forEach(actor => {
      const speed    = actor.computeGlobalSpeed();
      actor.globalSpeed = speed;
      const scaledDt = TICK * speed;
      const isStunned = speed === 0;

      // Drain cooldowns (only if not stunned)
      if (!isStunned) {
        actor.abilities.forEach(ab => {
          if (ab.currentCooldown > 0) ab.currentCooldown -= scaledDt;
        });
      }

      // Status durations tick in REAL time regardless of speed
      this._tickStatuses(actor, TICK);

      // Resource regen/decay (real time)
      this._tickResource(actor, TICK);

      // Threat inactivity drain (real time)
      this._tickThreat(actor, TICK);

      // Queue ready abilities
      if (!isStunned) {
        const ready = actor.abilities.filter(ab =>
          ab.currentCooldown <= 0 &&
          actor.canAfford(ab.cost) &&
          !ab.isPassive &&
          !(ab.tag === 'melee' && actor.hasStatus('root'))
        );
        if (ready.length > 0) {
          const chosen = this._aiChooseAbility(actor, ready);
          if (chosen) {
            this._resolutionQueue.push({ actor, ability: chosen });
          }
        }
      }
    });

    // ── Phase 2: Apply ───────────────────────────────────────────────────
    this._resolutionQueue.forEach(({ actor, ability }) => {
      if (actor.isDead) return;
      this._executeAbility(actor, ability);
    });

    // ── Phase 3: Death check ─────────────────────────────────────────────
    const justDied = living.filter(a => a.currentHP <= 0 && !a.isDead);
    justDied.forEach(actor => {
      actor.isDead    = true;
      actor.currentHP = 0;
      this.log(`${actor.name} has fallen.`, 'death');
      this.onActorDied(actor);
      // Grant Resolve to living resolve-type paragons when an enemy is vanquished.
      if (actor.subtype === 'enemy') {
        const gain = actor.subclass === 'boss'  ? 50 :
                     actor.subclass === 'elite' ? 35 : 20;
        this.paragons.forEach(p => {
          if (!p.isDead && p.resourceType === 'resolve')
            p.resource = Math.min(p.resourceMax, p.resource + gain);
        });
      }    });

    // ── Phase 4: Victory check ────────────────────────────────────────────
    if (!this.ended) {
      const enemiesAlive  = this.enemies.filter(e => !e.isDead);
      const paragonsAlive = this.paragons.filter(p => !p.isDead);

      if (enemiesAlive.length === 0) {
        this.onTick(this);
        this._endBattle('victory');
        return;
      }
      if (paragonsAlive.length === 0) {
        this.onTick(this);
        this._endBattle('defeat');
        return;
      }
    }

    this.onTick(this);
  }

  // ── Status ticking ─────────────────────────────────────────────────────
  // Timing model: 1 stack = 2 real seconds. Every 2s the engine fires the
  // tick effect (if any) then decrements 1 stack. Entry is removed when stacks reach 0.
  _tickStatuses(actor, dt) {
    for (const [key, entry] of actor.statuses) {
      const def = DATA.statuses[entry.statusId];
      if (!def) { actor.statuses.delete(key); continue; }

      entry.tickAccum = (entry.tickAccum || 0) + dt;
      if (entry.tickAccum >= 2.0) {
        entry.tickAccum -= 2.0;

        // Fire tick effect before decrementing (e.g. bleeding, burning, regen).
        if (def.tickEffect) {
          const effect = def.tickEffect(actor, entry.stacks, entry.effectiveValuePerStack);
          if (effect) {
            if (!effect.target) effect.target = actor;
            this._applyEffect(actor, effect, def.label);
          }
        }

        // Decrement 1 stack; remove entry when exhausted.
        entry.stacks -= 1;
        if (entry.stacks <= 0) {
          actor.statuses.delete(key);
        }
      }
    }
  }

  // ── Resource ticking ───────────────────────────────────────────────────
  _tickResource(actor, dt) {
    if (actor.resourceType === 'energy') {
      actor.resource = Math.min(actor.resourceMax, actor.resource + actor.resourceRegen * dt);
    } else if (actor.resourceType === 'rage') {
      // decay if not recently acted
      actor.resource = Math.max(0, actor.resource - actor.resourceDecay * dt);
    }
    // Passive item-based regen ticks every 5 real seconds.
    actor.regenTickAccum = (actor.regenTickAccum || 0) + dt;
    if (actor.regenTickAccum >= 5.0) {
      actor.regenTickAccum -= 5.0;
      const stats = actor.stats || {};
      if ((stats.armorRegen ?? 0) > 0) {
        actor.currentArmor = Math.min(actor.maxArmor, actor.currentArmor + stats.armorRegen);
      }
      if ((stats.healthRegen ?? 0) > 0) {
        actor.currentHP = Math.min(actor.maxHP, actor.currentHP + stats.healthRegen);
      }
    }  }

  // ── Threat ticking ─────────────────────────────────────────────────────
  _tickThreat(actor, dt) {
    if (actor.resourceType !== 'threat') return;
    // If stunned for 3+ sec: tracked elsewhere; simple decay approach
    if (actor.hasStatus('stun')) {
      actor.resource = Math.max(0, actor.resource - 5 * dt);
    }
  }

  // ── Ability execution ──────────────────────────────────────────────────
  _executeAbility(actor, ability) {
    // Reset cooldown
    ability.currentCooldown = ability.maxCooldown;

    // Spend resource
    actor.spendResource(ability.cost);
    if (ability.cost && actor.resourceType === 'rage') {
      // spending rage counts as acting
    }

    // Resolve targets
    const targets = this._resolveTargets(actor, ability.targeting);
    if (!targets || targets.length === 0) return;

    this.log(`<span class="actor-name">${actor.name}</span> uses <span class="ability-name">${ability.name}</span>.`, 'damage');

    // Execute effects
    const effects = ability.execute(actor, targets, ability.rankDef);
    effects.forEach(fx => {
      const target = fx.target;
      if (!target || target.isDead) return;
      // Forward ability tags so computeHitDamage can evaluate conditional mods.
      fx._abilityTags = ability.tags ?? [];
      this._applyEffect(actor, fx, ability.name);
    });

    // Rage gain on dealing damage (enemy side handled in _applyEffect)
    if (actor.resourceType === 'rage' && effects.some(e => e.type === 'damage')) {
      actor.resource = Math.min(actor.resourceMax, actor.resource + 3);
    }
    actor.lastActedTime = this.battleTime;
  }

  // ── Apply a single effect ──────────────────────────────────────────────
  _applyEffect(caster, effect, sourceName) {
    const target = effect.target;
    if (!target || target.isDead) return;

    switch (effect.type) {

      case 'damage': {
        let raw = effect.amount;
        const dtype = effect.damageType || 'slashing';
        const isDot  = effect.isDot === true;

        // Guard absorption — active entry's effectiveValuePerStack.
        // Applies to BOTH DoT and direct hits.
        if (!effect.ignoresGuard && target.hasStatus('guard')) {
          const guardEntry = target.getStatus('guard'); // active (strongest) entry
          if (guardEntry && guardEntry.stacks > 0) {
            const absorbPerStack = guardEntry.effectiveValuePerStack;
            const absorbed = guardEntry.stacks * absorbPerStack;
            if (raw <= absorbed) {
              guardEntry.stacks -= Math.ceil(raw / absorbPerStack);
              if (guardEntry.stacks <= 0) target.removeStatus('guard');
              this.log(`<span class="actor-name">${target.name}</span>'s Guard absorbs the hit.`, 'status');
              return;
            } else {
              raw -= absorbed;
              guardEntry.stacks = 0;
              target.removeStatus('guard');
            }
          }
        }

        // TRUE damage: bypasses armor DR and resistance entirely.
        if (dtype === 'true') {
          target.currentHP -= raw;
          this.log(`<span class="actor-name">${target.name}</span> takes <span class="val">${raw}</span> true damage${sourceName ? ` from <span class="ability-name">${sourceName}</span>` : ''}.`, 'damage');
          UI.floatText(target, `-${raw}`, 'damage');
          this._addThreat(target, raw);
          return;
        }

        if (isDot) {
          // ── DoT path: no attacker stat scaling, no armor DR, resistance only ──
          const resistVal = target.getEffectiveResistance(dtype);
          if (resistVal >= 1.0) {
            this.log(`<span class="actor-name">${target.name}</span> is immune to ${dtype} damage.`, 'status');
            return;
          }
          const effective = Math.floor(Math.max(0, raw) * (1 - resistVal));
          if (effective > 0) {
            target.currentHP -= effective;
            this.log(`<span class="actor-name">${target.name}</span> suffers <span class="val">${effective}</span> ${dtype} damage from <span class="ability-name">${sourceName}</span>.`, 'damage');
            UI.floatText(target, `-${effective}`, 'damage');
            this._addThreat(target, effective);
          }

        } else {
          // ── Direct hit path: stat bonuses + crits + armor DR + resistance ──
          const ctx = {
            attacker: caster, defender: target,
            damageType: dtype,
            abilityTags: effect._abilityTags ?? [],
            isCrit: false,
            locationMods: this.locationMods,
          };
          raw = computeHitDamage(raw, ctx);

          // armorDamage keyword: pre-reduce armor before DR calculation.
          if (effect.armorDamage > 0) {
            const aDmg = Math.min(target.currentArmor, effect.armorDamage);
            target.currentArmor -= aDmg;
            if (aDmg > 0) {
              this.log(`<span class="actor-name">${target.name}</span>'s armor corrodes for <span class="val">${aDmg}</span>.`, 'damage');
              UI.floatText(target, `-${aDmg}`, 'armor');
            }
          }

          // Armor DR — 1 DR per 15 current armor.
          const basedr = Math.floor(target.effectiveArmor() / 15);
          const dr     = effect.armorPierce ? Math.floor(basedr * (1 - effect.armorPierce)) : basedr;

          // Resistance — applied to full effective damage.
          const resistVal = target.getEffectiveResistance(dtype);
          if (resistVal >= 1.0) {
            this.log(`<span class="actor-name">${target.name}</span> is immune to ${dtype} damage.`, 'status');
            UI.flashCard(target, 'hit-flash');
            return;
          }
          const effective = Math.floor(Math.max(0, raw - dr) * (1 - resistVal));

          // Distribute between armor pool and HP.
          const armorHit = Math.min(target.currentArmor, effective);
          const hpHit    = effective - armorHit;

          target.currentArmor -= armorHit;
          target.currentHP    -= hpHit;

          const totalShown = armorHit + hpHit;
          if (totalShown > 0) {
            const critPrefix = ctx.isCrit ? 'CRIT! ' : '';
            this.log(`${critPrefix}<span class="actor-name">${target.name}</span> takes <span class="val">${totalShown}</span> ${dtype} damage${armorHit > 0 ? ` (${armorHit} to armor)` : ''}${sourceName ? ` from <span class="ability-name">${sourceName}</span>` : ''}.`, 'damage');
            UI.floatText(target, `-${totalShown}`, 'damage');
          }

          UI.flashCard(target, 'hit-flash');
          this._addThreat(target, totalShown);
        }
        break;
      }

      case 'heal': {
        const before = target.currentHP;
        target.currentHP = Math.min(target.maxHP, target.currentHP + effect.amount);
        const healed = target.currentHP - before;
        if (healed > 0) {
          this.log(`<span class="actor-name">${target.name}</span> recovers <span class="val">${healed}</span> HP.`, 'heal');
          UI.floatText(target, `+${healed}`, 'heal');
          UI.flashCard(target, 'heal-flash');
        }
        break;
      }

      case 'restore_armor': {
        const before = target.currentArmor;
        target.currentArmor = Math.min(target.maxArmor, target.currentArmor + effect.amount);
        const restored = target.currentArmor - before;
        if (restored > 0) {
          this.log(`<span class="actor-name">${target.name}</span> restores <span class="val">${restored}</span> Armor.`, 'heal');
          UI.floatText(target, `+${restored}`, 'armor');
        }
        break;
      }

      case 'apply_status': {
        target.applyStatus(effect.statusId, effect.stacks || 1, caster);
        const def = DATA.statuses[effect.statusId];
        if (def) this.log(`<span class="actor-name">${target.name}</span> is afflicted with <span class="ability-name">${def.label}</span> (${effect.stacks || 1} stack${(effect.stacks || 1) > 1 ? 's' : ''}).`, 'status');
        break;
      }

      case 'drain_threat': {
        if (target.resourceType === 'threat') {
          target.resource = Math.max(0, target.resource - effect.amount);
        }
        break;
      }

      case 'gain_threat': {
        if (target.resourceType === 'threat') {
          target.resource = Math.min(target.resourceMax, target.resource + effect.amount);
        }
        break;
      }
    }
  }

  // ── Threat/Rage management ─────────────────────────────────────────────
  _addThreat(actor, dmgAmount) {
    if (actor.resourceType !== 'threat') {
      // If it's a paragon taking damage, build rage or resolve
      if (actor.resourceType === 'rage') {
        const gain = Math.min(20, 8 + Math.floor(dmgAmount / 5));
        actor.resource = Math.min(actor.resourceMax, actor.resource + gain);
      } else if (actor.resourceType === 'resolve') {
        actor.resource = Math.min(actor.resourceMax, actor.resource + 4);
      }
      return;
    }

    const gain = Math.min(20, 8 + Math.floor(dmgAmount / 8));
    actor.resource = Math.min(actor.resourceMax, actor.resource + gain);

    // Check if we hit 100 → trigger special
    if (actor.resource >= 100 && !actor.isDead) {
      actor.resource = 0;
      this._triggerSpecial(actor);
    }
  }

  _triggerSpecial(actor) {
    const isPhase2 = actor.phase2Active;
    const special  = isPhase2 && actor.phase2SpecialAttack
      ? actor.phase2SpecialAttack
      : actor.specialAttack;

    if (!special) return;

    const playerAlive = this.paragons.filter(p => !p.isDead);
    if (playerAlive.length === 0) return;

    this.log(`⚠ <span class="actor-name">${actor.name}</span> unleashes <span class="ability-name">${special.name}</span>!`, 'special');
    const effects = special.execute(actor, playerAlive);
    effects.forEach(fx => {
      if (!fx.target || fx.target.isDead) return;
      this._applyEffect(actor, fx, special.name);
    });

    // Phase transition for boss
    if (special.isPhaseTransition && !actor.phase2Active) {
      actor.phase2Active = true;
      actor.globalSpeed  = 1.05;
      actor.baseSpeed    = 1.05;
      if (actor.phase2Abilities) {
        actor.abilities = actor.phase2Abilities.map(a => {
          const abDef  = DATA.abilities[a.abilityId];
          const rankDef = abDef.ranks[a.rank - 1] || abDef.ranks[0];
          return {
            id: abDef.id, name: abDef.name, icon: abDef.icon,
            tags: abDef.tags ?? [], targeting: abDef.targeting,
            execute: abDef.execute.bind(abDef),
            currentRank: a.rank, rankDef,
            maxCooldown: rankDef.cooldown,
            currentCooldown: 1.0,
            cost: rankDef.cost || null,
            isPassive: false,
          };
        });
      }
      this.log(`💀 <span class="actor-name">${actor.name}</span> enters Phase II — The Drowned Awakens.`, 'phase');
    }
  }

  // ── Target resolution ──────────────────────────────────────────────────
  // Targeting strings are absolute (from the game-designer's perspective):
  //   single_player_* / all_player_* → always target paragons
  //   single_enemy_*  / all_enemies   → always target enemies
  //   all_allies → targets caster's own side
  _resolveTargets(caster, targeting) {
    const aliveParagons = this.paragons.filter(p => !p.isDead);
    const aliveEnemies  = this.enemies.filter(e => !e.isDead);
    const frontParagons = aliveParagons.filter(p => p.row === 'front');
    const frontEnemies  = aliveEnemies.filter(e => e.row === 'front');

    switch (targeting) {
      case 'self':                return [caster];
      case 'single_enemy_front':  return frontEnemies.length > 0  ? [frontEnemies[0]]               : [aliveEnemies[0]].filter(Boolean);
      case 'single_enemy_any':    return aliveEnemies.length > 0  ? [this._lowestHP(aliveEnemies)]   : [];
      case 'single_player_front': return frontParagons.length > 0 ? [frontParagons[0]]               : [aliveParagons[0]].filter(Boolean);
      case 'single_player_any':   return aliveParagons.length > 0 ? [this._lowestHP(aliveParagons)]  : [];
      case 'all_enemies':         return aliveEnemies;
      case 'all_players':         return aliveParagons;
      case 'all_allies':          return caster.subtype === 'paragon' ? aliveParagons : aliveEnemies;
      case 'all_player_front':    return frontParagons;
      case 'single_enemy_with_splash': {
        const primary = frontEnemies.length > 0 ? frontEnemies[0] : aliveEnemies[0];
        if (!primary) return [];
        const adjacent = aliveEnemies.find(e => e !== primary);
        return adjacent ? [primary, adjacent] : [primary];
      }
      default: {
        const opp = caster.subtype === 'paragon' ? aliveEnemies : aliveParagons;
        return opp.slice(0, 1);
      }
    }
  }

  _lowestHP(actors) {
    return actors.reduce((a, b) => a.currentHP < b.currentHP ? a : b);
  }

  // ── AI: choose best ability ────────────────────────────────────────────
  _aiChooseAbility(actor, readyAbilities) {
    if (readyAbilities.length === 0) return null;

    const isParagon = actor.subtype === 'paragon';
    const enemies   = isParagon ? this.enemies.filter(e => !e.isDead) : this.paragons.filter(p => !p.isDead);
    const allies    = isParagon ? this.paragons.filter(p => !p.isDead) : this.enemies.filter(e => !e.isDead);

    // Score each ready ability
    let best = null, bestScore = -1;

    readyAbilities.forEach(ab => {
      let score = 1.0;

      // Prefer shorter cooldown (fires more often)
      score += (1 / ab.maxCooldown) * 2;

      // Healing when HP low
      if (ab.targeting === 'self' && actor.currentHP < actor.maxHP * 0.4) score += 3;

      // Prefer guard/defensive when taking lots of damage (armor < 30%)
      if (ab.tags?.includes('defensive') && actor.currentArmor < actor.maxArmor * 0.3) score += 2;

      // Prefer AoE when multiple enemies
      if ((ab.targeting === 'all_enemies' || ab.targeting === 'all_players' || ab.targeting === 'all_player_front') && enemies.length >= 2) score += 1.5;

      // Prefer abilities that debuff (slow, stun) on high-threat enemies
      if (ab.id === 'entropy_field' || ab.id === 'shield_bash') score += 1;

      // Slight randomness to avoid determinism
      score += Math.random() * 0.3;

      if (score > bestScore) { bestScore = score; best = ab; }
    });

    return best;
  }

  // ── End battle ─────────────────────────────────────────────────────────
  _endBattle(result) {
    this.ended = true;
    this.active = false;
    if (this.tickTimer) clearTimeout(this.tickTimer);

    if (result === 'victory') {
      this.log('Victory! The enemy is vanquished.', 'system');
    } else {
      this.log('Defeat. The Paragons have fallen.', 'system');
    }

    // Clear all statuses from every actor so nothing bleeds into the next fight.
    this.allActors.forEach(a => a.clearAllStatuses());

    this.onBattleEnd(result);
  }

  // ── Logging helper ─────────────────────────────────────────────────────
  log(msg, type = 'system') {
    this.onLog(msg, type);
  }
}
