// js/main.js — Echoes of Germolles: Entry Point & Game State

import { DATA }         from './data/index.js';
import { Save }         from './save.js';
import { UI }           from './ui.js';
import { BattleEngine } from './battle.js';
import { Inventory }    from './inventory.js';
import { InventoryUI }  from './inventory-ui.js';

const Game = {

  state:          null,   // persisted save state
  inventory:      null,   // Inventory instance
  engine:         null,   // active BattleEngine
  activeLocation: null,   // current DATA.locations entry (when in battle view)
  speedMult:      1,
  _defeatReturnTimer: null,

  // ── Boot ───────────────────────────────────────────────────────────────
  init() {
    UI.init();
    this.state = Save.load();

    this.inventory = new Inventory(this.state.inventoryCapacity ?? 20);
    InventoryUI.init(this.inventory, this.state, () => Save.write(this.state));

    this._initNavTabs();
    this._initBattleControls();

    UI.switchTab('quest');
    UI.showLocationSelect();
    UI.renderLocationSelect(DATA.locations, this.state.locationProgress, locId => {
      this.state.selectedLocationId = locId;
    });

    this._refreshStats();
  },

  // ── Nav tabs ───────────────────────────────────────────────────────────
  _initNavTabs() {
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        UI.switchTab(btn.dataset.tab);
        if (btn.dataset.tab === 'inventory') InventoryUI.render();
      });
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
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('modal-overlay')) UI.closeModal();
    });

    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.speedMult = parseFloat(btn.dataset.speed);
        if (this.engine) this.engine.setSpeed(this.speedMult);
      });
    });
  },

  // ── Enter battle view for the selected location ────────────────────────
  _onEnterBattle() {
    const locId = this.state.selectedLocationId;
    if (!locId) return;
    const loc = DATA.locations.find(l => l.id === locId);
    if (!loc || loc.stub) return;

    this.activeLocation = loc;
    UI.showBattleView();
    this._buildBattleStaticUI();
    this._applyEventToUI();
    UI.setStatus('Ready — deploy your Paragons.', '');
  },

  // ── Return to location map ─────────────────────────────────────────────
  _onBackToMap() {
    const doReturn = () => {
      if (this._defeatReturnTimer) { clearTimeout(this._defeatReturnTimer); this._defeatReturnTimer = null; }
      if (this.engine) { this.engine.stop(); this.engine = null; }
      this.activeLocation = null;
      this.state.selectedLocationId = null;
      Save.write(this.state);
      UI.clearLog();
      UI.showLocationSelect();
      UI.renderLocationSelect(DATA.locations, this.state.locationProgress, locId => {
        this.state.selectedLocationId = locId;
      });
      UI.resetLocationSidebar();
    };

    if (this.engine && this.engine.active) {
      UI.showModal(
        'Withdraw Forces',
        'Your paragons retreat. Progress on this encounter is preserved — you may return and continue.',
        [
          { label: 'Withdraw', cls: 'btn-danger', action: doReturn },
          { label: 'Hold',     cls: '',            action: null }
        ]
      );
    } else {
      doReturn();
    }
  },

  // ── Per-location progress helper ───────────────────────────────────────
  _getLocProgress() {
    const id = this.activeLocation.id;
    if (!this.state.locationProgress[id]) {
      this.state.locationProgress[id] = { currentEventIndex: 0, completedEvents: [], zoneConquered: false };
    }
    return this.state.locationProgress[id];
  },

  // ── Build static header for the battle view ────────────────────────────
  _buildBattleStaticUI() {
    const loc  = this.activeLocation;
    const prog = this._getLocProgress();
    const area = document.getElementById('area-name');
    const desc = document.getElementById('area-desc');
    if (area) area.textContent = loc.name;
    if (desc) desc.textContent = loc.description;
    UI.buildEventTrack(loc, prog.currentEventIndex);
    this._refreshStats();
  },

  // ── Apply current event state to battle UI ─────────────────────────────
  _applyEventToUI() {
    const prog = this._getLocProgress();
    const idx  = prog.currentEventIndex;
    const ev   = this.activeLocation.events[idx];

    UI.buildEventTrack(this.activeLocation, idx);

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

    if (ev.type === 'loot') {
      startBtn.disabled = true;
      nextBtn.disabled  = false;
      UI.setStatus(`Loot Event — ${ev.label}`, 'active');
      this._showLootEvent(ev);
    } else {
      startBtn.disabled = false;
      UI.setStatus(`${ev.type.toUpperCase()} — ${ev.label}. Deploy and engage.`, '');
      this._clearBattleArea();
    }
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
        ? `<div style="padding:20px 28px;font-family:var(--font-heading);color:var(--text-gold);font-size:0.8rem;letter-spacing:0.08em;">
            📦 Supply Cache Contents:<br><br>
            ${ev.loot.map(l => `<div style="color:var(--text-parchment);margin:4px 0">• ${l}</div>`).join('')}
          </div>`
        : '';
    }
  },

  _clearBattleArea() {
    const lootArea = document.getElementById('loot-display');
    if (lootArea) lootArea.innerHTML = '';
  },

  // ── Start battle ───────────────────────────────────────────────────────
  _onStartBattle() {
    const prog = this._getLocProgress();
    const idx  = prog.currentEventIndex;
    const ev   = this.activeLocation.events[idx];
    if (!ev || ev.type === 'loot') return;

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

    this.engine.init(['aldric', 'ysolde'], ev);
    this.engine.setSpeed(this.speedMult);

    UI.buildBattleCards(this.engine);
    requestAnimationFrame(() => UI.equalizeCardHeights());
    UI.setStatus('Battle in progress...', 'active');

    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-next').disabled  = true;

    this.state.runCount++;
    Save.write(this.state);
    this._refreshStats();

    this.engine.start();
  },

  // ── Tick callback ──────────────────────────────────────────────────────
  _onTick(eng) {
    UI.updateAll(eng);
    this._refreshStats();
  },

  // ── Battle end callback ────────────────────────────────────────────────
  _onBattleEnd(result) {
    UI.showResult(result);
    const prog = this._getLocProgress();

    if (result === 'victory') {
      UI.setStatus('Victory! The path ahead clears.', 'victory');
      this.state.victories++;
      document.getElementById('btn-next').disabled = false;
      prog.completedEvents.push(prog.currentEventIndex);

      if (prog.currentEventIndex >= this.activeLocation.events.length - 1) {
        prog.zoneConquered = true;
        UI.setStatus(`${this.activeLocation.name} — conquered.`, 'victory');
        UI.log(`${this.activeLocation.name} has fallen. The paragons hold.`, 'system');
      }

    } else {
      UI.setStatus('Defeat. Your forces are routed.', 'defeat');
      this.state.defeats++;
      // Reset location progress on defeat
      prog.currentEventIndex = 0;
      prog.completedEvents   = [];
      UI.log('Defeat. The survivors retreat to the castle.', 'system');

      // Return to map after the banner clears
      this._defeatReturnTimer = setTimeout(() => {
        this._defeatReturnTimer = null;
        if (this.engine) { this.engine.stop(); this.engine = null; }
        this.activeLocation = null;
        this.state.selectedLocationId = null;
        Save.write(this.state);
        UI.clearLog();
        UI.showLocationSelect();
        UI.renderLocationSelect(DATA.locations, this.state.locationProgress, locId => {
          this.state.selectedLocationId = locId;
        });
        UI.resetLocationSidebar();
      }, 3600);
    }

    Save.write(this.state);
    this._refreshStats();
  },

  // ── Next event ─────────────────────────────────────────────────────────
  _onNextEvent() {
    const prog = this._getLocProgress();
    if (prog.zoneConquered) return;

    prog.currentEventIndex++;

    if (prog.currentEventIndex >= this.activeLocation.events.length) {
      prog.zoneConquered = true;
      Save.write(this.state);
      this._applyEventToUI();
      return;
    }

    if (this.engine) { this.engine.stop(); this.engine = null; }

    Save.write(this.state);
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
    const prog = this._getLocProgress();
    prog.currentEventIndex = 0;
    prog.completedEvents   = [];
    prog.zoneConquered     = false;
    Save.write(this.state);
    UI.clearLog();
    this._applyEventToUI();
    UI.setStatus('Location reset. Ready to advance.', '');
    document.getElementById('btn-start').disabled   = false;
    document.getElementById('btn-next').disabled    = true;
    document.getElementById('btn-restart').disabled = true;
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
