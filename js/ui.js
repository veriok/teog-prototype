// js/ui.js — Echoes of Germolles: UI Rendering

const UI = {

  // ── Card registry: actorId -> DOM element ─────────────────────────────
  _cards: new Map(),
  _tooltip: null,

  // ── Init ──────────────────────────────────────────────────────────────
  init() {
    this._tooltip = document.createElement('div');
    this._tooltip.className = 'tooltip';
    this._tooltip.style.display = 'none';
    document.body.appendChild(this._tooltip);
    document.addEventListener('mousemove', e => this._moveTooltip(e));
  },

  // ── Build all actor cards for a battle ────────────────────────────────
  buildBattleCards(engine) {
    this._cards.clear();

    // Player side
    const playerFront = document.getElementById('player-front');
    const playerBack  = document.getElementById('player-back');
    playerFront.innerHTML = '';
    playerBack.innerHTML  = '';

    engine.paragons.forEach(actor => {
      const card = this._buildCard(actor);
      this._cards.set(actor.id, card);
      const row = actor.row === 'front' ? playerFront : playerBack;
      row.appendChild(card);
    });

    // Enemy side
    const enemyFront = document.getElementById('enemy-front');
    const enemyBack  = document.getElementById('enemy-back');
    enemyFront.innerHTML = '';
    enemyBack.innerHTML  = '';

    engine.enemies.forEach(actor => {
      const card = this._buildCard(actor);
      this._cards.set(actor.id, card);
      const row = actor.row === 'front' ? enemyFront : enemyBack;
      row.appendChild(card);
    });
  },

  // ── Build a single actor card ─────────────────────────────────────────
  _buildCard(actor) {
    const card = document.createElement('div');
    card.className = 'actor-card';
    card.dataset.actorId = actor.id;

    // Type classes
    if (actor.subtype === 'paragon') card.classList.add('paragon');
    else card.classList.add('enemy');
    if (actor.subclass === 'elite') card.classList.add('elite');
    if (actor.subclass === 'boss')  card.classList.add('boss');

    // Portrait: img if path defined, emoji fallback on error or if missing
    const portraitHTML = actor.portrait
      ? `<div class="card-portrait">
           <img class="portrait-img" src="${actor.portrait}" alt="${actor.name}"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
           <span class="portrait-fallback" style="display:none">${actor.icon}</span>
         </div>`
      : `<div class="card-portrait"><span class="portrait-fallback">${actor.icon}</span></div>`;

    card.innerHTML = `
      <div class="card-header">
        ${portraitHTML}
        <div class="card-info">
          <div class="card-name">${actor.name}</div>
          <div class="card-role">${actor.role}</div>
          <div class="card-level">${actor.subtype === 'paragon' ? 'Paragon' : (actor.subclass === 'boss' ? '☠ BOSS' : actor.subclass === 'elite' ? '★ ELITE' : `Lv.${actor.level}`)}</div>
        </div>
      </div>
      <div class="card-bars">
        <div class="bar-row">
          <div class="bar-label">HP</div>
          <div class="bar-track">
            <div class="bar-fill hp" data-bar="hp" style="width:100%"></div>
          </div>
          <div class="bar-val" data-val="hp">${actor.currentHP}/${actor.maxHP}</div>
        </div>
        <div class="bar-row">
          <div class="bar-label">AR</div>
          <div class="bar-track">
            <div class="bar-fill armor" data-bar="armor" style="width:100%"></div>
          </div>
          <div class="bar-val" data-val="armor">${actor.currentArmor}/${actor.maxArmor}</div>
        </div>
        ${actor.resourceType !== 'none' ? `
        <div class="bar-row">
          <div class="bar-label">${this._resourceLabel(actor.resourceType)}</div>
          <div class="bar-track">
            <div class="bar-fill resource-${actor.resourceType}" data-bar="resource" style="width:${actor.resourceType === 'energy' ? '100' : '0'}%"></div>
          </div>
          <div class="bar-val" data-val="resource">${Math.floor(actor.resource)}/${actor.resourceMax}</div>
        </div>` : ''}
      </div>
      <div class="card-statuses" data-statuses></div>
      <div class="card-abilities" data-abilities></div>
      ${actor.resourceType === 'threat' ? `
      <div class="threat-bar-row">
        <div class="threat-bar-label">
          <span>THREAT</span>
          <span data-val="threat">0/100</span>
        </div>
        <div class="threat-bar-track">
          <div class="threat-bar-fill" data-bar="threat" style="width:0%"></div>
        </div>
      </div>` : ''}
      <div class="death-overlay">✝</div>
    `;

    // Build ability icons
    this._buildAbilityIcons(card, actor);

    return card;
  },

  _resourceLabel(type) {
    return { energy: 'EN', rage: 'RG', faith: 'FT', threat: 'THR' }[type] || '??';
  },

  // ── Build ability icon row ─────────────────────────────────────────────
  _buildAbilityIcons(card, actor) {
    const container = card.querySelector('[data-abilities]');
    container.innerHTML = '';

    actor.abilities.forEach(ab => {
      const el = document.createElement('div');
      el.className = 'ability-icon on-cd';
      el.dataset.abilityId = ab.id;
      el.innerHTML = `${ab.icon}<div class="cd-overlay" style="height:100%"></div>`;
      el.addEventListener('mouseenter', e => this._showTooltip(e, ab));
      el.addEventListener('mouseleave', () => this._hideTooltip());
      container.appendChild(el);
    });
  },

  // ── Update all cards from engine state ────────────────────────────────
  updateAll(engine) {
    [...engine.paragons, ...engine.enemies].forEach(actor => {
      const card = this._cards.get(actor.id);
      if (!card) return;
      this._updateCard(card, actor);
    });
  },

  _updateCard(card, actor) {
    // Dead state
    if (actor.isDead) {
      card.classList.add('dead');
      return;
    }

    // HP bar
    this._updateBar(card, 'hp', actor.currentHP, actor.maxHP);

    // Armor bar
    this._updateBar(card, 'armor', actor.currentArmor, actor.maxArmor);

    // Resource bar
    if (actor.resourceType !== 'none') {
      this._updateBar(card, 'resource', actor.resource, actor.resourceMax);
    }

    // Threat bar
    if (actor.resourceType === 'threat') {
      const fill = card.querySelector('[data-bar="threat"]');
      const val  = card.querySelector('[data-val="threat"]');
      if (fill) fill.style.width = `${Math.min(100, actor.resource)}%`;
      if (val)  val.textContent  = `${Math.floor(actor.resource)}/100`;
    }

    // Status strip
    this._updateStatuses(card, actor);

    // Ability cooldown icons
    this._updateAbilityIcons(card, actor);
  },

  _updateBar(card, key, current, max) {
    const fill = card.querySelector(`[data-bar="${key}"]`);
    const val  = card.querySelector(`[data-val="${key}"]`);
    if (fill) fill.style.width = `${max > 0 ? Math.max(0, (current / max) * 100) : 0}%`;
    if (val) {
      if (key === 'resource') {
        val.textContent = `${Math.floor(current)}/${max}`;
      } else {
        val.textContent = `${Math.max(0, Math.floor(current))}/${max}`;
      }
    }
  },

  _updateStatuses(card, actor) {
    const strip = card.querySelector('[data-statuses]');
    if (!strip) return;
    strip.innerHTML = '';

    actor.statuses.forEach((entry, id) => {
      const def = DATA.statuses[id];
      if (!def) return;
      const icon = document.createElement('div');
      icon.className = `status-icon ${def.cssClass}`;
      icon.textContent = def.icon;
      if (entry.stacks > 1) {
        const sc = document.createElement('span');
        sc.className = 'stack-count';
        sc.textContent = entry.stacks;
        icon.appendChild(sc);
      }
      icon.title = `${def.label} (${Math.ceil(entry.duration)}s): ${def.tooltip}`;
      strip.appendChild(icon);
    });
  },

  _updateAbilityIcons(card, actor) {
    actor.abilities.forEach(ab => {
      const el = card.querySelector(`[data-ability-id="${ab.id}"]`);
      if (!el) return;
      const overlay = el.querySelector('.cd-overlay');
      const pct = ab.maxCooldown > 0 ? Math.max(0, (ab.currentCooldown / ab.maxCooldown)) * 100 : 0;
      if (overlay) overlay.style.height = `${pct}%`;
      el.classList.toggle('ready',  ab.currentCooldown <= 0);
      el.classList.toggle('on-cd',  ab.currentCooldown > 0);
    });
  },

  // ── Flash effects ──────────────────────────────────────────────────────
  flashCard(actor, cssClass) {
    const card = this._cards.get(actor.id);
    if (!card) return;
    card.classList.remove(cssClass);
    void card.offsetWidth; // reflow
    card.classList.add(cssClass);
    setTimeout(() => card.classList.remove(cssClass), 300);
  },

  // ── Floating damage text ───────────────────────────────────────────────
  floatText(actor, text, type) {
    const card = this._cards.get(actor.id);
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = `float-text ${type}`;
    el.textContent = text;
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top  = `${rect.top + 20}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  },

  // ── Tooltip ────────────────────────────────────────────────────────────
  _showTooltip(e, ability) {
    const rank = ability.rankDef;
    let html = `<strong>${ability.name}</strong>`;
    html += `<div class="tt-cd">Cooldown: ${rank.cooldown}s</div>`;
    if (rank.cost) html += `<div class="tt-res">Cost: ${rank.cost.amount} ${rank.cost.type}</div>`;
    if (rank.damage)    html += `<div class="tt-dmg">Damage: ${rank.damage}</div>`;
    if (rank.stunDuration) html += `<div>Stun: ${rank.stunDuration}s</div>`;
    if (rank.guardStacks)  html += `<div>Guard: ${rank.guardStacks} stacks</div>`;
    if (rank.hasteStacks)  html += `<div>Haste: ${rank.hasteStacks} stacks (${rank.hasteDuration}s)</div>`;
    html += `<div style="margin-top:4px;font-style:italic;color:#7a6e8a">Rank ${ability.currentRank}</div>`;
    this._tooltip.innerHTML = html;
    this._tooltip.style.display = 'block';
    this._moveTooltip(e);
  },

  _hideTooltip() {
    this._tooltip.style.display = 'none';
  },

  _moveTooltip(e) {
    if (this._tooltip.style.display === 'none') return;
    const tw = this._tooltip.offsetWidth;
    const th = this._tooltip.offsetHeight;
    let x = e.clientX + 14;
    let y = e.clientY + 14;
    if (x + tw > window.innerWidth  - 8) x = e.clientX - tw - 14;
    if (y + th > window.innerHeight - 8) y = e.clientY - th - 14;
    this._tooltip.style.left = `${x}px`;
    this._tooltip.style.top  = `${y}px`;
  },

  // ── Event track ────────────────────────────────────────────────────────
  buildEventTrack(zone, currentEventIndex) {
    const track = document.getElementById('event-track');
    if (!track) return;
    track.innerHTML = '';

    zone.events.forEach((ev, i) => {
      if (i > 0) {
        const conn = document.createElement('div');
        conn.className = 'event-connector';
        track.appendChild(conn);
      }

      const icons = { fight: '⚔️', loot: '📦', elite: '★', boss: '☠️' };
      const labels = { fight: 'FIGHT', loot: 'LOOT', elite: 'ELITE', boss: 'BOSS' };

      const node = document.createElement('div');
      node.className = `event-node ${ev.type}`;
      if (i < currentEventIndex) node.classList.add('done');
      else if (i === currentEventIndex) node.classList.add('active');
      else node.classList.add('pending');

      node.innerHTML = `
        <div class="event-node-icon">${icons[ev.type] || '?'}</div>
        <span>${ev.label}</span>
      `;
      track.appendChild(node);
    });
  },

  // ── Log ────────────────────────────────────────────────────────────────
  log(msg, type = 'system') {
    const scroll = document.getElementById('log-scroll');
    if (!scroll) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = msg;
    scroll.appendChild(entry);

    // Keep max 120 entries
    while (scroll.children.length > 120) scroll.removeChild(scroll.firstChild);
    scroll.scrollTop = scroll.scrollHeight;
  },

  clearLog() {
    const scroll = document.getElementById('log-scroll');
    if (scroll) scroll.innerHTML = '';
  },

  // ── Result banner ──────────────────────────────────────────────────────
  showResult(type) {
    const banner = document.getElementById('result-banner');
    const text   = document.getElementById('result-banner-text');
    if (!banner || !text) return;
    text.textContent  = type === 'victory' ? 'Victory' : 'Defeat';
    text.className    = `${type}`;
    banner.className  = 'visible';
    setTimeout(() => { banner.className = ''; }, 3500);
  },

  // ── Modal ──────────────────────────────────────────────────────────────
  showModal(title, body, buttons) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML    = body;
    const btnContainer = document.getElementById('modal-buttons');
    btnContainer.innerHTML = '';
    buttons.forEach(({ label, cls, action }) => {
      const btn = document.createElement('button');
      btn.className = `btn ${cls || ''}`;
      btn.textContent = label;
      btn.addEventListener('click', () => {
        this.closeModal();
        if (action) action();
      });
      btnContainer.appendChild(btn);
    });
    document.getElementById('modal-overlay').classList.add('visible');
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('visible');
  },

  // ── Battle status text ─────────────────────────────────────────────────
  setStatus(text, cls) {
    const el = document.getElementById('battle-status');
    if (!el) return;
    el.textContent = text;
    el.className   = cls || '';
  },

  // ── Save indicator ─────────────────────────────────────────────────────
  flashSave() {
    const el = document.getElementById('save-indicator');
    if (!el) return;
    el.textContent = '✦ Saved';
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 1800);
  },
};
