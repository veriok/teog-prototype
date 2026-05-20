// js/main.js — Echoes of Germolles: Entry Point & Game State

const Game = {

  state:  null,   // persisted save state
  engine: null,   // active BattleEngine
  zone:   null,   // current zone def
  speedMult: 1,

  // ── Boot ───────────────────────────────────────────────────────────────
  init() {
    UI.init();
    this.state = Save.load();
    this.zone  = DATA.zone; // MVP: single zone

    this._buildStaticUI();
    this._applyEventToUI();

    document.getElementById('btn-start').addEventListener('click',    () => this._onStartBattle());
    document.getElementById('btn-restart').addEventListener('click',  () => this._onRestartZone());
    document.getElementById('btn-next').addEventListener('click',     () => this._onNextEvent());
    document.getElementById('btn-wipe').addEventListener('click',     () => this._onWipe());
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('modal-overlay')) UI.closeModal();
    });

    // Speed buttons
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.speedMult = parseFloat(btn.dataset.speed);
        if (this.engine) this.engine.setSpeed(this.speedMult);
      });
    });

    UI.setStatus('Ready — deploy your Paragons.', '');
  },

  // ── Build static UI elements ───────────────────────────────────────────
  _buildStaticUI() {
    const area = document.getElementById('area-name');
    const desc = document.getElementById('area-desc');
    if (area) area.textContent = this.zone.name;
    if (desc) desc.textContent = this.zone.description;

    UI.buildEventTrack(this.zone, this.state.currentEventIndex);

    // Stats in header
    const statsEl = document.getElementById('run-stats');
    if (statsEl) {
      statsEl.textContent = `Runs: ${this.state.runCount}  |  V: ${this.state.victories}  D: ${this.state.defeats}`;
    }
  },

  // ── Apply current event state to UI ───────────────────────────────────
  _applyEventToUI() {
    const idx = this.state.currentEventIndex;
    const ev  = this.zone.events[idx];

    UI.buildEventTrack(this.zone, idx);

    const startBtn   = document.getElementById('btn-start');
    const nextBtn    = document.getElementById('btn-next');
    const restartBtn = document.getElementById('btn-restart');

    if (this.state.zoneConquered) {
      UI.setStatus('The Flooded Cellars are conquered. Victory eternal.', 'victory');
      startBtn.disabled   = true;
      nextBtn.disabled    = true;
      restartBtn.disabled = false;
      this._showLootEvent({ loot: ['All locations conquered — glory to Germolles!'] });
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

  // ── Show loot event (no battle) ────────────────────────────────────────
  _showLootEvent(ev) {
    const playerFront = document.getElementById('player-front');
    const playerBack  = document.getElementById('player-back');
    const enemyFront  = document.getElementById('enemy-front');
    const enemyBack   = document.getElementById('enemy-back');
    [playerFront, playerBack, enemyFront, enemyBack].forEach(el => el && (el.innerHTML = ''));

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
    const idx = this.state.currentEventIndex;
    const ev  = this.zone.events[idx];
    if (!ev || ev.type === 'loot') return;

    // Stop any existing engine
    if (this.engine) { this.engine.stop(); this.engine = null; }

    UI.clearLog();
    this._clearBattleArea();

    this.engine = new BattleEngine(
      ev,
      (eng) => this._onTick(eng),
      (msg, type) => UI.log(msg, type),
      (result) => this._onBattleEnd(result)
    );

    this.engine.init(['aldric', 'ysolde'], ev);
    this.engine.setSpeed(this.speedMult);

    UI.buildBattleCards(this.engine);
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
    UI.setStatus(result === 'victory' ? 'Victory! Advance.' : 'Defeat. Regroup.', result);

    if (result === 'victory') {
      this.state.victories++;
      document.getElementById('btn-next').disabled = false;

      const idx = this.state.currentEventIndex;
      this.state.completedEvents.push(idx);

      // Check zone complete
      if (idx >= this.zone.events.length - 1) {
        this.state.zoneConquered = true;
        UI.setStatus('Zone Conquered! The Cellars are yours.', 'victory');
        UI.log('The Flooded Cellars have been conquered. The Chapel awaits.', 'system');
      }

    } else {
      this.state.defeats++;
      // Reset zone progress on defeat
      this.state.currentEventIndex = 0;
      this.state.completedEvents   = [];
      document.getElementById('btn-start').disabled   = false;
      document.getElementById('btn-restart').disabled = false;
      UI.log('The location resets. The siege force regroups.', 'system');
      UI.buildEventTrack(this.zone, 0);
    }

    Save.write(this.state);
    this._refreshStats();
  },

  // ── Next event ─────────────────────────────────────────────────────────
  _onNextEvent() {
    if (this.state.zoneConquered) return;

    this.state.currentEventIndex++;

    if (this.state.currentEventIndex >= this.zone.events.length) {
      this.state.zoneConquered = true;
      Save.write(this.state);
      this._applyEventToUI();
      return;
    }

    if (this.engine) { this.engine.stop(); this.engine = null; }

    Save.write(this.state);
    this._applyEventToUI();

    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-next').disabled  = true;
  },

  // ── Restart zone ───────────────────────────────────────────────────────
  _onRestartZone() {
    UI.showModal(
      'Retreat & Regroup',
      'Abandon current progress and reset the location? All event progress will be lost.',
      [
        { label: 'Retreat', cls: 'btn-danger', action: () => this._doRestart() },
        { label: 'Stay', cls: '', action: null }
      ]
    );
  },

  _doRestart() {
    if (this.engine) { this.engine.stop(); this.engine = null; }
    this.state.currentEventIndex = 0;
    this.state.completedEvents   = [];
    this.state.zoneConquered     = false;
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
      'This will permanently delete all save data, statistics, and zone progress. There is no undoing this.',
      [
        {
          label: 'Erase Everything', cls: 'btn-danger', action: () => {
            if (this.engine) { this.engine.stop(); this.engine = null; }
            Save.wipe();
            this.state = Save.load();
            UI.clearLog();
            this._buildStaticUI();
            this._applyEventToUI();
            UI.setStatus('Progress erased. Begin anew.', '');
            document.getElementById('btn-start').disabled   = false;
            document.getElementById('btn-next').disabled    = true;
            document.getElementById('btn-restart').disabled = true;
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
