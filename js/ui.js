// js/ui.js — Echoes of Germolles: UI Rendering

import { DATA }           from './data/index.js';
import { CURRENCY_CONFIG } from './enums.js';
import { Tooltips }        from './tooltips.js';

export const UI = {

  // ── Card registry: actorId -> DOM element ─────────────────────────────
  _cards: new Map(),

  // ── Init ──────────────────────────────────────────────────────────────
  init() {
    Tooltips.init();
  },

  // ── Build all actor cards for a battle ────────────────────────────────
  buildBattleCards(engine) {
    this._cards.clear();

    const MAX_SLOTS = 3;

    const fillCol = (colId, actors) => {
      const col = document.getElementById(colId);
      if (!col) return;
      col.querySelectorAll('.actor-card').forEach(c => c.remove());
      // Build a slot-indexed array so each actor appears in its assigned position.
      const slots = new Array(MAX_SLOTS).fill(null);
      for (const actor of actors) {
        const idx = actor.slotIndex ?? 0;
        slots[Math.min(idx, MAX_SLOTS - 1)] = actor;
      }
      for (let i = 0; i < MAX_SLOTS; i++) {
        if (slots[i]) {
          const card = this._buildCard(slots[i]);
          this._cards.set(slots[i].id, card);
          col.appendChild(card);
        } else {
          col.appendChild(this._buildEmptyCard());
        }
      }
    };

    fillCol('bf-player-back',  engine.paragons.filter(a => a.row === 'back'));
    fillCol('bf-player-front', engine.paragons.filter(a => a.row === 'front'));
    fillCol('bf-enemy-front',  engine.enemies.filter(a => a.row === 'front'));
    fillCol('bf-enemy-back',   engine.enemies.filter(a => a.row === 'back'));
  },

  // ── Empty card placeholder ─────────────────────────────────────────────
  _buildEmptyCard() {
    const card = document.createElement('div');
    card.className = 'actor-card empty';
    return card;
  },

  // ── Actor death event bridge ───────────────────────────────────────────
  actorDied(actor) {
    const card = this._cards.get(actor.id);
    if (card) card.dispatchEvent(new CustomEvent('actor:died'));
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

    // Tag pills
    const tagLine = (actor.tags ?? []).length > 0
      ? actor.tags.map(t => `<span class="tag-pill">${t[0].toUpperCase() + t.slice(1)}</span>`).join('')
      : `<span class="tag-pill">${actor.role}</span>`;

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
        <div class="card-portrait-wrap">
          ${portraitHTML}
        </div>
        <div class="card-info">
          <div class="card-name">${actor.name}<span class="resist-indicator" title="">🛡</span></div>
          <div class="card-role">${tagLine}</div>
          <div class="card-level">${actor.subtype === 'paragon' ? 'Paragon' : (actor.subclass === 'boss' ? `☠ BOSS &middot; Lv.${actor.level}` : actor.subclass === 'elite' ? `★ ELITE &middot; Lv.${actor.level}` : `Lv.${actor.level}`)}</div>
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
        ${actor.resourceType !== 'none' && actor.resourceType !== 'threat' ? `
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

    // Death event: card owns its own dead-state transition
    card.addEventListener('actor:died', () => card.classList.add('dead'));

    // Resistance indicator hover
    const resistIndicator = card.querySelector('.resist-indicator');
    if (resistIndicator) {
      resistIndicator.addEventListener('mouseenter', e => Tooltips.showResistances(e, actor));
      resistIndicator.addEventListener('mouseleave', () => Tooltips.hide());
    }

    // Build ability icons
    this._buildAbilityIcons(card, actor);

    return card;
  },

  _resourceLabel(type) {
    return { energy: 'EN', rage: 'RG', faith: 'FT', threat: 'THR', resolve: 'RES' }[type] || '??';
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
      el.addEventListener('mouseenter', e => Tooltips.showAbility(e, DATA.abilities[ab.id], ab.currentRank - 1, actor));
      el.addEventListener('mouseleave', () => Tooltips.hide());
      container.appendChild(el);
    });

    // Special / rage attack icon (threat-triggered)
    if (actor.specialAttack) {
      const el = document.createElement('div');
      el.className = 'ability-icon special-attack';
      el.dataset.role = 'special';
      el.textContent = actor.specialAttack.icon;
      el.addEventListener('mouseenter', e => this._showSpecialTooltip(e, actor));
      el.addEventListener('mouseleave', () => Tooltips.hide());
      container.appendChild(el);
    }
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
    // Skip dead actors — death overlay is handled by the actor:died event
    if (actor.isDead) return;

    // HP bar
    this._updateBar(card, 'hp', actor.currentHP, actor.maxHP);

    // Armor bar
    this._updateBar(card, 'armor', actor.currentArmor, actor.maxArmor);

    // Resource bar (not rendered for threat-type — the dedicated threat bar handles it)
    if (actor.resourceType !== 'none' && actor.resourceType !== 'threat') {
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

    // One icon per status entry (multiple casters can each have their own entry).
    for (const entry of actor.getAllStatusEntriesAll()) {
      const def = DATA.statuses[entry.statusId];
      if (!def) continue;
      const icon = document.createElement('div');
      icon.className = `status-icon ${def.cssClass}`;
      // Inactive entries (non-strongest for non-tick statuses) rendered as dimmed.
      if (entry.isActive === false) icon.classList.add('status-inactive');
      icon.textContent = def.icon;
      if (entry.stacks > 1) {
        const sc = document.createElement('span');
        sc.className = 'stack-count';
        sc.textContent = entry.stacks;
        icon.appendChild(sc);
      }
      icon.title = `${def.label} — ${entry.casterName} (${entry.stacks} stack${entry.stacks !== 1 ? 's' : ''}): ${def.tooltip}`;
      strip.appendChild(icon);
    }
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

    // Swap special icon on phase 2 transition
    const spEl = card.querySelector('[data-role="special"]');
    if (spEl && actor.phase2Active && actor.phase2SpecialAttack) {
      spEl.textContent = actor.phase2SpecialAttack.icon;
    }
  },

  // ── Equalize card heights across row slots ──────────────────────────────
  equalizeCardHeights() {
    const colIds = ['bf-player-back', 'bf-player-front', 'bf-enemy-front', 'bf-enemy-back'];
    const cols = colIds.map(id => {
      const el = document.getElementById(id);
      return el ? [...el.querySelectorAll('.actor-card')] : [];
    });
    const maxSlots = Math.max(...cols.map(c => c.length), 0);

    // Reset all min-heights so we measure natural sizes
    cols.forEach(col => col.forEach(c => c.style.minHeight = ''));

    // Force a reflow to get accurate offsetHeights
    void document.getElementById('battlefield-grid')?.offsetHeight;

    // Apply max height per slot row across all columns
    for (let i = 0; i < maxSlots; i++) {
      const cards = cols.map(c => c[i]).filter(Boolean);
      const maxH  = Math.max(...cards.map(c => c.offsetHeight));
      cards.forEach(c => c.style.minHeight = `${maxH}px`);
    }
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

  // ── Tooltip (delegates to Tooltips singleton) ─────────────────────────
  _showSpecialTooltip(e, actor) {
    const sp = actor.phase2Active && actor.phase2SpecialAttack
      ? actor.phase2SpecialAttack
      : actor.specialAttack;
    if (!sp) return;
    Tooltips.showAbility(e, sp, 0, null, true);
  },

  // ── Event track ────────────────────────────────────────────────────────
  // resolvedEvents: prog.resolvedEvents map (idx → resolved eventDef)
  buildEventTrack(zone, currentEventIndex, resolvedEvents = {}) {
    const track = document.getElementById('event-track');
    if (!track) return;
    track.innerHTML = '';

    const typeIcons  = { fight: '⚔️', loot: '📦', elite: '★', boss: '☠️', rest_spot: '🕯️', random: '?' };
    const typeLabels = { fight: 'FIGHT', loot: 'LOOT', elite: 'ELITE', boss: 'BOSS', rest_spot: 'REST', random: '???' };

    zone.events.forEach((rawEv, i) => {
      if (i > 0) {
        const conn = document.createElement('div');
        conn.className = 'event-connector';
        track.appendChild(conn);
      }

      const node = document.createElement('div');
      const isDone    = i < currentEventIndex;
      const isCurrent = i === currentEventIndex;
      const isFuture  = i > currentEventIndex;

      // Resolve the display event: use stored resolution for RANDOM nodes
      // that have already been entered (done or current).
      const resolved  = resolvedEvents[i];
      const displayEv = (isDone || isCurrent) && resolved ? resolved : rawEv;

      // REST_SPOT is always revealed, even in future position — it's a
      // visible landmark on the path, not a hidden encounter.
      const isRestSpot = rawEv.type === 'rest_spot';

      if (isFuture && !isRestSpot) {
        // ── Unknown future node ──────────────────────────────────────────
        node.className = 'event-node unknown';
        node.innerHTML = `
          <div class="event-node-icon">?</div>
          <span>???</span>
        `;
      } else {
        // ── Revealed node (done, current, or rest spot) ──────────────────
        node.className = `event-node ${displayEv.type}`;
        if (isDone)    node.classList.add('done');
        if (isCurrent) node.classList.add('active');
        if (isFuture)  node.classList.add('pending'); // rest_spot future

        const icon  = typeIcons[displayEv.type]  || '?';
        const label = displayEv.label ?? typeLabels[displayEv.type] ?? displayEv.type;
        node.innerHTML = `
          <div class="event-node-icon">${icon}</div>
          <span>${label}</span>
        `;
      }

      track.appendChild(node);
    });
  },

  // ── Rest spot scene ────────────────────────────────────────────────────
  // Shows a modal over the battlefield with party portraits, HP, and lore.
  showRestSpot(event, paragons) {
    const portraitHtml = paragons.map(p => `
      <div class="rest-portrait">
        <img src="${p.def.portrait || ''}" alt="${p.def.name}"
             onerror="this.style.display='none'">
        <div class="rest-portrait-name">${p.def.name}</div>
        <div class="rest-portrait-hp">${p.currentHP} / ${p.maxHP} HP</div>
      </div>
    `).join('');

    const body = `
      <div class="rest-scene-modal">
        <div class="rest-portraits">${portraitHtml}</div>
        ${event.loreText ? `<p class="rest-lore">${event.loreText}</p>` : ''}
      </div>
    `;

    this.showModal(
      `Rest Spot — ${event.label}`,
      body,
      [{ label: 'Continue', cls: '', action: () => { document.getElementById('btn-next')?.click(); } }]
    );
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

  // ── Reset battle area: clear stale actor cards + loot display ─────────
  resetBattleArea() {
    ['bf-player-back', 'bf-player-front', 'bf-enemy-front', 'bf-enemy-back'].forEach(id => {
      const col = document.getElementById(id);
      if (col) col.querySelectorAll('.actor-card').forEach(c => c.remove());
    });
    this._cards.clear();
    const loot = document.getElementById('loot-display');
    if (loot) loot.innerHTML = '';
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
  // ── Loot modal ───────────────────────────────────────────────────────────
  // Displays a standardised loot-results modal used after battles and
  // container events. addedItems is an ItemInstance[]. currencies is a
  // plain object { [CurrencyKey]: number }. overflowed is ItemInstance[].
  // onNext is invoked after the modal is closed.
  showLootModal(title, addedItems, currencies, overflowed, onNext) {
    let body = '';

    if (addedItems.length === 0 && Object.keys(currencies).length === 0) {
      body = '<div class="loot-empty">Nothing of value was found.</div>';
    } else {
      if (addedItems.length > 0) {
        body += '<div class="loot-item-list">';
        addedItems.forEach(item => {
          const def = DATA.items[item.definitionId];
          body += `<div class="loot-item-row rarity-${item.rarity}">
            <span class="loot-item-icon">❓</span>
            <span class="loot-item-name">${def?.name ?? item.definitionId}</span>
            <span class="loot-item-rarity">${item.rarity}</span>
          </div>`;
        });
        body += '</div>';
      }
      for (const [key, amount] of Object.entries(currencies)) {
        const cfg = CURRENCY_CONFIG[key];
        if (cfg) body += `<div class="loot-currency-row">${cfg.icon} +${amount} ${cfg.label}</div>`;
      }
    }

    if (overflowed.length > 0) {
      body += `<div class="loot-overflow">${overflowed.length} item${overflowed.length > 1 ? 's' : ''} could not fit in your inventory.</div>`;
    }

    this.showModal(title, body, [{ label: 'Next', action: onNext }]);
  },

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

  // ── Tab navigation ─────────────────────────────────────────────────────
  switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });
  },

  // ── Quest sub-view switching ───────────────────────────────────────────
  showLocationSelect() {
    const ls = document.getElementById('quest-location-select');
    const qb = document.getElementById('quest-battle');
    if (ls) ls.style.display = '';
    if (qb) qb.style.display = 'none';
  },

  showBattleView() {
    const ls = document.getElementById('quest-location-select');
    const qb = document.getElementById('quest-battle');
    if (ls) ls.style.display = 'none';
    if (qb) qb.style.display = '';
  },

  // ── Location select rendering ──────────────────────────────────────────
  renderLocationSelect(locations, locationProgress, onSelect) {
    this._renderLocList(locations, locationProgress, onSelect);
    this._renderLocPins(locations, locationProgress, onSelect);
  },

  _renderLocList(locations, locationProgress, onSelect) {
    const panel = document.getElementById('loc-list-panel');
    if (!panel) return;
    panel.innerHTML = '';

    locations.forEach(loc => {
      const prog = locationProgress[loc.id] || { completedEvents: [], zoneConquered: false };

      const item = document.createElement('div');
      item.className = 'loc-list-item';
      if (loc.stub) item.classList.add('stub');
      item.dataset.locationId = loc.id;

      const badgeHTML = prog.zoneConquered ? '<div class="loc-hex-badge">✓</div>' : '';
      const iconHTML  = loc.icon
        ? `<img class="loc-list-icon-img" src="${loc.icon}" alt="${loc.name}"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : '';
      const fallbackHTML = `<div class="loc-list-icon-fallback" style="${loc.icon ? 'display:none' : ''}">⚔</div>`;

      item.innerHTML = `
        <div class="loc-list-icon-wrap">
          ${iconHTML}${fallbackHTML}${badgeHTML}
        </div>
        <span class="loc-list-name">${loc.name}</span>
        <div class="loc-list-cb ${prog.zoneConquered ? 'checked' : ''}"></div>
      `;

      if (!loc.stub) {
        item.addEventListener('click', () => {
          this._selectLocation(loc, locationProgress);
          if (onSelect) onSelect(loc.id);
        });
      }

      panel.appendChild(item);
    });
  },

  _renderLocPins(locations, locationProgress, onSelect) {
    const map = document.getElementById('castle-map');
    if (!map) return;
    map.innerHTML = '';

    locations.forEach(loc => {
      const prog = locationProgress[loc.id] || { completedEvents: [], zoneConquered: false };

      const pin = document.createElement('button');
      pin.className = 'location-pin';
      if (loc.stub)           pin.classList.add('stub');
      if (prog.zoneConquered) pin.classList.add('conquered');
      pin.dataset.locationId = loc.id;
      pin.style.left = `${loc.mapX}%`;
      pin.style.top  = `${loc.mapY}%`;

      const badgeHTML = prog.zoneConquered ? '<div class="pin-hex-badge">✓</div>' : '';
      const iconHTML  = loc.icon
        ? `<img class="pin-icon-img" src="${loc.icon}" alt="${loc.name}"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : '';
      const fallbackHTML = `<div class="pin-icon-fallback" style="${loc.icon ? 'display:none' : ''}">⚔</div>`;

      pin.innerHTML = `
        <div class="pin-icon-wrap">
          ${iconHTML}${fallbackHTML}${badgeHTML}
        </div>
      `;

      if (!loc.stub) {
        pin.addEventListener('click', () => {
          this._selectLocation(loc, locationProgress);
          if (onSelect) onSelect(loc.id);
        });
      }

      map.appendChild(pin);
    });
  },

  _selectLocation(loc, locationProgress) {
    // Sync selection on list items and map pins
    document.querySelectorAll('.loc-list-item').forEach(el =>
      el.classList.toggle('selected', el.dataset.locationId === loc.id));
    document.querySelectorAll('.location-pin').forEach(el =>
      el.classList.toggle('selected', el.dataset.locationId === loc.id));

    const prog  = locationProgress[loc.id] || { completedEvents: [], zoneConquered: false, currentEventIndex: 0 };
    const total = loc.events.length;

    // Show right detail panel
    const panel = document.getElementById('loc-detail-panel');
    if (panel) panel.style.display = '';

    const nameEl    = document.getElementById('loc-name');
    const descEl    = document.getElementById('loc-desc');
    const statusEl  = document.getElementById('loc-status');
    const battleBtn = document.getElementById('btn-to-battle');

    if (nameEl)  nameEl.textContent = loc.name;
    if (descEl)  descEl.textContent = loc.description;

    if (statusEl) {
      statusEl.className = '';
      if (prog.zoneConquered) {
        statusEl.textContent = '✓ Conquered';
        statusEl.classList.add('conquered');
      } else if (prog.completedEvents.length > 0) {
        statusEl.textContent = `${prog.completedEvents.length} / ${total} encounters cleared`;
        statusEl.classList.add('in-progress');
      } else {
        statusEl.textContent = 'Untouched';
      }
    }

    if (battleBtn) {
      battleBtn.disabled = !!loc.stub;
    }
  },

  // ── Reset location sidebar to no-selection state ───────────────────────
  resetLocationSidebar() {
    document.querySelectorAll('.loc-list-item').forEach(p => p.classList.remove('selected'));
    document.querySelectorAll('.location-pin').forEach(p => p.classList.remove('selected'));
    const panel = document.getElementById('loc-detail-panel');
    if (panel) panel.style.display = 'none';
  },

  // ── Public tooltip helpers — thin delegators for backward compat ────────
  showRawTooltip(html, e) { Tooltips.showRaw(html, e); },
  hideTooltip()            { Tooltips.hide(); },
};

