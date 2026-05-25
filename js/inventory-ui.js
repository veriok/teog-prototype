// js/inventory-ui.js — Echoes of Germolles: Inventory Tab UI

import { DATA }                                              from './data/index.js';
import { ItemType, ItemSubtype, Rarity, Currency, CURRENCY_CONFIG } from './enums.js';
import { UI }                                                from './ui.js';
import { Tooltips }                                          from './tooltips.js';
import { getItemValue }                                      from './inventory.js';

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

  switch (InventoryUI._sortMode) {
    case 'name':
      return defA.name.localeCompare(defB.name);
    case 'rarity': {
      const ra = RARITY_DISPLAY_ORDER.indexOf(a.rarity);
      const rb = RARITY_DISPLAY_ORDER.indexOf(b.rarity);
      if (ra !== rb) return ra - rb;
      return defA.name.localeCompare(defB.name);
    }
    case 'value': {
      const vb = getItemValue(b) - getItemValue(a);
      if (vb !== 0) return vb;
      return defA.name.localeCompare(defB.name);
    }
    default: // 'type'
      break;
  }

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


// ── InventoryUI singleton ──────────────────────────────────────────────────

export const InventoryUI = {

  _inventory:       null,
  _state:           null,
  _save:            null,   // () => void — callback to persist state

  _selectedId:      null,   // instanceId of currently selected ItemInstance

  _sortMode:        'name',

  _isHoldingDelete: false,
  _deleteAnimFrame: null,
  _deleteStartTime: null,

  _isHoldingSell:   false,
  _sellAnimFrame:   null,
  _sellStartTime:   null,

  // ── Init ─────────────────────────────────────────────────────────────────

  init(inventory, state, save) {
    this._inventory = inventory;
    this._state     = state;
    this._save      = save;
    this._bindKeyboard();
    this._bindDeleteButton();
    this._bindSellButton();
    this._bindSortButtons();
    this._bindMultiSellButton();
  },

  // ── Full re-render ────────────────────────────────────────────────────────

  render() {
    this._renderCurrencies();
    this._renderCapacity();
    this._renderExpandButton();
    this._renderGrid();
    this._renderDetailBar();
    this._renderMultiSellButton();
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

el.addEventListener('mouseenter', e => Tooltips.showItem(e, item, def));
      el.addEventListener('mouseleave', () => Tooltips.hide());

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

    if (nameEl) nameEl.textContent = `${def.name} · ${(item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1))}`;

    if (btn) {
      btn.disabled = !def.canDestroy;
      btn.title    = def.canDestroy ? 'Hold to destroy' : 'This item cannot be destroyed';
      // Reset fill indicator
      const fill = btn.querySelector('.delete-fill');
      if (fill) fill.style.width = '0';
      btn.classList.remove('holding');
    }

    const sellBtn = document.getElementById('btn-sell-item');
    if (sellBtn) {
      const isEquipped = this._getEquippedInstanceIds().has(item.instanceId);
      const sellPrice  = Math.floor(getItemValue(item) / 2);
      const span       = sellBtn.querySelector('span');
      if (span) span.textContent = isEquipped ? 'Equipped' : `Sell (${sellPrice} \u{1F480})`;
      sellBtn.disabled = isEquipped;
      sellBtn.title    = isEquipped ? 'Cannot sell \u2014 item is equipped' : '';
      const fill = sellBtn.querySelector('.sell-fill');
      if (fill) fill.style.width = '0';
    }
  },

  // ── Sell button ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  _bindSellButton() {
    const btn = document.getElementById('btn-sell-item');
    if (!btn) return;
    btn.addEventListener('mousedown',  () => this._startSellHold());
    btn.addEventListener('mouseup',    () => this._cancelSellHold());
    btn.addEventListener('mouseleave', () => this._cancelSellHold());
  },

  _onSell() {
    this._executeSell();
  },

  _startSellHold() {
    if (this._isHoldingSell) return;
    if (!this._selectedId) return;
    const item = this._inventory.slots.find(i => i.instanceId === this._selectedId);
    if (!item) return;
    if (this._getEquippedInstanceIds().has(item.instanceId)) return;
    const btn = document.getElementById('btn-sell-item');
    if (!btn || btn.disabled) return;

    this._isHoldingSell = true;
    this._sellStartTime = performance.now();

    const tick = () => {
      const pct  = Math.min((performance.now() - this._sellStartTime) / 1000, 1);
      const fill = btn.querySelector('.sell-fill');
      if (fill) fill.style.width = `${pct * 100}%`;
      if (pct < 1) {
        this._sellAnimFrame = requestAnimationFrame(tick);
      } else {
        this._cancelSellHold(false);
        this._executeSell();
      }
    };
    this._sellAnimFrame = requestAnimationFrame(tick);
  },

  _cancelSellHold(resetVisuals = true) {
    if (this._sellAnimFrame) {
      cancelAnimationFrame(this._sellAnimFrame);
      this._sellAnimFrame = null;
    }
    this._isHoldingSell = false;
    this._sellStartTime = null;
    if (resetVisuals) {
      const btn = document.getElementById('btn-sell-item');
      if (btn) {
        const fill = btn.querySelector('.sell-fill');
        if (fill) fill.style.width = '0';
      }
    }
  },

  _executeSell() {
    if (!this._selectedId) return;
    const idx = this._inventory.slots.findIndex(i => i.instanceId === this._selectedId);
    if (idx === -1) return;
    const item = this._inventory.slots[idx];
    if (this._getEquippedInstanceIds().has(item.instanceId)) return;
    const sellPrice = Math.floor(getItemValue(item) / 2);
    this._state.currencies.souls = (this._state.currencies.souls ?? 0) + sellPrice;
    this._inventory.remove(idx);
    this._selectedId = null;
    this._save();
    this.render();
  },

  // ── Hold-to-delete ─────────────────────────────────────────────────────

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

  // ── Sort buttons ──────────────────────────────────────────────────────────

  _bindSortButtons() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._sortMode = btn.dataset.sort;
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.toggle('active', b === btn));
        this._renderGrid();
      });
    });
  },

  // ── Multi-sell ────────────────────────────────────────────────────────────

  _bindMultiSellButton() {
    const btn = document.getElementById('btn-multi-sell');
    if (!btn) return;
    btn.addEventListener('click', () => this._onMultiSell());
  },

  _renderMultiSellButton() {
    const btn = document.getElementById('btn-multi-sell');
    if (!btn) return;
    const equippedIds = this._getEquippedInstanceIds();
    btn.disabled = !this._inventory.slots.some(i => !equippedIds.has(i.instanceId));
  },

  _onMultiSell() {
    const equippedIds = this._getEquippedInstanceIds();
    const rarities    = [Rarity.JUNK, Rarity.COMMON, Rarity.UNCOMMON, Rarity.RARE, Rarity.LEGENDARY];

    const byRarity = {};
    for (const r of rarities) {
      byRarity[r] = this._inventory.slots.filter(i => i.rarity === r && !equippedIds.has(i.instanceId));
    }

    const rowsHtml = rarities.map(r => {
      const items    = byRarity[r];
      const soulsAmt = items.reduce((s, i) => s + Math.floor(getItemValue(i) / 2), 0);
      const label    = r[0].toUpperCase() + r.slice(1);
      const checked  = r === Rarity.JUNK ? 'checked' : '';
      const disabled = items.length === 0 ? 'disabled' : '';
      return `<label class="multi-sell-row">
        <input type="checkbox" class="multi-sell-check" data-rarity="${r}" ${checked} ${disabled}>
        <span class="multi-sell-name rarity-text-${r}">${label}</span>
        <span class="multi-sell-count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
        <span class="multi-sell-souls">${soulsAmt} \u{1F480}</span>
      </label>`;
    }).join('');

    const body = `<div class="multi-sell-rarities">${rowsHtml}</div>
      <div class="multi-sell-preview">Sell <strong id="ms-count">0</strong> items for <strong id="ms-souls">0</strong> \u{1F480}</div>`;

    // Mutable state captured by the action closure — safe to read after modal DOM is gone
    const sellState = { rarities: new Set([Rarity.JUNK]) };

    UI.showModal('Sell by Rarity', body, [
      {
        label: 'Sell', cls: 'btn-sell',
        action: () => {
          const equippedIds2 = this._getEquippedInstanceIds();
          let totalSouls = 0;
          const toRemove = [];
          for (const item of [...this._inventory.slots]) {
            if (sellState.rarities.has(item.rarity) && !equippedIds2.has(item.instanceId)) {
              totalSouls += Math.floor(getItemValue(item) / 2);
              toRemove.push(item.instanceId);
            }
          }
          for (const id of toRemove) {
            const idx = this._inventory.slots.findIndex(i => i.instanceId === id);
            if (idx !== -1) this._inventory.remove(idx);
          }
          this._state.currencies.souls = (this._state.currencies.souls ?? 0) + totalSouls;
          if (this._selectedId && toRemove.includes(this._selectedId)) this._selectedId = null;
          this._save();
          this.render();
          UI.showModal('Items Sold',
            `<div class="multi-sell-result">Sold <strong>${toRemove.length}</strong> item${toRemove.length !== 1 ? 's' : ''} for <strong>${totalSouls} \u{1F480}</strong>.</div>`,
            [{ label: 'OK', action: null }]);
        },
      },
      { label: 'Cancel', action: null },
    ]);

    // After the modal DOM is in place, wire up live preview and sync sellState
    requestAnimationFrame(() => {
      const updatePreview = () => {
        let count = 0, souls = 0;
        document.querySelectorAll('.multi-sell-check').forEach(el => {
          if (el.checked) {
            const r = el.dataset.rarity;
            count += byRarity[r].length;
            souls += byRarity[r].reduce((s, i) => s + Math.floor(getItemValue(i) / 2), 0);
          }
        });
        const c = document.getElementById('ms-count');
        const s = document.getElementById('ms-souls');
        if (c) c.textContent = count;
        if (s) s.textContent = souls;
      };
      document.querySelectorAll('.multi-sell-check').forEach(el => {
        el.addEventListener('change', () => {
          if (el.checked) sellState.rarities.add(el.dataset.rarity);
          else sellState.rarities.delete(el.dataset.rarity);
          updatePreview();
        });
      });
      updatePreview();
    });
  },

  // ── Equipped items helper ─────────────────────────────────────────────────

  _getEquippedInstanceIds() {
    const ids = new Set();
    for (const ps of Object.values(this._state.paragonStates ?? {})) {
      for (const instanceId of Object.values(ps?.equippedItems ?? {})) {
        if (instanceId) ids.add(instanceId);
      }
    }
    return ids;
  },

  // ── Keyboard ─────────────────────────────────────────────────────────────

  _bindKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.repeat) return;
      if (!this._isInventoryTabActive()) return;
      if (e.key === 'd' || e.key === 'D') this._startDeleteHold();
      if (e.key === 's' || e.key === 'S') this._startSellHold();
    });
    document.addEventListener('keyup', e => {
      if (e.key === 'd' || e.key === 'D') this._cancelDeleteHold();
      if (e.key === 's' || e.key === 'S') this._cancelSellHold();
    });
  },

  _isInventoryTabActive() {
    return document.getElementById('tab-inventory')?.classList.contains('active') ?? false;
  },

  // ── Item tooltip ──────────────────────────────────────────────────────────

  _showItemTooltip(e, item, def) { Tooltips.showItem(e, item, def); },
};
