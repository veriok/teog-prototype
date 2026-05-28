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
  void_vulnerability: {
    id: 'void_vulnerability', label: 'Void Vulnerability', icon: '🌑',
    cssClass: 'status-void_vulnerability',
    stackMode: 'stack', maxStacks: 3,
    compareBase: 0.12,
    tooltip: 'Reduces Void resistance by 12% per stack (max −36%). Each stack lasts 2s.',
  },
  poisoned: {
    id: 'poisoned', label: 'Poisoned', icon: '🤢',
    cssClass: 'status-poisoned',
    stackMode: 'stack', maxStacks: 5,
    compareBase: 3,
    tickEffect: (actor, stacks, evps) => ({ type: 'damage', amount: stacks * evps, damageType: 'nature', isDot: true }),
    tooltip: 'Deals 3 nature DoT damage per stack every 2s. Bypasses armor.',
  },
  fire_vulnerable: {
    id: 'fire_vulnerable', label: 'Fire Vulnerable', icon: '🔥',
    cssClass: 'status-fire_vulnerable',
    stackMode: 'stack', maxStacks: 3,
    compareBase: 0.12,
    tooltip: 'Increases fire damage taken by 12% per stack (max +36%). Each stack lasts 2s.',
  },
  lightning_vulnerable: {
    id: 'lightning_vulnerable', label: 'Lightning Vulnerable', icon: '⚡',
    cssClass: 'status-lightning_vulnerable',
    stackMode: 'stack', maxStacks: 3,
    compareBase: 0.12,
    tooltip: 'Increases lightning damage taken by 12% per stack (max +36%). Each stack lasts 2s.',
  },
  fire_retaliation: {
    id: 'fire_retaliation', label: 'Fire Retaliation', icon: '🔥',
    cssClass: 'status-fire_retaliation',
    stackMode: 'stack', maxStacks: 3,
    compareBase: 5,
    tooltip: 'Returns 5 fire damage per stack to melee attackers. Each stack lasts 2s.',
  },
  lightning_retaliation: {
    id: 'lightning_retaliation', label: 'Lightning Retaliation', icon: '⚡',
    cssClass: 'status-lightning_retaliation',
    stackMode: 'stack', maxStacks: 3,
    compareBase: 5,
    tooltip: 'Returns 5 lightning damage per stack to melee attackers. Each stack lasts 2s.',
  },
  weakness: {
    id: 'weakness', label: 'Weakness', icon: '💔',
    cssClass: 'status-weakness',
    stackMode: 'stack', maxStacks: 3,
    compareBase: 0.08,
    tooltip: 'Reduces outgoing damage by 8% per stack (max −24%). Each stack lasts 2s.',
  },
  blur: {
    id: 'blur', label: 'Blur', icon: '👁️',
    cssClass: 'status-blur',
    stackMode: 'stack', maxStacks: 3,
    compareBase: 0.10,
    tooltip: 'Each stack gives 10% chance to evade ranged or spell abilities (rolls independently per tag). Each stack lasts 2s.',
  },
  energize: {
    id: 'energize', label: 'Energize', icon: '⚡',
    cssClass: 'status-energize',
    stackMode: 'stack', maxStacks: 3,
    compareBase: 8,
    tooltip: 'Adds 8 flat lightning damage per stack to lightning attacks. Each stack lasts 2s.',
  },
  shadow_fade: {
    id: 'shadow_fade', label: 'Shadow Fade', icon: '👻',
    cssClass: 'status-shadow_fade',
    stackMode: 'stack', maxStacks: 5,
    compareBase: 1,
    // Called by _tickStatuses when last stack expires — sets shadow HP to 0
    onExpire: (engine, actor) => { actor.currentHP = 0; },
    tooltip: 'Shadow dissipates when stacks run out (~10 seconds).',
  },
};
