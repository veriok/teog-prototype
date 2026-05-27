// js/data/statuses.js

// All statuses use a unified timing model:
//   1 stack = 2 real seconds. Every 2s the engine decrements 1 stack from every entry.
//   tickEffect statuses fire their effect before decrementing. No separate `duration` field.
//   For non-tickEffect statuses the "strongest wins" rule applies across multiple caster entries
//   (only the entry with the highest compareBase × stacks is `isActive`).
export const statuses = {
  bleeding: {
    id: 'bleeding', label: 'Bleed', icon: '🩸',
    cssClass: 'status-bleeding',
    stackMode: 'stack', maxStacks: 5,
    // tickEffect(actor, stacks, effectiveValuePerStack) — evps set at apply time from caster snapshot
    tickEffect: (actor, stacks, evps) => ({ type: 'damage', amount: stacks * evps, damageType: 'slashing', isDot: true }),
    tooltip: 'Deals 6 slashing DoT damage per stack every 2s. Bypasses armor. Boosted by Bleed Damage.',
  },
  burning: {
    id: 'burning', label: 'Burn', icon: '🔥',
    cssClass: 'status-burning',
    stackMode: 'stack', maxStacks: 5,
    tickEffect: (actor, stacks, evps) => ({ type: 'damage', amount: stacks * evps, damageType: 'fire', isDot: true }),
    tooltip: 'Deals 4 fire DoT damage per stack every 2s. Bypasses armor. Boosted by Burn Damage.',
  },
  stun: {
    id: 'stun', label: 'Stun', icon: '⚡',
    cssClass: 'status-stun',
    stackMode: 'unique', maxStacks: 1,
    compareByDuration: true,
    freezesCooldowns: true,
    tooltip: 'Freezes all cooldowns. Cannot act. 1 stack = 2 seconds.',
  },
  slow: {
    id: 'slow', label: 'Slow', icon: '❄️',
    cssClass: 'status-slow',
    stackMode: 'stack', maxStacks: 5,
    compareBase: 0.10,
    speedModPerStack: -0.10,
    tooltip: 'Reduces GlobalSpeed by 0.10 per stack. Each stack lasts 2s.',
  },
  haste: {
    id: 'haste', label: 'Haste', icon: '⚡',
    cssClass: 'status-haste',
    stackMode: 'stack', maxStacks: 5,
    compareBase: 0.10,
    speedModPerStack: 0.10,
    tooltip: 'Increases GlobalSpeed by 0.10 per stack. Each stack lasts 2s.',
  },
  guard: {
    id: 'guard', label: 'Guard', icon: '🛡️',
    cssClass: 'status-guard',
    stackMode: 'stack', maxStacks: 6,
    compareBase: 5,
    tooltip: 'Absorbs damage per stack before HP is hit. Consumed on hit; also decays 1 stack every 2s.',
  },
  root: {
    id: 'root', label: 'Root', icon: '🌿',
    cssClass: 'status-root',
    stackMode: 'unique', maxStacks: 1,
    compareByDuration: true,
    blocksMelee: true,
    tooltip: 'Blocks melee abilities. Cooldowns drain normally. 1 stack = 2 seconds.',
  },
  regen: {
    id: 'regen', label: 'Regen', icon: '💚',
    cssClass: 'status-regen',
    stackMode: 'stack', maxStacks: 5,
    tickEffect: (actor, stacks, evps) => ({ type: 'heal', target: actor, amount: stacks * evps }),
    tooltip: 'Restores HP per stack every 2s; removes 1 stack per tick. Cleared at battle end.',
  },
  void_exposed: {
    id: 'void_exposed', label: 'Void Exposed', icon: '🌑',
    cssClass: 'status-void_exposed',
    stackMode: 'stack', maxStacks: 3,
    compareBase: 0.12,
    tooltip: 'Reduces Void resistance by 12% per stack (max 3 stacks = −36%). Each stack lasts 2s.',
  },
};
