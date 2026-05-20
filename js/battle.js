// js/battle.js — Echoes of Germolles: Battle Engine

const TICK = 0.2; // seconds per tick

class ActorRuntime {
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
        tag: abDef.tag, targeting: abDef.targeting,
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

    // Combat refresh cooldown
    this.combatRefreshCD = 0;

    // Flags
    this.isDead      = false;
    this.isActing    = false; // prevents re-queue in same tick
  }

  // ── Computed GlobalSpeed ──────────────────────────────────────────────
  computeGlobalSpeed() {
    if (this.hasStatus('stun')) return 0;
    let speed = this.baseSpeed;
    const haste = this.getStatus('haste');
    const slow  = this.getStatus('slow');
    if (haste) speed += haste.stacks * 0.15;
    if (slow)  speed -= slow.stacks  * 0.15;
    return Math.max(0.1, speed);
  }

  // ── Status helpers ────────────────────────────────────────────────────
  hasStatus(id)  { return this.statuses.has(id) && !this.statuses.get(id).expired; }
  getStatus(id)  { return this.statuses.get(id) || null; }

  applyStatus(id, stacks, duration) {
    const def = DATA.statuses[id];
    if (!def) return;
    const existing = this.statuses.get(id);

    if (def.stackMode === 'unique') {
      // refresh duration
      this.statuses.set(id, { stacks: 1, duration: Math.max(existing?.duration || 0, duration), tickAccum: 0 });
    } else if (def.stackMode === 'stack') {
      if (existing) {
        existing.stacks = Math.min((existing.stacks || 0) + stacks, def.maxStacks);
        existing.duration = Math.max(existing.duration, duration);
      } else {
        this.statuses.set(id, { stacks: Math.min(stacks, def.maxStacks), duration, tickAccum: 0 });
      }
    }
  }

  removeStatus(id) { this.statuses.delete(id); }

  // ── Resource helpers ──────────────────────────────────────────────────
  canAfford(cost) {
    if (!cost) return true;
    return this.resource >= cost.amount;
  }

  spendResource(cost) {
    if (!cost) return;
    this.resource = Math.max(0, this.resource - cost.amount);
  }

  // ── Armor computation (with shred) ────────────────────────────────────
  effectiveArmor() {
    let armor = this.currentArmor;
    const shred = this.getStatus('armor_shred');
    if (shred) armor = Math.max(0, armor - shred.stacks * 15);
    return armor;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
class BattleEngine {
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
  init(paragonIds, eventDef) {
    this.paragons = paragonIds.map(id => new ActorRuntime(DATA.actors[id]));
    this.enemies  = [];

    const rows = eventDef.enemyRows;
    Object.entries(rows).forEach(([row, ids]) => {
      ids.forEach(id => {
        const def = JSON.parse(JSON.stringify(DATA.actors[id]));
        def.row = row;
        this.enemies.push(new ActorRuntime(def));
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
        if (actor.combatRefreshCD > 0) actor.combatRefreshCD -= scaledDt;
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
    });

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
  _tickStatuses(actor, dt) {
    for (const [id, entry] of actor.statuses) {
      const def = DATA.statuses[id];
      if (!def) { actor.statuses.delete(id); continue; }

      // Duration countdown (real time)
      entry.duration -= dt;
      if (entry.duration <= 0) { actor.statuses.delete(id); continue; }

      // Tick effects
      if (def.tickEffect && def.tickInterval) {
        entry.tickAccum = (entry.tickAccum || 0) + dt;
        if (entry.tickAccum >= def.tickInterval) {
          entry.tickAccum -= def.tickInterval;
          const effect = def.tickEffect(actor, entry.stacks);
          if (effect) this._applyEffect(actor, effect, `${def.label}`);
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
  }

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
        const dtype = effect.damageType || 'physical';

        // Guard absorption (before armor)
        if (!effect.ignoresGuard && target.hasStatus('guard')) {
          const guardEntry = target.getStatus('guard');
          if (guardEntry && guardEntry.stacks > 0) {
            const absorbed = guardEntry.stacks * 5;
            if (raw <= absorbed) {
              guardEntry.stacks -= Math.ceil(raw / 5);
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

        // Compute mitigation
        let mitigation = 0;
        if (dtype === 'physical') {
          mitigation = Math.floor(target.effectiveArmor() / 25);
        } else if (dtype === 'magic' || dtype === 'fire') {
          mitigation = Math.floor(target.effectiveArmor() / 50); // half mitigation
        } else if (dtype === 'acid') {
          mitigation = 0; // hits armor directly, skip to armor damage
        }
        // True damage: no mitigation, no armor
        if (dtype === 'true') {
          target.currentHP -= raw;
          this.log(`<span class="actor-name">${target.name}</span> takes <span class="val">${raw}</span> true damage.`, 'damage');
          UI.floatText(target, `-${raw}`, 'damage');
          // Threat gain on damage taken
          this._addThreat(target, raw);
          return;
        }

        // Armor pierce modifier
        if (effect.armorPierce) mitigation = Math.floor(mitigation * (1 - effect.armorPierce));

        const effective = Math.max(0, raw - mitigation);

        if (dtype === 'acid') {
          // Acid: hits armor pool directly
          const armorDmg = Math.min(target.currentArmor, effective);
          target.currentArmor -= armorDmg;
          this.log(`<span class="actor-name">${target.name}</span>'s armor corrodes for <span class="val">${armorDmg}</span>.`, 'damage');
          UI.floatText(target, `-${armorDmg}`, 'armor');
        } else {
          const armorDmg = Math.min(target.currentArmor, effective);
          const hpDmg    = effective - armorDmg;
          target.currentArmor -= armorDmg;
          target.currentHP    -= hpDmg;
          const totalShown = armorDmg + hpDmg;
          if (totalShown > 0) {
            const logType = dtype === 'fire' ? 'damage' : 'damage';
            this.log(`<span class="actor-name">${target.name}</span> takes <span class="val">${effective}</span> ${dtype} damage${armorDmg > 0 ? ` (${armorDmg} to armor)` : ''}.`, logType);
            UI.floatText(target, `-${effective}`, 'damage');
          }
        }

        UI.flashCard(target, 'hit-flash');
        this._addThreat(target, effective);
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

      case 'combat_refresh': {
        if (target.combatRefreshCD <= 0) {
          const base = 15;
          const before = target.currentArmor;
          target.currentArmor = Math.min(target.maxArmor, target.currentArmor + base);
          const restored = target.currentArmor - before;
          target.combatRefreshCD = 20;
          if (restored > 0) {
            this.log(`<span class="actor-name">${target.name}</span> triggers Combat Refresh (+${restored} Armor).`, 'heal');
            UI.floatText(target, `+${restored}`, 'armor');
          }
        }
        break;
      }

      case 'apply_status': {
        target.applyStatus(effect.statusId, effect.stacks || 1, effect.duration || 5);
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
      // If it's a paragon taking damage, build rage
      if (actor.resourceType === 'rage') {
        const gain = Math.min(20, 8 + Math.floor(dmgAmount / 5));
        actor.resource = Math.min(actor.resourceMax, actor.resource + gain);
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
            tag: abDef.tag, targeting: abDef.targeting,
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
  _resolveTargets(caster, targeting) {
    const isParagon = caster.subtype === 'paragon';
    const enemyList = isParagon ? this.enemies.filter(e => !e.isDead) : this.paragons.filter(p => !p.isDead);
    const allyList  = isParagon ? this.paragons.filter(p => !p.isDead) : this.enemies.filter(e => !e.isDead);

    const frontEnemies = enemyList.filter(e => e.row === 'front');
    const backEnemies  = enemyList.filter(e => e.row === 'back');
    const frontAllies  = allyList.filter(a => a.row === 'front');

    switch (targeting) {
      case 'self':                return [caster];
      case 'single_enemy_front':  return frontEnemies.length > 0 ? [frontEnemies[0]] : [enemyList[0]].filter(Boolean);
      case 'single_enemy_any':    return enemyList.length > 0 ? [this._lowestHP(enemyList)] : [];
      case 'single_player_front': return frontAllies.length > 0 ? [frontAllies[0]] : [allyList[0]].filter(Boolean);
      case 'single_player_any':   return allyList.length > 0 ? [this._lowestHP(allyList)] : [];
      case 'all_enemies':         return enemyList;
      case 'all_players':         return allyList;
      case 'all_allies':          return allyList;
      case 'all_player_front':    return frontAllies;
      case 'single_enemy_with_splash': {
        const primary = frontEnemies.length > 0 ? frontEnemies[0] : enemyList[0];
        if (!primary) return [];
        const adjacent = enemyList.find(e => e !== primary);
        return adjacent ? [primary, adjacent] : [primary];
      }
      default: return enemyList.slice(0, 1);
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
      if (ab.tag === 'defensive' && actor.currentArmor < actor.maxArmor * 0.3) score += 2;

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

    this.onBattleEnd(result);
  }

  // ── Logging helper ─────────────────────────────────────────────────────
  log(msg, type = 'system') {
    this.onLog(msg, type);
  }
}
