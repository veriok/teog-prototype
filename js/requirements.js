// js/requirements.js — Echoes of Germolles: Requirement System
//
// Requirements gate events, random pool entries, and future progression hooks.
// Each requirement is a plain object: { type, ...fields }.
//
// Context object: { inventory: Inventory, state: GameState }

/**
 * Evaluates a single requirement against the current game context.
 * @param {{ type: string, [key: string]: any }} req
 * @param {{ inventory: import('./inventory.js').Inventory, state: object }} ctx
 * @returns {boolean}
 */
export function checkRequirement(req, ctx) {
  const { inventory, state } = ctx;

  switch (req.type) {

    case 'has_item':
      // Passes if any item instance in inventory matches definitionId.
      return inventory.items.some(item => item.definitionId === req.definitionId);

    case 'has_paragon':
      // Passes if the paragon appears in the current battlefield config.
      return (state.battlefield || []).some(e => e.paragonId === req.paragonId);

    case 'paragon_has_equipped': {
      // Passes if the specified paragon has an item with definitionId in any slot.
      const ps = state.paragonStates?.[req.paragonId];
      if (!ps?.equippedItems) return false;
      return Object.values(ps.equippedItems).some(item => item?.definitionId === req.definitionId);
    }

    case 'game_flag':
      // Passes if state.gameFlags[flagId] strictly equals the expected value.
      return state.gameFlags?.[req.flagId] === req.value;

    case 'building_level':
      // Stub — castle buildings not yet implemented; always fails.
      return false;

    default:
      console.warn(`[Requirements] Unknown requirement type: "${req.type}"`);
      // Unknown requirements pass to avoid hard-blocking unrecognised future types.
      return true;
  }
}

/**
 * Returns true only if every requirement in the array passes.
 * An empty or missing array always passes (no requirements = always available).
 * @param {Array|undefined} reqs
 * @param {object} ctx
 * @returns {boolean}
 */
export function checkRequirements(reqs, ctx) {
  if (!reqs || reqs.length === 0) return true;
  return reqs.every(r => checkRequirement(r, ctx));
}
