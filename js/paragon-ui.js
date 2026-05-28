// js/paragon-ui.js — Echoes of Germolles: Paragon Screen UI
//
// Singleton object that owns all rendering for the #tab-paragons panel.
// Call ParagonUI.init(...) once during Game.init(), then ParagonUI.render()
// whenever the Paragons tab is activated.

import { DATA }                            from './data/index.js';
import { ItemType, SkillType, MAX_DEPLOYED_PARAGONS } from './enums.js';
import { canEquip, getUnlockedAbilities, getCurrentAbilityRank }  from './paragon.js';
import { EquippedItems }                   from './inventory.js';
import { computeActorStats }               from './stats.js';
import { Tooltips }                        from './tooltips.js';
import { XP_PER_LEVEL, SKILL_LEVEL_MAX }   from './experience.js';

// ── Internal state ────────────────────────────────────────────────────────

let _state        = null;   // game state (from Save.load())
let _inventory    = null;   // Inventory instance
let _getEngine    = null;   // () => Game.engine  (null when idle)
let _save         = null;   // () => void  — triggers save-to-disk

let _selectedId   = null;   // currently highlighted paragon id
let _activeSubtab = 'equip';

// Within equip subtab
let _selectedEquipSlot   = null;   // ItemType string | null
let _selectedSkillPanel  = null;   // 0 | 1 | null
let _selectedAbilitySlot = null;   // 0-3 | null

// ── Human-readable labels ─────────────────────────────────────────────────
const STAT_LABELS = {
  hp:            'HP',
  armor:         'Armor',
  slashingDmg:   'Slashing Dmg',
  flatDmg:       'Flat Dmg',
  critChance:    'Crit Chance',
  speed:         'Speed',
  blockBonus:    'Block Bonus',
  armorRegen:    'Armor Regen',
  fireDmgBonus:  'Fire Dmg Bonus',
  burnDuration:  'Burn Duration',
  voidDmgBonus:  'Void Dmg Bonus',
  entropyBonus:  'Entropy Bonus',
};

const SKILL_LABELS = {
  [SkillType.SWORD]:   'Sword',
  [SkillType.SHIELD]:  'Shield',
  [SkillType.TACTICS]: 'Tactics',
  [SkillType.FIRE]:    'Fire',
  [SkillType.VOID]:    'Void',
  [SkillType.FLOOD]:   'Flood',
  [SkillType.STAFF]:   'Staff',
};

const ITEM_SLOT_LABELS = {
  [ItemType.MAIN_HAND]: 'Main Hand',
  [ItemType.OFFHAND]:   'Offhand',
  [ItemType.HELMET]:    'Helmet',
  [ItemType.BODY]:      'Body',
  [ItemType.BOOTS]:     'Boots',
  [ItemType.GLOVES]:    'Gloves',
  [ItemType.BELT]:      'Belt',
  [ItemType.CLOAK]:     'Cloak',
  [ItemType.RING]:      'Ring',
  [ItemType.AMULET]:    'Amulet',
};

// ── Default per-paragon state ─────────────────────────────────────────────
// Lazily created the first time a paragon is accessed.
function _defaultParagonState(paragonId) {
  const def = DATA.actors[paragonId];
  // Collect distinct trees present on the paragon's abilities.
  const trees = [...new Set(
    (def?.abilities ?? [])
      .map(a => DATA.abilities[a.abilityId]?.tree)
      .filter(Boolean)
  )];
  const t0 = trees[0] ?? null;
  const t1 = trees.find(t => t !== t0) ?? null;

  const skillAbilitySlots = {};
  for (const tree of trees) {
    skillAbilitySlots[tree] = [null, null, null, null];
    // Pre-fill slots with the first abilities found for this tree.
    const unlocked = (def?.abilities ?? [])
      .map(a => DATA.abilities[a.abilityId])
      .filter(ab => ab && ab.tree === tree);
    for (let i = 0; i < unlocked.length && i < 4; i++) {
      skillAbilitySlots[tree][i] = unlocked[i].id;
    }
  }

  return {
    equippedItems:    {},                    // serialized EquippedItems (plain object)
    activeSkillTypes: [t0, t1],             // [panel0 SkillType, panel1 SkillType]
    skillAbilitySlots,                       // { [SkillType]: (string|null)[] }
  };
}

// Returns the (possibly lazy-initialized) per-paragon state.
function _paragonState(paragonId) {
  if (!_state.paragonStates[paragonId]) {
    _state.paragonStates[paragonId] = _defaultParagonState(paragonId);
  }
  const ps = _state.paragonStates[paragonId];
  // Ensure fields added in later save versions are always present.
  ps.skillLevels        ??= {};
  ps.skillXP            ??= {};
  ps.unlockedSkillTypes ??= [];
  // Seed any missing trees from the actor def.
  const def = DATA.actors[paragonId];
  for (const tree of (def?.skillTypes ?? [])) {
    ps.skillLevels[tree] ??= 1;
    ps.skillXP[tree]     ??= 0;
  }
  return ps;
}

// Returns a live EquippedItems instance for a paragon, reconstructed from
// its serialized save state on demand.
function _getEquipped(paragonId) {
  const ps = _paragonState(paragonId);
  return EquippedItems.deserialize(ps.equippedItems ?? {});
}

// Writes a live EquippedItems instance back into the save state and
// persists the save.
function _commitEquipped(paragonId, equipped) {
  _paragonState(paragonId).equippedItems = equipped.serialize();
  _save();
}

// ── Battlefield helpers ───────────────────────────────────────────────────

function _deployedCount() {
  return _state.battlefield.length;
}

function _isDeployed(paragonId) {
  return _state.battlefield.some(b => b.paragonId === paragonId);
}

function _deployParagon(paragonId, row, index) {
  // Remove any existing entry for this paragon first.
  _state.battlefield = _state.battlefield.filter(b => b.paragonId !== paragonId);
  // Also clear any existing occupant of this slot.
  _state.battlefield = _state.battlefield.filter(
    b => !(b.row === row && b.index === index)
  );
  _state.battlefield.push({ row, index, paragonId });
  _save();
}

function _undeployParagon(paragonId) {
  _state.battlefield = _state.battlefield.filter(b => b.paragonId !== paragonId);
  _save();
}

function _slotOccupant(row, index) {
  return _state.battlefield.find(b => b.row === row && b.index === index)?.paragonId ?? null;
}

// ── Helper: is battle running ─────────────────────────────────────────────
function _isLocked() {
  return _getEngine()?.active === true;
}

// ── Init ──────────────────────────────────────────────────────────────────

export const ParagonUI = {

  init(state, inventory, getEngine, saveCallback) {
    _state     = state;
    _inventory = inventory;
    _getEngine = getEngine;
    _save      = saveCallback;
    this._bindEvents();

    // Re-render skill panels whenever a skill levels up.
    document.addEventListener('skillLevelUp', () => {
      if (_selectedId) this._renderSkillPanels();
    });
  },

  // ── Ensure paragon state is initialized ───────────────────────────────
  // Call this for any paragon that may enter battle before the Paragons tab
  // has been opened (which normally triggers lazy initialization).
  ensureParagonState(paragonId) {
    return _paragonState(paragonId);
  },

  // ── Render ────────────────────────────────────────────────────────────
  render() {
    this._renderBattlefield();
    this._renderList();
    this._renderDetail();
    this._renderLockOverlay();
  },

  // ── Battlefield ───────────────────────────────────────────────────────
  _renderBattlefield() {
    const count = _deployedCount();
    const max   = MAX_DEPLOYED_PARAGONS;
    const el    = document.getElementById('paragon-deploy-count');
    if (el) el.textContent = `${count} / ${max} deployed`;

    document.querySelectorAll('.battlefield-slot').forEach(slot => {
      const row   = slot.dataset.row;
      const index = parseInt(slot.dataset.index, 10);
      const id    = _slotOccupant(row, index);
      slot.textContent = '';
      slot.classList.remove('occupied', 'selected');

      if (id) {
        const def = DATA.actors[id];
        slot.classList.add('occupied');
        const icon = document.createElement('span');
        icon.className   = 'bf-icon';
        icon.textContent = def?.icon ?? '?';
        const name = document.createElement('span');
        name.className   = 'bf-name';
        name.textContent = def?.name ?? id;
        slot.appendChild(icon);
        slot.appendChild(name);
      }
    });
  },

  // ── Paragon list ──────────────────────────────────────────────────────
  _renderList() {
    const container = document.getElementById('paragon-list');
    if (!container) return;
    container.innerHTML = '';

    for (const id of _state.unlockedParagonIds) {
      const def = DATA.actors[id];
      if (!def) continue;

      const item = document.createElement('div');
      item.className   = 'paragon-list-item';
      item.dataset.id  = id;
      if (id === _selectedId) item.classList.add('selected');
      if (_isDeployed(id))    item.classList.add('deployed');

      const icon = document.createElement('span');
      icon.className   = 'pli-icon';
      icon.textContent = def.icon ?? '?';

      const nameEl = document.createElement('span');
      nameEl.className   = 'pli-name';
      nameEl.textContent = def.name;

      const roleEl = document.createElement('span');
      roleEl.className   = 'pli-role';
      roleEl.textContent = def.role ?? '';

      item.appendChild(icon);
      item.appendChild(nameEl);
      item.appendChild(roleEl);
      container.appendChild(item);
    }
  },

  // ── Detail panel ─────────────────────────────────────────────────────
  _renderDetail() {
    const empty   = document.getElementById('paragon-detail-empty');
    const content = document.getElementById('paragon-detail-content');
    if (!empty || !content) return;

    if (!_selectedId || !DATA.actors[_selectedId]) {
      empty.style.display   = '';
      content.style.display = 'none';
      return;
    }
    empty.style.display   = 'none';
    content.style.display = '';

    // Portrait
    const def = DATA.actors[_selectedId];
    const img = document.getElementById('paragon-portrait-img');
    if (img) { img.src = def.portrait ?? ''; img.alt = def.name; }
    const nameEl = document.getElementById('paragon-portrait-name');
    if (nameEl) nameEl.textContent = def.name;
    const loreEl = document.getElementById('paragon-lore-text');
    if (loreEl) loreEl.textContent = def.bio ?? `${def.role ?? ''} · ${(def.tags ?? []).filter(t => t !== 'paragon').join(', ')}`;

    // Sub-tab visibility
    document.querySelectorAll('.paragon-subtab').forEach(el => {
      el.style.display = el.id === `paragon-subtab-${_activeSubtab}` ? '' : 'none';
    });
    document.querySelectorAll('.paragon-subtab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subtab === _activeSubtab);
    });

    if (_activeSubtab === 'equip') this._renderEquipSubtab();
    else                           this._renderStatsSubtab();
  },

  // ── Equipment sub-tab ─────────────────────────────────────────────────
  _renderEquipSubtab() {
    const equipped = _getEquipped(_selectedId);

    // Equipment slots + wrapper filled-state
    document.querySelectorAll('.equip-slot').forEach(el => {
      const slotType = el.dataset.slot;
      const item     = equipped.get(slotType);
      const wrapper  = el.closest('.equip-slot-wrapper');
      el.classList.remove('selected', 'filled', 'empty',
        'rarity-common', 'rarity-uncommon', 'rarity-rare', 'rarity-legendary', 'rarity-junk');
      if (wrapper) wrapper.classList.toggle('filled', !!item);
      el.textContent = '';

      if (slotType === _selectedEquipSlot) el.classList.add('selected');

      if (item) {
        const def  = DATA.items[item.definitionId];
        el.classList.add('filled', `rarity-${item.rarity ?? 'common'}`);
        const icon = document.createElement('span');
        icon.className   = 'equip-icon';
        icon.textContent = def?.icon ?? '?';
        el.appendChild(icon);
      } else {
        el.classList.add('empty');
        const label = document.createElement('span');
        label.className   = 'equip-empty-label';
        label.textContent = ITEM_SLOT_LABELS[slotType] ?? slotType;
        el.appendChild(label);
      }
    });

    // Skill panels + unified selection panel
    this._renderSkillPanels();
  },

  _renderSkillPanels() {
    const ps  = _paragonState(_selectedId);
    const def = DATA.actors[_selectedId];

    // Available trees = base skill types from def + quest-unlocked extras.
    const baseTrees  = def?.skillTypes ?? [];
    const extraTrees = ps.unlockedSkillTypes ?? [];
    const availableTrees = [...new Set([...baseTrees, ...extraTrees])];

    [0, 1].forEach(p => {
      const panel    = document.querySelector(`.skill-panel[data-panel="${p}"]`);
      if (!panel) return;
      const select   = panel.querySelector('.skill-tree-select');
      const tree     = ps.activeSkillTypes[p];
      const otherTree = ps.activeSkillTypes[p === 0 ? 1 : 0];

      // Populate dropdown (exclude the tree chosen in the other panel)
      select.innerHTML = '<option value="">— Choose skill —</option>';
      for (const t of availableTrees) {
        if (t === otherTree) continue;
        const opt = document.createElement('option');
        opt.value       = t;
        opt.textContent = SKILL_LABELS[t] ?? t;
        if (t === tree) opt.selected = true;
        select.appendChild(opt);
      }

      // ── Skill level badge + XP bar ──────────────────────────────────
      const treeCol  = panel.querySelector('.skill-tree-col');
      let levelBadge = panel.querySelector('.skill-level-badge');
      let xpBarWrap  = panel.querySelector('.xp-bar-wrap');
      if (!levelBadge) {
        levelBadge = document.createElement('span');
        levelBadge.className = 'skill-level-badge';
        treeCol.appendChild(levelBadge);
      }
      if (!xpBarWrap) {
        xpBarWrap = document.createElement('div');
        xpBarWrap.className = 'xp-bar-wrap';
        xpBarWrap.innerHTML = '<div class="xp-bar"><div class="xp-fill"></div></div><span class="xp-label"></span>';
        treeCol.appendChild(xpBarWrap);
      }
      if (tree) {
        const lv      = ps.skillLevels?.[tree] ?? 1;
        const xp      = ps.skillXP?.[tree]     ?? 0;
        const needed  = lv < SKILL_LEVEL_MAX ? (XP_PER_LEVEL[lv] ?? 0) : 0;
        const pct     = needed > 0 ? Math.min(100, (xp / needed) * 100) : 100;
        levelBadge.textContent         = `Lv ${lv}`;
        levelBadge.style.display       = '';
        xpBarWrap.style.display        = '';
        xpBarWrap.querySelector('.xp-fill').style.width = `${pct}%`;
        xpBarWrap.querySelector('.xp-label').textContent =
          lv < SKILL_LEVEL_MAX ? `${xp} / ${needed} XP` : 'MAX';
      } else {
        levelBadge.style.display  = 'none';
        xpBarWrap.style.display   = 'none';
      }

      // Ability slots + wrapper filled-state
      const slots    = ps.skillAbilitySlots[tree] ?? [null, null, null, null];
      const unlocked = tree ? getUnlockedAbilities(tree, def) : [];

      panel.querySelectorAll('.skill-ability-slot').forEach(slotEl => {
        const slotIdx   = parseInt(slotEl.dataset.slot, 10);
        const abilityId = slots[slotIdx] ?? null;
        const ab        = abilityId ? DATA.abilities[abilityId] : null;
        const wrapper   = slotEl.closest('.skill-slot-wrapper');
        const isSelected =
          _selectedSkillPanel === p && _selectedAbilitySlot === slotIdx;

        slotEl.classList.remove('selected', 'filled', 'empty');
        slotEl.textContent = '';
        slotEl.dataset.abilityId = abilityId ?? '';
        if (wrapper) wrapper.classList.toggle('filled', !!ab);
        if (isSelected) slotEl.classList.add('selected');

        if (ab) {
          slotEl.classList.add('filled');
          const icon = document.createElement('span');
          icon.className   = 'abil-slot-icon';
          icon.textContent = ab.icon ?? '?';
          const name = document.createElement('span');
          name.className   = 'abil-slot-name';
          name.textContent = ab.name;
          // Derive rank from current skill level instead of static actor def rank.
          const skillLevel = tree ? (ps.skillLevels?.[tree] ?? 1) : 1;
          const rank       = getCurrentAbilityRank(ab, skillLevel);
          const rankEl     = document.createElement('span');
          rankEl.className   = 'abil-slot-rank';
          rankEl.textContent = `R${rank}`;
          slotEl.appendChild(icon);
          slotEl.appendChild(name);
          slotEl.appendChild(rankEl);
        } else {
          slotEl.classList.add('empty');
          const label = document.createElement('span');
          label.className   = 'abil-slot-empty';
          label.textContent = `Slot ${slotIdx + 1}`;
          slotEl.appendChild(label);
        }

        if (!tree || unlocked.length === 0) slotEl.classList.add('unavailable');
        else slotEl.classList.remove('unavailable');
      });
    });

    // Unified selection panel
    this._renderSelectionPanel();
  },

  // ── Unified selection panel ───────────────────────────────────────────
  // Shows inventory items (when equip slot active) or ability candidates
  // (when skill slot active), or a hint otherwise.
  _renderSelectionPanel() {
    const hint  = document.getElementById('selection-hint');
    const equip = document.getElementById('selection-equip');
    const abil  = document.getElementById('selection-ability');
    if (!hint || !equip || !abil) return;

    // ── Equip slot selected: show matching inventory items ──────────────
    if (_selectedEquipSlot) {
      hint.style.display  = 'none';
      equip.style.display = '';
      abil.style.display  = 'none';

      const header = document.getElementById('selection-equip-header');
      if (header) header.textContent =
        `${ITEM_SLOT_LABELS[_selectedEquipSlot] ?? _selectedEquipSlot} — choose from inventory`;

      const list = document.getElementById('selection-equip-list');
      list.innerHTML = '';
      const matching = _inventory.slots.filter(item => {
        const def = DATA.items[item.definitionId];
        return def && def.type === _selectedEquipSlot;
      });

      if (matching.length === 0) {
        const empty = document.createElement('p');
        empty.className   = 'selection-equip-empty';
        empty.textContent = 'No matching items in inventory.';
        list.appendChild(empty);
      } else {
        for (const item of matching) {
          const def = DATA.items[item.definitionId];
          const row = document.createElement('div');
          row.className = 'selection-item-row';
          row.dataset.inventoryIdx = _inventory.slots.indexOf(item);
          const icon = document.createElement('span');
          icon.className   = 'item-icon';
          icon.textContent = def?.icon ?? '?';
          const name = document.createElement('span');
          name.className   = `item-name rarity-text-${item.rarity ?? 'common'}`;
          name.textContent = def?.name ?? item.definitionId;
          row.appendChild(icon);
          row.appendChild(name);
          list.appendChild(row);
        }
      }
      return;
    }

    // ── Ability slot selected: show ability candidates ──────────────────
    if (_selectedSkillPanel !== null && _selectedAbilitySlot !== null) {
      hint.style.display  = 'none';
      equip.style.display = 'none';
      abil.style.display  = '';

      const ps        = _paragonState(_selectedId);
      const tree      = ps.activeSkillTypes[_selectedSkillPanel];
      const slots     = tree ? (ps.skillAbilitySlots[tree] ?? []) : [];
      const abilityId = slots[_selectedAbilitySlot] ?? null;
      const ab        = abilityId ? DATA.abilities[abilityId] : null;
      const def       = DATA.actors[_selectedId];
      const unlocked  = tree ? getUnlockedAbilities(tree, def) : [];
      const usedElsewhere = new Set(
        slots.filter((id, i) => i !== _selectedAbilitySlot && id)
      );

      const nameEl = document.getElementById('selection-abil-name');
      const tagsEl = document.getElementById('selection-abil-tags');
      const descEl = document.getElementById('selection-abil-desc');
      if (nameEl) nameEl.textContent = ab ? ab.name : `Slot ${_selectedAbilitySlot + 1}`;
      if (tagsEl) tagsEl.textContent = ab ? (ab.tags ?? []).join(', ') : '';
      if (descEl) descEl.textContent = ab ? (ab.ranks?.[0]?.description ?? '') : '';

      const list = document.getElementById('selection-abil-list');
      list.innerHTML = '';
      for (const candidate of unlocked) {
        const row = document.createElement('div');
        row.className = 'abil-candidate';
        row.dataset.abilityId = candidate.id;
        row.classList.toggle('active', candidate.id === abilityId);
        if (usedElsewhere.has(candidate.id)) {
          row.classList.add('used-elsewhere');
          row.title = 'Already assigned to another slot in this panel';
        }
        const icon = document.createElement('span');
        icon.className   = 'abil-cand-icon';
        icon.textContent = candidate.icon ?? '?';
        const name = document.createElement('span');
        name.className   = 'abil-cand-name';
        name.textContent = candidate.name;
        row.appendChild(icon);
        row.appendChild(name);
        list.appendChild(row);
      }

      return;
    }

    // ── Default: show hint ──────────────────────────────────────────────
    hint.style.display  = '';
    equip.style.display = 'none';
    abil.style.display  = 'none';
  },

  // ── Stats sub-tab ─────────────────────────────────────────────────────
  _renderStatsSubtab() {
    const tbody = document.getElementById('paragon-stat-rows');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Build a temporary actor to compute stats including equipped items and skill levels.
    const def = DATA.actors[_selectedId];
    const ps  = _paragonState(_selectedId);
    const actor = {
      subtype:            'paragon',
      maxHP:              def.baseHP,
      currentHP:          def.baseHP,
      maxArmor:           def.baseArmor,
      currentArmor:       def.baseArmor,
      baseSpeed:          def.globalSpeed ?? 1.0,
      resourceType:       def.resource?.type ?? 'none',
      resourceMax:        def.resource?.max  ?? 0,
      resource:           def.resource?.current ?? 0,
      equippedItems:      _getEquipped(_selectedId),
      skillLevels:        ps.skillLevels        ?? {},
      equippedSkillTypes: ps.activeSkillTypes    ?? [],
    };
    computeActorStats(actor);
    const stats = actor.stats ?? {};

    for (const [key, label] of Object.entries(STAT_LABELS)) {
      const val = stats[key] ?? 0;
      if (val === 0) continue;
      const tr  = document.createElement('tr');
      tr.dataset.stat = key;
      const td1 = document.createElement('td');
      td1.className   = 'stat-label';
      td1.textContent = label;
      const td2 = document.createElement('td');
      td2.className   = 'stat-value';
      td2.textContent = Number.isInteger(val) ? val : val.toFixed(2);
      tr.appendChild(td1);
      tr.appendChild(td2);
      tbody.appendChild(tr);
    }
  },

  // ── Lock overlay ──────────────────────────────────────────────────────
  _renderLockOverlay() {
    const overlay = document.getElementById('paragon-locked-overlay');
    if (!overlay) return;
    overlay.style.display = _isLocked() ? '' : 'none';
  },

  // ── Event binding ─────────────────────────────────────────────────────
  _bindEvents() {
    // Paragon list click
    document.getElementById('paragon-list')?.addEventListener('click', e => {
      const item = e.target.closest('.paragon-list-item');
      if (!item) return;
      _selectedId          = item.dataset.id;
      _selectedEquipSlot   = null;
      _selectedSkillPanel  = null;
      _selectedAbilitySlot = null;
      _activeSubtab        = 'equip';
      this.render();
    });

    // Battlefield slot click
    document.querySelectorAll('.battlefield-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        if (_isLocked()) return;
        const row   = slot.dataset.row;
        const index = parseInt(slot.dataset.index, 10);
        const cur   = _slotOccupant(row, index);

        if (cur) {
          if (cur === _selectedId) {
            _undeployParagon(cur);
          } else {
            _selectedId = cur;
          }
        } else if (_selectedId) {
          const count = _deployedCount();
          const alreadyDeployed = _isDeployed(_selectedId);
          if (!alreadyDeployed && count >= MAX_DEPLOYED_PARAGONS) return;
          _deployParagon(_selectedId, row, index);
        }
        this.render();
      });
    });

    // Sub-tab buttons
    document.getElementById('paragon-subtab-nav')?.addEventListener('click', e => {
      const btn = e.target.closest('.paragon-subtab-btn');
      if (!btn) return;
      _activeSubtab        = btn.dataset.subtab;
      _selectedEquipSlot   = null;
      _selectedSkillPanel  = null;
      _selectedAbilitySlot = null;
      this._renderDetail();
    });

    // Equipment slot click (select / deselect)
    document.getElementById('paragon-equip-grid')?.addEventListener('click', e => {
      if (_isLocked()) return;
      // Per-slot Remove button
      const removeBtn = e.target.closest('.btn-equip-remove');
      if (removeBtn && _selectedId) {
        const slotType = removeBtn.dataset.slot;
        const equipped = _getEquipped(_selectedId);
        const removed  = equipped.unequip(slotType);
        if (removed) {
          _inventory.add(removed);
          _commitEquipped(_selectedId, equipped);
        }
        if (_selectedEquipSlot === slotType) _selectedEquipSlot = null;
        this._renderEquipSubtab();
        return;
      }
      const slotEl = e.target.closest('.equip-slot');
      if (!slotEl || !_selectedId) return;
      const slotType = slotEl.dataset.slot;
      _selectedEquipSlot   = _selectedEquipSlot === slotType ? null : slotType;
      _selectedSkillPanel  = null;
      _selectedAbilitySlot = null;
      this._renderEquipSubtab();
    });

    // Equip item from inventory (click row in #selection-equip-list)
    document.getElementById('selection-equip-list')?.addEventListener('click', e => {
      if (_isLocked() || !_selectedId || !_selectedEquipSlot) return;
      const row = e.target.closest('.selection-item-row');
      if (!row) return;
      const idx  = parseInt(row.dataset.inventoryIdx, 10);
      const item = _inventory.slots[idx];
      if (!item) return;
      const equipped = _getEquipped(_selectedId);
      // Unequip current occupant → back to inventory
      const displaced = equipped.unequip(_selectedEquipSlot);
      if (displaced) _inventory.add(displaced);
      // Equip new item (remove from inventory first)
      _inventory.slots.splice(_inventory.slots.indexOf(item), 1);
      equipped.equip(item);
      _commitEquipped(_selectedId, equipped);
      _selectedEquipSlot = null;
      this._renderEquipSubtab();
    });

    // Skill tree dropdown change
    document.getElementById('paragon-skills')?.addEventListener('change', e => {
      if (_isLocked()) return;
      const select = e.target.closest('.skill-tree-select');
      if (!select || !_selectedId) return;
      const p   = parseInt(select.dataset.panel, 10);
      const val = select.value || null;
      const ps  = _paragonState(_selectedId);
      ps.activeSkillTypes[p] = val;
      _selectedSkillPanel  = null;
      _selectedAbilitySlot = null;
      _save();
      this._renderSkillPanels();
    });

    // Skill slot click + per-slot ability Remove button
    document.getElementById('paragon-skills')?.addEventListener('click', e => {
      if (_isLocked()) return;

      // Per-slot Remove button
      const removeBtn = e.target.closest('.btn-ability-remove');
      if (removeBtn && _selectedId) {
        e.stopPropagation();
        const p   = parseInt(removeBtn.dataset.panel, 10);
        const s   = parseInt(removeBtn.dataset.slot,  10);
        const ps  = _paragonState(_selectedId);
        const tree = ps.activeSkillTypes[p];
        if (tree && ps.skillAbilitySlots[tree]) {
          ps.skillAbilitySlots[tree][s] = null;
          _save();
        }
        this._renderSkillPanels();
        return;
      }

      const slotEl = e.target.closest('.skill-ability-slot');
      if (!slotEl || !_selectedId) return;
      const p    = parseInt(slotEl.dataset.panel, 10);
      const s    = parseInt(slotEl.dataset.slot,  10);
      const sameSlot = _selectedSkillPanel === p && _selectedAbilitySlot === s;
      _selectedSkillPanel  = sameSlot ? null : p;
      _selectedAbilitySlot = sameSlot ? null : s;
      _selectedEquipSlot   = null;
      this._renderEquipSubtab();
    });

    // Ability candidate click in unified selection panel
    document.getElementById('selection-ability')?.addEventListener('click', e => {
      if (_isLocked()) return;
      const row = e.target.closest('.abil-candidate');
      if (!row || _selectedSkillPanel === null || _selectedAbilitySlot === null) return;
      if (row.classList.contains('used-elsewhere')) return;
      const abilityId = row.dataset.abilityId;
      const ps   = _paragonState(_selectedId);
      const tree = ps.activeSkillTypes[_selectedSkillPanel];
      if (!tree) return;
      if (!ps.skillAbilitySlots[tree]) ps.skillAbilitySlots[tree] = [null, null, null, null];
      ps.skillAbilitySlots[tree][_selectedAbilitySlot] = abilityId;
      _save();
      this._renderSkillPanels();
    });

    // ── Hover tooltips ────────────────────────────────────────────────────

    // Ability slots in skill panels
    document.getElementById('paragon-skills')?.addEventListener('mouseover', e => {
      const slot = e.target.closest('.skill-ability-slot');
      if (!slot) return;
      const id = slot.dataset.abilityId;
      if (!id) return;
      const ab = DATA.abilities[id];
      if (ab) Tooltips.showAbility(e, ab, 0);
    });
    document.getElementById('paragon-skills')?.addEventListener('mouseleave', () => Tooltips.hide());

    // Ability candidates in selection panel
    document.getElementById('selection-ability')?.addEventListener('mouseover', e => {
      const row = e.target.closest('.abil-candidate');
      if (!row) return;
      const ab = DATA.abilities[row.dataset.abilityId];
      if (ab) Tooltips.showAbility(e, ab, 0);
    });
    document.getElementById('selection-ability')?.addEventListener('mouseleave', () => Tooltips.hide());

    // Filled equipment slots in equip grid
    document.getElementById('paragon-equip-grid')?.addEventListener('mouseover', e => {
      const slot = e.target.closest('.equip-slot.filled');
      if (!slot || !_selectedId) return;
      const item = _getEquipped(_selectedId).get(slot.dataset.slot);
      if (!item) return;
      const def = DATA.items[item.definitionId];
      if (def) Tooltips.showItem(e, item, def);
    });
    document.getElementById('paragon-equip-grid')?.addEventListener('mouseleave', () => Tooltips.hide());

    // Inventory items in the selection panel
    document.getElementById('paragon-selection-panel')?.addEventListener('mouseover', e => {
      const row = e.target.closest('.selection-item-row');
      if (!row) return;
      const idx  = parseInt(row.dataset.inventoryIdx, 10);
      const item = _inventory.slots[idx];
      if (!item) return;
      const def  = DATA.items[item.definitionId];
      if (def) Tooltips.showItem(e, item, def);
    });
    document.getElementById('paragon-selection-panel')?.addEventListener('mouseleave', () => Tooltips.hide());

    // Stat tooltips (Stats sub-tab)
    document.getElementById('paragon-stat-table')?.addEventListener('mouseover', e => {
      const tr = e.target.closest('tr[data-stat]');
      if (!tr) return;
      Tooltips.showStat(e, tr.dataset.stat);
    });
    document.getElementById('paragon-stat-table')?.addEventListener('mouseleave', () => Tooltips.hide());
  },
};
