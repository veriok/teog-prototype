// js/save.js — Echoes of Germolles: Save System

import { UI } from './ui.js';

const SAVE_KEY = 'germolles_save';

export const Save = {

  // ── Default state ──────────────────────────────────────────────────────
  _default() {
    return {
      version: 3,
      selectedLocationId: null,
      locationProgress: {
        flooded_cellars: { currentEventIndex: 0, completedEvents: [], zoneConquered: false }
      },
      runCount: 0,
      victories: 0,
      defeats: 0,
      uniqueDroppedItems: [],
      currencies: { souls: 0 },
      inventoryCapacity: 20,
      introPlayed: false,
      savedAt: null,
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
