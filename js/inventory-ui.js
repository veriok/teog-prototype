// js/inventory-ui.js — Echoes of Germolles: Inventory Tab UI

import { DATA }                                              from './data/index.js';
import { ItemType, ItemSubtype, Rarity, Currency, CURRENCY_CONFIG } from './enums.js';
import { UI }                                                from './ui.js';

// ── Sort order constants ───────────────────────────────────────────────────

const ITEM_TYPE_ORDER = [
  ItemType.MAIN_HAND, ItemType.OFFHAND,
  ItemType.HELMET,    ItemType.BODY,    ItemType.BOOTS,
  ItemType.GLOVES,    ItemType.BELT,    ItemType.CLOAK,
  ItemType.RING,      ItemType.AMULET,
];

const ITEM_SUBTYPE_ORDER = [
  ItemSubtype.SWORD, ItemSubtype.AXE, ItemSubtype.SHIELD,
  ItemSubtype.HEAVY_CHEST, ItemSubtype.MEDIUM_CHEST, ItemSubtype.LIGHT_CHEST,
];

const RARITY_DISPLAY_ORDER = [
  Rarity.LEGENDARY, Rarity.RARE, Rarity.UNCOMMON, Rarity.COMMON, Rarity.JUNK,
];

// ── Expand cost formula ────────────────────────────────────────────────────

const EXPAND_INITIAL   = 20;
const EXPAND_BASE_COST = 10;
const EXPAND_COST_STEP = 5;

function _expandCost(capacity) {
  return EXPAND_BASE_COST + (capacity - EXPAND_INITIAL) * EXPAND_COST_STEP;
}

// ── Comparison helper ──────────────────────────────────────────────────────

function _sortItems(a, b) {
  const defA = DATA.items[a.definitionId];
  const defB = DATA.items[b.definitionId];

  const ta = ITEM_TYPE_ORDER.indexOf(defA.type);
  const tb = ITEM_TYPE_ORDER.indexOf(defB.type);
  if (ta !== tb) return ta - tb;

  const sa = defA.subtype != null ? ITEM_SUBTYPE_ORDER.indexOf(defA.subtype) : 999;
  const sb = defB.subtype != null ? ITEM_SUBTYPE_ORDER.indexOf(defB.subtype) : 999;
  if (sa !== sb) return sa - sb;

  const ra = RARITY_DISPLAY_ORDER.indexOf(a.rarity);
  const rb = RARITY_DISPLAY_ORDER.indexOf(b.rarity);
  return ra - rb;
}

// ── Formatting helpers ─────────────────────────────────────────────────────

function _capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function _formatType(type, subtype) {
  const typeLabel = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  if (!subtype) return typeLabel;
  const subLabel = subtype.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `${typeLabel} — ${subLabel}`;
}

// ── InventoryUI singleton ──────────────────────────────────────────────────

export const InventoryUI = {

  _inventory:       null,
  _state:           null,
  _save:            null,   // () => void — callback to persist state

  _selectedId:      null,   // instanceId of currently selected ItemInstance

  _isHoldingDelete: false,
  _deleteAnimFrame: null,
  _deleteStartTime: null,

  // ── Init ─────────────────────────────────────────────────────────────────

  init(inventory, state, save) {
    this._inventory = inventory;
    this._state     = state;
    this._save      = save;
    this._bindKeyboard();
    this._bindDeleteButton();
  },

  // ── Full re-render ────────────────────────────────────────────────────────

  render() {
    this._renderCurrencies();
    this._renderCapacity();
    this._renderExpandButton();
    this._renderGrid();
    this._renderDetailBar();
  },

  // ── Currency display ──────────────────────────────────────────────────────

  _renderCurrencies() {
    const container = document.getElementById('inv-currencies');
    if (!container) return;
    container.innerHTML = '';

    for (const key of Object.values(Currency)) {
      const cfg    = CURRENCY_CONFIG[key];
      if (!cfg) continue;
      const amount = this._state.currencies?.[key] ?? 0;

      const el = document.createElement('div');
      el.className = 'currency-item';
      el.dataset.currency = key;
      el.innerHTML = `
        <span class="currency-icon">${cfg.icon}</span>
        <span class="currency-value" id="currency-val-${key}">${amount}</span>
        <span class="currency-label">${cfg.label}</span>
      `;
      container.appendChild(el);
    }
  },

  // ── Capacity label ────────────────────────────────────────────────────────

  _renderCapacity() {
    const el = document.getElementById('inv-capacity-label');
    if (el) el.textContent = `${this._inventory.slots.length} / ${this._inventory.capacity}`;
  },

  // ── Expand button ─────────────────────────────────────────────────────────

  _renderExpandButton() {
    const btn = document.getElementById('btn-expand-inv');
    if (!btn) return;
    const cost  = _expandCost(this._inventory.capacity);
    const souls = this._state.currencies?.souls ?? 0;
    const cfg   = CURRENCY_CONFIG[Currency.SOULS];
    btn.textContent = `+ Expand — ${cost} ${cfg.icon}`;
    btn.disabled    = souls < cost;
    btn.onclick     = () => this._onExpand();
  },

  _onExpand() {
    const cost  = _expandCost(this._inventory.capacity);
    const souls = this._state.currencies?.souls ?? 0;
    if (souls < cost) return;
    this._state.currencies.souls  -= cost;
    this._inventory.capacity++;
    this._state.inventoryCapacity  = this._inventory.capacity;
    this._save();
    this._renderCurrencies();
    this._renderCapacity();
    this._renderExpandButton();
    this._renderGrid();
  },

  // ── Grid ──────────────────────────────────────────────────────────────────

  _renderGrid() {
    const grid = document.getElementById('inv-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const sorted = [...this._inventory.slots].sort(_sortItems);
    const cap    = this._inventory.capacity;

    sorted.forEach((item, i)    => grid.appendChild(this._buildFilledSlot(item, i)));
    for  (let i = sorted.length; i < cap; i++) grid.appendChild(this._buildEmptySlot(i));
  },

  _buildFilledSlot(item, visualIdx) {
    const def = DATA.items[item.definitionId];
    const el  = document.createElement('div');
    el.className = `inv-slot filled rarity-${item.rarity}`;
    if (item.instanceId === this._selectedId) el.classList.add('selected');
    el.dataset.instanceId = item.instanceId;

    const iconHTML = def.icon
      ? `<img class="inv-icon-img" src="${def.icon}" alt="${def.name}"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <span class="inv-icon-emoji" style="display:none">❓</span>`
      : `<span class="inv-icon-emoji">❓</span>`;

    el.innerHTML = `
      <div class="inv-slot-num">${visualIdx + 1}</div>
      <div class="inv-slot-icon">${iconHTML}</div>
      <div class="inv-slot-name">${def.name}</div>
      <div class="inv-slot-rarity">${item.rarity}</div>
    `;

    el.addEventListener('click', () => {
      this._selectedId = (item.instanceId === this._selectedId) ? null : item.instanceId;
      this._renderGrid();
      this._renderDetailBar();
    });

    el.addEventListener('mouseenter', e => this._showItemTooltip(e, item, def));
    el.addEventListener('mouseleave', () => UI.hideTooltip());

    return el;
  },

  _buildEmptySlot(visualIdx) {
    const el = document.createElement('div');
    el.className = 'inv-slot empty';
    el.innerHTML = `<div class="inv-slot-num">${visualIdx + 1}</div>`;
    return el;
  },

  // ── Detail bar ────────────────────────────────────────────────────────────

  _renderDetailBar() {
    const hint  = document.getElementById('inv-detail-hint');
    const panel = document.getElementById('inv-detail-item');
    const nameEl = document.getElementById('inv-detail-name');
    const btn   = document.getElementById('btn-delete-item');

    if (!this._selectedId) {
      if (hint)  hint.style.display  = '';
      if (panel) panel.style.display = 'none';
      return;
    }

    const item = this._inventory.slots.find(i => i.instanceId === this._selectedId);
    if (!item) {
      this._selectedId = null;
      if (hint)  hint.style.display  = '';
      if (panel) panel.style.display = 'none';
      return;
    }

    const def = DATA.items[item.definitionId];
    if (hint)  hint.style.display  = 'none';
    if (panel) panel.style.display = '';

    if (nameEl) nameEl.textContent = `${def.name} · ${_capitalize(item.rarity)}`;

    if (btn) {
      btn.disabled = !def.canDestroy;
      btn.title    = def.canDestroy ? 'Hold to destroy' : 'This item cannot be destroyed';
      // Reset fill indicator
      const fill = btn.querySelector('.delete-fill');
      if (fill) fill.style.width = '0';
      btn.classList.remove('holding');
    }
  },

  // ── Hold-to-delete ────────────────────────────────────────────────────────

  _bindDeleteButton() {
    const btn = document.getElementById('btn-delete-item');
    if (!btn) return;
    btn.addEventListener('mousedown',  () => this._startDeleteHold());
    btn.addEventListener('mouseup',    () => this._cancelDeleteHold());
    btn.addEventListener('mouseleave', () => this._cancelDeleteHold());
  },

  _startDeleteHold() {
    if (this._isHoldingDelete) return;
    if (!this._selectedId) return;

    const item = this._inventory.slots.find(i => i.instanceId === this._selectedId);
    if (!item) return;
    if (!DATA.items[item.definitionId].canDestroy) return;

    const btn = document.getElementById('btn-delete-item');
    if (!btn || btn.disabled) return;

    this._isHoldingDelete = true;
    this._deleteStartTime = performance.now();
    btn.classList.add('holding');

    const tick = () => {
      const elapsed = performance.now() - this._deleteStartTime;
      const pct     = Math.min(elapsed / 1000, 1);
      const fill    = btn.querySelector('.delete-fill');
      if (fill) fill.style.width = `${pct * 100}%`;

      if (pct < 1) {
        this._deleteAnimFrame = requestAnimationFrame(tick);
      } else {
        this._cancelDeleteHold(false);
        this._executeDelete();
      }
    };
    this._deleteAnimFrame = requestAnimationFrame(tick);
  },

  _cancelDeleteHold(resetVisuals = true) {
    if (this._deleteAnimFrame) {
      cancelAnimationFrame(this._deleteAnimFrame);
      this._deleteAnimFrame = null;
    }
    this._isHoldingDelete = false;
    this._deleteStartTime = null;

    if (resetVisuals) {
      const btn = document.getElementById('btn-delete-item');
      if (btn) {
        const fill = btn.querySelector('.delete-fill');
        if (fill) fill.style.width = '0';
        btn.classList.remove('holding');
      }
    }
  },

  _executeDelete() {
    if (!this._selectedId) return;
    const idx = this._inventory.slots.findIndex(i => i.instanceId === this._selectedId);
    if (idx === -1) return;
    const item = this._inventory.slots[idx];
    if (!DATA.items[item.definitionId].canDestroy) return;
    this._inventory.remove(idx);
    this._selectedId = null;
    this.render();
  },

  // ── Keyboard ─────────────────────────────────────────────────────────────

  _bindKeyboard() {
    document.addEventListener('keydown', e => {
      if ((e.key !== 'd' && e.key !== 'D') || e.repeat) return;
      if (!this._isInventoryTabActive()) return;
      this._startDeleteHold();
    });
    document.addEventListener('keyup', e => {
      if (e.key !== 'd' && e.key !== 'D') return;
      this._cancelDeleteHold();
    });
  },

  _isInventoryTabActive() {
    return document.getElementById('tab-inventory')?.classList.contains('active') ?? false;
  },

  // ── Item tooltip ──────────────────────────────────────────────────────────

  _showItemTooltip(e, item, def) {
    const rarityLabel = _capitalize(item.rarity);
    const typeLabel   = _formatType(def.type, def.subtype);
    const iconHTML    = def.icon
      ? `<img src="${def.icon}" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;margin-right:4px">`
      : `<span style="margin-right:4px">❓</span>`;

    let html = `<strong>${iconHTML}${def.name}</strong>`;
    html += `<div style="color:var(--text-dim);font-size:0.73rem;margin-top:2px">${typeLabel} · <span class="tt-rarity-${item.rarity}">${rarityLabel}</span></div>`;
    html += `<div class="tt-divider"></div>`;
    html += `<div>Base: <em>${item.baseAttribute.name}</em> +${item.baseAttribute.effectValue.toFixed(2)}</div>`;

    if (item.slots.length > 0) {
      item.slots.forEach(mod => {
        const tag = `[${mod.modifierType.toUpperCase()}]`;
        html += `<div style="color:var(--text-dim);font-size:0.78rem">${tag} ${mod.name} +${mod.effectValue.toFixed(2)}</div>`;
      });
    }

    html += `<div class="tt-divider"></div>`;
    html += `<div style="color:var(--text-dim);font-size:0.73rem">Value: ${def.value}`;
    if (!def.canDestroy) html += ` · <span style="color:var(--text-gold)">Cannot be destroyed</span>`;
    html += `</div>`;

    UI.showRawTooltip(html, e);
  },
};
