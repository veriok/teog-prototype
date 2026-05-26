// js/main.js — Echoes of Germolles: Entry Point & Game State

import { DATA }              from './data/index.js';
import { Save }              from './save.js';
import { UI }                from './ui.js';
import { BattleEngine }      from './battle.js';
import { Inventory, EquippedItems } from './inventory.js';
import { InventoryUI }       from './inventory-ui.js';
import { collectBattleLoot, collectContainerLoot } from './loot.js';
import { EventType }         from './enums.js';
import { Cinematic }         from './cinematic.js';
import { ParagonUI }         from './paragon-ui.js';
import { checkRequirements } from './requirements.js';
import { xpForEnemy }        from './experience.js';
import { processSkillXp }    from './paragon.js';

const Game = {

  state:          null,   // persisted save state
  inventory:      null,   // Inventory instance
  engine:         null,   // active BattleEngine
  activeLocation: null,   // current DATA.locations entry (when in battle view)
  speedMult:      1,
  _defeatReturnTimer: null,

  // ── Unified save helper ──────────────────────────────────────────
  _save() {
    this.state.inventoryItems = this.inventory.serialize();
    Save.write(this.state);
  },

  // ── Boot ─────────────────────────────────────────────────────
  async init() {
    UI.init();
    this.state = Save.load();

    // Seed unlocked paragons on first launch — only those available by default.
    if (this.state.unlockedParagonIds.length === 0) {
      this.state.unlockedParagonIds = Object.values(DATA.paragons)
        .filter(p => p.unlockedByDefault)
        .map(p => p.id);
    }

    // Auto-deploy Godefroy to front-centre on first launch.
    if (this.state.battlefield.length === 0 && this.state.unlockedParagonIds.includes('godefroy')) {
      this.state.battlefield.push({ row: 'front', index: 1, paragonId: 'godefroy' });
    }

    this.inventory = new Inventory(this.state.inventoryCapacity ?? 20);
    this.inventory.load(this.state.inventoryItems ?? []);

    InventoryUI.init(this.inventory, this.state, () => this._save());
    ParagonUI.init(this.state, this.inventory, () => this.engine, () => this._save());

    this._initNavTabs();
    this._initBattleControls();

    UI.switchTab('quest');
    UI.showLocationSelect();
    UI.renderLocationSelect(DATA.locations, this.state.locationProgress, locId => {
      this.state.selectedLocationId = locId;
    });

    this._refreshStats();

    if (!this.state.introPlayed) {
      await Cinematic.play('game_intro');
      this.state.introPlayed = true;
      this._save();
    }
  },

  // ── Nav tabs ───────────────────────────────────────────────────────────
  _initNavTabs() {
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        UI.switchTab(btn.dataset.tab);
        if (btn.dataset.tab === 'inventory') InventoryUI.render();        if (btn.dataset.tab === 'paragons')  ParagonUI.render();      });
    });
  },

  // ── Wire all battle-view controls ─────────────────────────────────────
  _initBattleControls() {
    document.getElementById('btn-to-battle').addEventListener('click',  () => this._onEnterBattle());
    document.getElementById('btn-back-to-map').addEventListener('click',() => this._onBackToMap());
    document.getElementById('btn-start').addEventListener('click',      () => this._onStartBattle());
    document.getElementById('btn-restart').addEventListener('click',    () => this._onRestartZone());
    document.getElementById('btn-next').addEventListener('click',       () => this._onNextEvent());
    document.getElementById('btn-wipe').addEventListener('click',       () => this._onWipe());
    document.getElementById('btn-pause').addEventListener('click',      () => this._onTogglePause());
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('modal-overlay') && !Cinematic.isPlaying) UI.closeModal();
    });

    document.querySelectorAll('.speed-btn:not(#btn-pause)').forEach(btn => {
      btn.addEventListener('click', () => {
        if (Cinematic.isPlaying) return;
        document.querySelectorAll('.speed-btn:not(#btn-pause)').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.speedMult = parseFloat(btn.dataset.speed);
        if (this.engine) {
          this.engine.setSpeed(this.speedMult);
          // Selecting a speed resumes the engine if it was paused.
          if (!this.engine.active && !this.engine.ended) {
            this.engine.resume();
            document.getElementById('btn-pause')?.classList.remove('active');
            UI.setStatus('Battle in progress...', 'active');
          }
        }
      });
    });
  },

  // ── Pause / resume toggle ──────────────────────────────────────
  _onTogglePause() {
    if (!this.engine || this.engine.ended) return;
    const btn = document.getElementById('btn-pause');
    if (this.engine.active) {
      this.engine.pause();
      btn?.classList.add('active');
      UI.setStatus('Paused.', '');
    } else {
      this.engine.resume();
      btn?.classList.remove('active');
      UI.setStatus('Battle in progress...', 'active');
    }
  },

  // ── Enter battle view for the selected location ────────────────────────
  _onEnterBattle() {
    const locId = this.state.selectedLocationId;
    if (!locId) return;
    const loc = DATA.locations.find(l => l.id === locId);
    if (!loc || loc.stub) return;

    this.activeLocation = loc;
    UI.showBattleView();
    UI.resetBattleArea();
    UI.clearLog();
    this._buildBattleStaticUI();
    this._applyEventToUI();
    UI.setStatus('Ready — deploy your Paragons.', '');
  },

  // ── Return to location map ─────────────────────────────────────────────
  _onBackToMap() {
    UI.showModal(
      'Retreat',
      'Your forces pull back. All progress on this encounter will be lost.',
      [
        { label: 'Retreat', cls: 'btn-danger', action: () => this._returnToMap() },
        { label: 'Hold',    cls: '',           action: null }
      ]
    );
  },

  // ── Per-location progress helper ───────────────────────────────────────
  _getLocProgress() {
    const id = this.activeLocation.id;
    if (!this.state.locationProgress[id]) {
      this.state.locationProgress[id] = {
        currentEventIndex: 0, completedEvents: [], zoneConquered: false,
        paragonHP: {}, resolvedEvents: {}, randomEventCounts: {},
      };
    }
    // Ensure new fields exist on saves migrated from older versions.
    const p = this.state.locationProgress[id];
    if (!p.paragonHP)         p.paragonHP         = {};
    if (!p.resolvedEvents)    p.resolvedEvents    = {};
    if (!p.randomEventCounts) p.randomEventCounts = {};
    return p;
  },

  // ── Build static header for the battle view ────────────────────────────
  _buildBattleStaticUI() {
    const loc  = this.activeLocation;
    const prog = this._getLocProgress();
    const area = document.getElementById('area-name');
    const desc = document.getElementById('area-desc');
    if (area) area.textContent = loc.name;
    if (desc) desc.textContent = loc.description;
    UI.buildEventTrack(loc, prog.currentEventIndex, prog.resolvedEvents ?? {});
    this._refreshStats();
  },

  // ── Apply current event state to battle UI ─────────────────────────────
  _applyEventToUI() {
    const prog  = this._getLocProgress();
    const idx   = prog.currentEventIndex;
    const rawEv = this.activeLocation.events[idx];

    UI.buildEventTrack(this.activeLocation, idx, prog.resolvedEvents ?? {});

    const startBtn   = document.getElementById('btn-start');
    const nextBtn    = document.getElementById('btn-next');
    const restartBtn = document.getElementById('btn-restart');

    if (prog.zoneConquered) {
      UI.setStatus(`${this.activeLocation.name} — conquered.`, 'victory');
      startBtn.disabled   = true;
      nextBtn.disabled    = true;
      restartBtn.disabled = false;
      this._showLootEvent({ loot: ['All encounters cleared — the location is yours.'] });
      return;
    }

    nextBtn.disabled    = true;
    restartBtn.disabled = (idx === 0);

    // ── Resolve RANDOM nodes on first entry ────────────────────────────
    if (rawEv.type === EventType.RANDOM && !prog.resolvedEvents[idx]) {
      const resolved = this._resolveRandomEvent(idx);
      if (!resolved) {
        UI.log('(No events available for this node — advancing.)', 'system');
        setTimeout(() => this._onNextEvent(), 600);
        return;
      }      // Re-render track now that the current node is resolved.
      UI.buildEventTrack(this.activeLocation, idx, prog.resolvedEvents ?? {});    }

    // ── Requirements check on fixed events ────────────────────────────
    const ctx = { inventory: this.inventory, state: this.state };
    if (rawEv.type !== EventType.RANDOM && rawEv.requirements) {
      if (!checkRequirements(rawEv.requirements, ctx)) {
        startBtn.disabled = true;
        UI.setStatus('Encounter locked — requirements not met. Advancing...', 'system');
        UI.log('An encounter was skipped — requirements not met.', 'system');
        setTimeout(() => this._onNextEvent(), 800);
        return;
      }
    }

    // ── Effective event def (resolved if RANDOM, raw otherwise) ────────
    const ev = rawEv.type === EventType.RANDOM ? prog.resolvedEvents[idx] : rawEv;

    // ── REST_SPOT ──────────────────────────────────────────────────────
    if (ev.type === EventType.REST_SPOT) {
      startBtn.disabled = true;
      this._clearBattleArea();
      if (prog.completedEvents.includes(idx)) {
        nextBtn.disabled = false;
        UI.setStatus(`Rest Spot — ${ev.label} (already visited)`, '');
      } else {
        nextBtn.disabled = true;
        UI.setStatus(`Rest Spot — ${ev.label}`, '');
        this._onRestSpotEvent(ev);
      }
      return;
    }

    // ── LOOT ──────────────────────────────────────────────────────────
    if (ev.type === EventType.LOOT) {
      startBtn.disabled = true;
      nextBtn.disabled  = true;
      UI.setStatus(`Container — ${ev.label}`, '');
      this._clearBattleArea();
      if (prog.completedEvents.includes(idx)) {
        nextBtn.disabled = false;
        UI.setStatus(`Container — ${ev.label} (already looted)`, '');
      } else {
        this._onLootEvent(ev);
      }
      return;
    }

    // ── Combat events (FIGHT / ELITE / BOSS) ──────────────────────────
    startBtn.disabled = false;
    UI.setStatus(`${ev.type.toUpperCase()} — ${ev.label ?? ev.type}. Deploy and engage.`, '');
    this._clearBattleArea();
  },

  // ── Show loot event ────────────────────────────────────────────────────
  _showLootEvent(ev) {
    ['bf-player-back', 'bf-player-front', 'bf-enemy-front', 'bf-enemy-back'].forEach(id => {
      const col = document.getElementById(id);
      if (col) col.querySelectorAll('.actor-card').forEach(c => c.remove());
    });
    const lootArea = document.getElementById('loot-display');
    if (lootArea) {
      lootArea.innerHTML = ev.loot
        ? `<div style="padding:20px 28px;font-family:var(--font-heading);font-size:0.8rem;letter-spacing:0.08em;">
            ${ev.loot.map(l => `<div style="color:var(--text-parchment);margin:4px 0">${l}</div>`).join('')}
          </div>`
        : '';
    }
  },

  _clearBattleArea() {
    const lootArea = document.getElementById('loot-display');
    if (lootArea) lootArea.innerHTML = '';
  },

  // ── Loot container event ───────────────────────────────────────────────
  async _onLootEvent(ev) {
    const prog = this._getLocProgress();
    const { added, currencies, overflowed } = collectContainerLoot(
      ev, this.inventory, this.state, this.activeLocation.level
    );
    prog.completedEvents.push(prog.currentEventIndex);
    this._save();
    if (InventoryUI._isInventoryTabActive()) InventoryUI.render();
    if (ev.cinematicId) await Cinematic.play(ev.cinematicId);
    UI.showLootModal(`Container — ${ev.label}`, added, currencies, overflowed, () => {
      this._onNextEvent();
    });
  },

  // ── Start battle ───────────────────────────────────────────────────────
  async _onStartBattle() {
    const prog  = this._getLocProgress();
    const idx   = prog.currentEventIndex;
    const rawEv = this.activeLocation.events[idx];
    if (!rawEv) return;

    // Use resolved event for RANDOM nodes.
    const ev = rawEv.type === EventType.RANDOM
      ? prog.resolvedEvents?.[idx]
      : rawEv;

    if (!ev || ev.type === EventType.LOOT || ev.type === EventType.REST_SPOT) return;

    if (this.engine) { this.engine.stop(); this.engine = null; }

    UI.clearLog();
    this._clearBattleArea();

    this.engine = new BattleEngine(
      ev,
      (eng)       => this._onTick(eng),
      (msg, type) => UI.log(msg, type),
      (result)    => this._onBattleEnd(result),
      (actor)     => UI.actorDied(actor)
    );

    // Build deployConfig from saved battlefield + paragon states.
    // Dead paragons (HP stored as 0) are excluded — they must be revived at a rest spot.
    const deployConfig = (this.state.battlefield ?? [])
      .filter(entry => (prog.paragonHP?.[entry.paragonId] ?? 1) > 0)
      .map(entry => {
      const ps       = this.state.paragonStates?.[entry.paragonId];
      const equipped = EquippedItems.deserialize(ps?.equippedItems ?? {});
      const abilityIds = [];
      for (const tree of (ps?.activeSkillTypes ?? [])) {
        if (!tree) continue;
        for (const id of (ps?.skillAbilitySlots?.[tree] ?? [])) {
          if (id) abilityIds.push(id);
        }
      }
      return {
        actorId:            entry.paragonId,
        row:                entry.row,
        slotIndex:          entry.index,
        abilityIds,
        equippedItems:      equipped,
        startingHP:         prog.paragonHP?.[entry.paragonId] ?? null,
        skillLevels:        ps?.skillLevels        ?? {},
        equippedSkillTypes: ps?.activeSkillTypes    ?? [],
      };
    });

    // Fallback: if no battlefield configured, deploy default paragons (excluding dead ones).
    const config = deployConfig.length > 0
      ? deployConfig
      : this.state.unlockedParagonIds
          .filter(id => (prog.paragonHP?.[id] ?? 1) > 0)
          .slice(0, 2).map((id, i) => ({
          actorId: id, row: i === 0 ? 'front' : 'back', slotIndex: 0,
          abilityIds: Object.values(
            DATA.actors[id]?.abilities ?? []
          ).map(a => a.abilityId),
          equippedItems: new EquippedItems(),
          startingHP:   prog.paragonHP?.[id] ?? null,
        }));

    this.engine.init(config, ev, this.activeLocation.level ?? 1, this.activeLocation.combatMods ?? []);
    this.engine.setSpeed(this.speedMult);

    UI.buildBattleCards(this.engine);
    requestAnimationFrame(() => UI.equalizeCardHeights());
    UI.setStatus('Battle in progress...', 'active');

    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-next').disabled  = true;
    document.getElementById('btn-pause')?.classList.remove('active');

    this.state.runCount++;
    this._save();
    this._refreshStats();

    if (ev.cinematicId) await Cinematic.play(ev.cinematicId);
    this.engine.start();
  },

  // ── Tick callback ──────────────────────────────────────────────────────
  _onTick(eng) {
    UI.updateAll(eng);
    this._refreshStats();
  },

  // ── Battle end callback ────────────────────────────────────────────────
  async _onBattleEnd(result) {
    const prog = this._getLocProgress();

    document.getElementById('btn-pause')?.classList.remove('active');

    // Award XP to equipped skills for both victory and defeat.
    this._awardCombatXp();

    if (result === 'victory') {
      this.state.victories++;
      prog.completedEvents.push(prog.currentEventIndex);

      // Persist surviving paragon HP — carries into the next combat event.
      // Dead paragons are stored at 0 so they remain dead until a rest spot revives them.
      if (!prog.paragonHP) prog.paragonHP = {};
      this.engine.paragons.forEach(p => {
        if (!p.isDead) prog.paragonHP[p.defId] = p.currentHP;
        else           prog.paragonHP[p.defId] = 0;
      });

      const defeatedEnemies = this.engine.enemies;
      const { added, overflowed } = collectBattleLoot(
        defeatedEnemies, this.inventory, this.state
      );
      this._save();

      const isLastEvent = prog.currentEventIndex >= this.activeLocation.events.length - 1;
      if (isLastEvent) {
        prog.zoneConquered = true;
        UI.setStatus(`${this.activeLocation.name} — conquered.`, 'victory');
        UI.log(`${this.activeLocation.name} has fallen. The paragons hold.`, 'system');
      } else {
        UI.setStatus('Victory! The path ahead clears.', 'victory');
      }

      if (isLastEvent) await this._checkParagonUnlocks('zone_conquered');
      const title = isLastEvent ? `${this.activeLocation.name} — Conquered!` : 'Victory';
      UI.showLootModal(title, added, {}, overflowed, () => { this._onNextEvent(); });

    } else {
      UI.setStatus('Defeat. Your forces are routed.', 'defeat');
      this.state.defeats++;
      this._onLocationExit(this.activeLocation.id, 'defeat');
      prog.currentEventIndex = 0;
      prog.completedEvents   = [];
      UI.log('Defeat. The survivors retreat to the castle.', 'system');
      this._save();
      this._refreshStats();
      await this._checkParagonUnlocks('defeat_count');
      UI.showModal(
        'Defeat',
        '<p style="font-family:var(--font-body);color:var(--text-parchment)">Your forces are routed. The paragons retreat to safety.</p>',
        [{ label: 'Exit to Map', action: () => this._returnToMap() }]
      );
      return;
    }

    this._save();
    this._refreshStats();
  },
  // ── Paragon unlock check ───────────────────────────────────────────────────
  // Iterates paragons with unlockCondition matching `trigger`, fires cinematics
  // and adds to unlockedParagonIds for any whose condition is now satisfied.
  // Safe to call multiple times — already-unlocked paragons are skipped.
  async _checkParagonUnlocks(trigger) {
    for (const def of Object.values(DATA.paragons)) {
      if (!def.unlockCondition) continue;
      if (def.unlockCondition.trigger !== trigger) continue;
      if (this.state.unlockedParagonIds.includes(def.id)) continue;

      let conditionMet = false;
      if (trigger === 'defeat_count') {
        conditionMet = this.state.defeats >= def.unlockCondition.count;
      } else if (trigger === 'zone_conquered') {
        conditionMet = !!this.state.locationProgress[def.unlockCondition.locationId]?.zoneConquered;
      }
      if (!conditionMet) continue;

      this.state.unlockedParagonIds.push(def.id);
      this._save();
      UI.log(`${def.name} has joined your cause.`, 'system');
      if (def.unlockCinematicId) await Cinematic.play(def.unlockCinematicId);
    }
  },
  // ── Award skill XP to paragons after combat ────────────────────────────
  // Called for both victory and defeat. Only equipped skill trees gain XP.
  _awardCombatXp() {
    const enemies = this.engine.enemies;
    if (!enemies || enemies.length === 0) return;

    for (const paragon of this.engine.paragons) {
      const ps  = this.state.paragonStates?.[paragon.defId];
      const def = DATA.actors[paragon.defId];
      if (!ps || !def) continue;

      const equipped = paragon.equippedSkillTypes ?? ps.activeSkillTypes ?? [];
      const xpLines  = [];
      let   anyLevelUp = false;

      for (const tree of equipped) {
        if (!tree) continue;

        // Ensure skill state exists (handles first-time or migrated saves).
        ps.skillLevels[tree] ??= 1;
        ps.skillXP[tree]     ??= 0;

        const totalXp = enemies.reduce(
          (sum, e) => sum + xpForEnemy(e, ps.skillLevels[tree]),
          0
        );
        if (totalXp <= 0) { xpLines.push(`${tree}: +0 XP`); continue; }

        const { newLevel, levelsGained, rankUps } =
          processSkillXp(ps, tree, totalXp, paragon.defId, def);

        xpLines.push(`${tree}: +${totalXp} XP`);

        if (levelsGained > 0) {
          anyLevelUp = true;
          UI.log(
            `${paragon.name} — ${tree} reached level ${newLevel}!`,
            'system'
          );
          for (const { abilityId, newRank } of rankUps) {
            const abName = DATA.abilities[abilityId]?.name ?? abilityId;
            UI.log(`  ${abName} advanced to Rank ${newRank}.`, 'system');
          }
        }
      }

      UI.log(
        `${paragon.name} gained XP — ${xpLines.join(' · ')}`,
        'system'
      );
    }
  },

  // ── Return to location map (shared by defeat + back-to-map) ───────────
  _returnToMap() {
    if (this._defeatReturnTimer) { clearTimeout(this._defeatReturnTimer); this._defeatReturnTimer = null; }
    if (this.engine) { this.engine.stop(); this.engine = null; }
    document.getElementById('btn-pause')?.classList.remove('active');
    if (this.activeLocation) {
      const locId = this.activeLocation.id;
      this._onLocationExit(locId, 'defeat');
      const prog = this.state.locationProgress?.[locId];
      if (prog) {
        prog.currentEventIndex = 0;
        prog.completedEvents   = [];
        prog.zoneConquered     = false;
      }
    }
    this.activeLocation = null;
    this.state.selectedLocationId = null;
    this._save();
    UI.clearLog();
    UI.showLocationSelect();
    UI.renderLocationSelect(DATA.locations, this.state.locationProgress, locId => {
      this.state.selectedLocationId = locId;
    });
    UI.resetLocationSidebar();
  },

  // ── Next event ─────────────────────────────────────────────────────────
  _onNextEvent() {
    const prog = this._getLocProgress();
    if (prog.zoneConquered) return;

    prog.currentEventIndex++;

    if (prog.currentEventIndex >= this.activeLocation.events.length) {
      prog.zoneConquered = true;
      this._save();
      this._applyEventToUI();
      return;
    }

    if (this.engine) { this.engine.stop(); this.engine = null; }

    this._save();
    this._applyEventToUI();
  },

  // ── Restart zone ───────────────────────────────────────────────────────
  _onRestartZone() {
    UI.showModal(
      'Retreat & Regroup',
      'Reset all progress in this location? Completed encounters will be lost.',
      [
        { label: 'Reset', cls: 'btn-danger', action: () => this._doRestart() },
        { label: 'Stay',  cls: '',           action: null }
      ]
    );
  },

  _doRestart() {
    if (this.engine) { this.engine.stop(); this.engine = null; }
    document.getElementById('btn-pause')?.classList.remove('active');
    const prog = this._getLocProgress();
    this._onLocationExit(this.activeLocation.id, 'restart');
    prog.currentEventIndex = 0;
    prog.completedEvents   = [];
    prog.zoneConquered     = false;
    this._save();
    UI.clearLog();
    this._applyEventToUI();
    UI.setStatus('Location reset. Ready to advance.', '');
    document.getElementById('btn-start').disabled   = false;
    document.getElementById('btn-next').disabled    = true;
    document.getElementById('btn-restart').disabled = true;
  },

  // ── Location exit — wipes per-run state; hook point for cinematics ────
  // reason: 'defeat' | 'voluntary' | 'restart'
  // Called on defeat in _onBattleEnd, on map exit in _returnToMap,
  // and on restart in _doRestart. Safe to call multiple times (idempotent).
  _onLocationExit(locId, reason) {  // eslint-disable-line no-unused-vars
    const prog = this.state.locationProgress?.[locId];
    if (!prog) return;
    prog.paragonHP         = {};
    prog.resolvedEvents    = {};
    prog.randomEventCounts = {};
    // Future: trigger defeat/exit cinematic keyed on reason + locId
    // e.g. if (reason === 'defeat') await Cinematic.play(`${locId}_defeat`);
  },

  // ── Resolve a RANDOM event node at the given index ────────────────────
  _resolveRandomEvent(idx) {
    const loc  = this.activeLocation;
    const prog = this._getLocProgress();
    const ctx  = { inventory: this.inventory, state: this.state };

    // Filter table by requirements and per-run cap.
    const available = (loc.randomEventTable || []).filter(entry => {
      if (entry.requirements && !checkRequirements(entry.requirements, ctx)) return false;
      if (entry.maxPerRun != null) {
        const used = prog.randomEventCounts?.[entry.type] || 0;
        if (used >= entry.maxPerRun) return false;
      }
      return true;
    });
    if (available.length === 0) return null;

    // Weighted random pick.
    const totalWeight = available.reduce((s, e) => s + e.weight, 0);
    let roll   = Math.random() * totalWeight;
    let chosen = available[available.length - 1];
    for (const entry of available) {
      roll -= entry.weight;
      if (roll <= 0) { chosen = entry; break; }
    }

    // Build the resolved event definition.
    let resolved;
    if (chosen.type === EventType.FIGHT || chosen.type === EventType.ELITE) {
      const comp      = chosen.composition || { front: { min: 1, max: 2 }, back: { min: 0, max: 1 } };
      const frontPool = (loc.enemyPool || []).filter(e => e.preferredRow === 'front');
      const backPool  = (loc.enemyPool || []).filter(e => e.preferredRow === 'back');
      const frontCount = comp.front.min + Math.floor(Math.random() * (comp.front.max - comp.front.min + 1));
      const backCount  = comp.back.min  + Math.floor(Math.random() * (comp.back.max  - comp.back.min  + 1));
      const frontIds   = this._samplePool(frontPool.length > 0 ? frontPool : loc.enemyPool, frontCount);
      const backIds    = this._samplePool(backPool.length  > 0 ? backPool  : [],            backCount);
      resolved = {
        type:      chosen.type,
        label:     chosen.type === EventType.ELITE ? 'Wanderer' : 'Skirmish',
        enemies:   [...frontIds, ...backIds],
        enemyRows: { front: frontIds, back: backIds },
      };
    } else if (chosen.type === EventType.LOOT) {
      resolved = {
        type:        EventType.LOOT,
        label:       'Salvage',
        loot:        chosen.loot        || [],
        cinematicId: chosen.cinematicId || null,
      };
    } else {
      resolved = { type: chosen.type, label: String(chosen.type) };
    }

    if (!prog.resolvedEvents)    prog.resolvedEvents    = {};
    if (!prog.randomEventCounts) prog.randomEventCounts = {};
    prog.resolvedEvents[idx] = resolved;
    prog.randomEventCounts[chosen.type] = (prog.randomEventCounts[chosen.type] || 0) + 1;
    this._save();
    return resolved;
  },

  // ── Weighted sample without replacement from an actor pool entry list ─
  _samplePool(pool, count) {
    if (!pool || pool.length === 0 || count <= 0) return [];
    const results   = [];
    const remaining = [...pool];
    const n = Math.min(count, remaining.length);
    for (let i = 0; i < n; i++) {
      const total = remaining.reduce((s, e) => s + e.weight, 0);
      let roll   = Math.random() * total;
      let chosen = remaining.length - 1;
      for (let j = 0; j < remaining.length; j++) {
        roll -= remaining[j].weight;
        if (roll <= 0) { chosen = j; break; }
      }
      results.push(remaining[chosen].actorId);
      remaining.splice(chosen, 1);
    }
    return results;
  },

  // ── Handle rest spot — apply HP healing, show rest scene ──────────────
  _onRestSpotEvent(ev) {
    const prog = this._getLocProgress();
    if (!prog.paragonHP) prog.paragonHP = {};

    // Determine deployed paragons (battlefield config or fallback).
    const deployed = this.state.battlefield?.length > 0
      ? this.state.battlefield
      : this.state.unlockedParagonIds.slice(0, 2).map((id, i) => ({ paragonId: id, row: i === 0 ? 'front' : 'back' }));

    const healedParagons = [];
    for (const entry of deployed) {
      const def   = DATA.actors[entry.paragonId];
      if (!def) continue;
      const maxHP  = def.baseHP;
      const before = prog.paragonHP[entry.paragonId] ?? maxHP;
      const isDead = before === 0;
      const healed = Math.min(maxHP, Math.round(before + maxHP * (ev.healPercent ?? 0.3)));
      const gained = healed - before;
      prog.paragonHP[entry.paragonId] = healed;
      healedParagons.push({ id: entry.paragonId, def, currentHP: healed, maxHP, gained, isDead });
    }

    prog.completedEvents.push(prog.currentEventIndex);
    this._save();

    // Log healing to the battle chronicle.
    for (const p of healedParagons) {
      if (p.isDead) {
        UI.log(`<span class="actor-name">${p.def.name}</span> is revived with <span class="val">${p.currentHP}</span> HP at the rest spot.`, 'heal');
      } else if (p.gained > 0) {
        UI.log(`<span class="actor-name">${p.def.name}</span> recovers <span class="val">${p.gained}</span> HP at the rest spot.`, 'heal');
      } else {
        UI.log(`<span class="actor-name">${p.def.name}</span> is already at full HP.`, 'heal');
      }
    }

    document.getElementById('btn-next').disabled = false;

    // Sync healed HP back into any live actor cards from the previous battle.
    if (this.engine) {
      this.engine.paragons.forEach(p => {
        const hp = prog.paragonHP[p.defId];
        if (hp != null) p.currentHP = hp;
      });
      UI.updateAll(this.engine);
    }

    UI.showRestSpot(ev, healedParagons);
  },

  // ── Set a game progression flag ────────────────────────────────────────
  setFlag(id, value) {
    if (!this.state.gameFlags) this.state.gameFlags = {};
    this.state.gameFlags[id] = value;
    this._save();
  },

  // ── Wipe save ──────────────────────────────────────────────────────────
  _onWipe() {
    UI.showModal(
      'Erase All Progress',
      'This will permanently delete all save data, statistics, and location progress. There is no undoing this.',
      [
        {
          label: 'Erase Everything', cls: 'btn-danger', action: () => {
            if (this._defeatReturnTimer) { clearTimeout(this._defeatReturnTimer); this._defeatReturnTimer = null; }
            if (this.engine) { this.engine.stop(); this.engine = null; }
            Save.wipe();
            this.state          = Save.load();
            this.activeLocation = null;
            UI.clearLog();
            UI.showLocationSelect();
            UI.renderLocationSelect(DATA.locations, this.state.locationProgress, locId => {
              this.state.selectedLocationId = locId;
            });
            UI.resetLocationSidebar();
            this._refreshStats();
          }
        },
        { label: 'Cancel', cls: '', action: null }
      ]
    );
  },

  // ── Refresh stats display ──────────────────────────────────────────────
  _refreshStats() {
    const el = document.getElementById('run-stats');
    if (el) el.textContent = `Runs: ${this.state.runCount}  |  V: ${this.state.victories}  D: ${this.state.defeats}`;
  },
};

// ── Boot on DOMContentLoaded ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => Game.init());
