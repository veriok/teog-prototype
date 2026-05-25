// js/save.js — Echoes of Germolles: Save System

import { UI } from './ui.js';

const SAVE_KEY = 'germolles_save';

export const Save = {

  // ── Default state ──────────────────────────────────────────────────────
  _default() {
    return {
      version: 6,
      selectedLocationId: null,
      locationProgress: {
        flooded_cellars: {
          currentEventIndex: 0, completedEvents: [], zoneConquered: false,
          paragonHP: {}, resolvedEvents: {}, randomEventCounts: {},
        }
      },
      runCount: 0,
      victories: 0,
      defeats: 0,
      uniqueDroppedItems: [],
      currencies: { souls: 0 },
      inventoryCapacity: 20,
      introPlayed: false,
      savedAt: null,
      // v4 — Paragon screen
      unlockedParagonIds: [],      // populated by main.js from DATA on first run
      paragonStates:      {},      // keyed by paragonId; initialized lazily in ParagonUI
      battlefield:        [],      // { row, index, paragonId }[]
      inventoryItems:     [],      // serialized ItemInstance[]
      // v5 — Progression flags
      gameFlags:          {},      // key:value store for story/progression state
    };
  },

  // ── Load from localStorage ─────────────────────────────────────────────
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return this._default();
      const parsed = JSON.parse(raw);
      // Migrate v1 → v2 (flat zone progress → per-location map)
      if ((parsed.version || 1) < 2) {
        const migrated = this._default();
        migrated.runCount  = parsed.runCount  || 0;
        migrated.victories = parsed.victories || 0;
        migrated.defeats   = parsed.defeats   || 0;
        migrated.savedAt   = parsed.savedAt   || null;
        migrated.locationProgress.flooded_cellars = {
          currentEventIndex: parsed.currentEventIndex || 0,
          completedEvents:   parsed.completedEvents   || [],
          zoneConquered:     parsed.zoneConquered     || false,
        };
        return migrated;
      }
      // Migrate v2 → v3 (add uniqueDroppedItems)
      if (parsed.version < 3) {
        parsed.uniqueDroppedItems = [];
        parsed.version = 3;
      }
      // Migrate v3 → v4 (add Paragon screen state + inventory persistence)
      if (parsed.version < 4) {
        parsed.unlockedParagonIds = [];
        parsed.paragonStates      = {};
        parsed.battlefield        = [];
        parsed.inventoryItems     = [];
        parsed.version = 4;
      }
      // Migrate v4 → v5 (add gameFlags + per-location HP/event state)
      if (parsed.version < 5) {
        parsed.gameFlags = {};
        for (const id of Object.keys(parsed.locationProgress || {})) {
          const p = parsed.locationProgress[id];
          p.paragonHP         = p.paragonHP         || {};
          p.resolvedEvents    = p.resolvedEvents    || {};
          p.randomEventCounts = p.randomEventCounts || {};
        }
        parsed.version = 5;
      }
      // Migrate v5 → v6 (add skill levels, XP, and unlockable slot to paragonStates)
      if (parsed.version < 6) {
        for (const [paragonId, ps] of Object.entries(parsed.paragonStates ?? {})) {
          if (!ps.skillLevels)        ps.skillLevels        = {};
          if (!ps.skillXP)            ps.skillXP            = {};
          if (!ps.unlockedSkillTypes) ps.unlockedSkillTypes = [];
          // Seed skill level 1 / 0 XP for every tree that already has ability slots.
          for (const tree of Object.keys(ps.skillAbilitySlots ?? {})) {
            ps.skillLevels[tree] = ps.skillLevels[tree] ?? 1;
            ps.skillXP[tree]     = ps.skillXP[tree]     ?? 0;
          }
        }
        parsed.version = 6;
      }
      return Object.assign(this._default(), parsed);
    } catch (e) {
      console.warn('Save load failed, using defaults:', e);
      return this._default();
    }
  },

  // ── Write to localStorage ──────────────────────────────────────────────
  write(state) {
    try {
      state.savedAt = new Date().toISOString();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      UI.flashSave();
    } catch (e) {
      console.warn('Save write failed:', e);
    }
  },

  // ── Wipe all progress ──────────────────────────────────────────────────
  wipe() {
    localStorage.removeItem(SAVE_KEY);
  },

  // ── Check if save exists ───────────────────────────────────────────────
  exists() {
    return !!localStorage.getItem(SAVE_KEY);
  },

  // ── Human-readable timestamp ───────────────────────────────────────────
  savedAtLabel(state) {
    if (!state.savedAt) return 'No save data';
    const d = new Date(state.savedAt);
    return d.toLocaleString();
  }
};
