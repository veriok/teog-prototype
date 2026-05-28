// js/tooltips.js — Echoes of Germolles: Shared Tooltip Infrastructure
//
// Singleton that owns the single tooltip <div>, cursor tracking, and all
// HTML builders.  Import Tooltips wherever hover tooltips are needed.

import { DamageType } from './enums.js';

// ── Stat metadata (for the Stats sub-tab tooltips) ───────────────────────

const STAT_NAMES = {
  hp:             'HP',
  armor:          'Armor',
  slashingDmg:    'Slashing Dmg',
  flatDmg:        'Flat Dmg',
  critChance:     'Crit Chance',
  speed:          'Speed',
  blockBonus:     'Block Bonus',
  armorRegen:     'Armor Regen',
  fireDmgBonus:   'Fire Dmg Bonus',
  burnDuration:   'Burn Duration',
  voidDmgBonus:   'Void Dmg Bonus',
  entropyBonus:   'Entropy Bonus',
};

const STAT_DESCRIPTIONS = {
  hp:             'Maximum hit points. When reduced to 0 the paragon is knocked out of battle.',
  armor:          'Absorbs incoming damage before HP is reduced. Regenerates fully between battles.',
  slashingDmg:    'Extra damage added to physical slashing attacks.',
  flatDmg:        'Flat bonus added to all damaging abilities regardless of type.',
  critChance:     'Probability (0–1) that an attack deals double damage.',
  speed:          'Global speed multiplier applied to all ability cooldowns. Higher means faster.',
  blockBonus:     'Increases damage absorbed per block stack.',
  armorRegen:     'Armor points restored each second while in combat.',
  fireDmgBonus:   'Percentage bonus applied to all fire-element damage dealt.',
  burnDuration:   'Extends the duration of all burn stacks inflicted by this paragon.',
  voidDmgBonus:   'Percentage bonus applied to all void-element damage dealt.',
  entropyBonus:   'Amplifies entropy effects — stacks accumulate faster and trigger more often.',
};

// ── Formatting helpers ────────────────────────────────────────────────────

function _capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function _formatType(type, subtype) {
  const typeLabel = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  if (!subtype) return typeLabel;
  const subLabel  = subtype.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `${typeLabel} — ${subLabel}`;
}

// ── Singleton ─────────────────────────────────────────────────────────────

export const Tooltips = {

  _el: null,   // the single <div class="tooltip"> appended to <body>

  // ── Init ────────────────────────────────────────────────────────────────
  init() {
    this._el = document.createElement('div');
    this._el.className    = 'tooltip';
    this._el.style.display = 'none';
    document.body.appendChild(this._el);
    document.addEventListener('mousemove', e => this._move(e));
  },

  // ── Ability tooltip ──────────────────────────────────────────────────────
  // abilityDef : object from DATA.abilities
  // rankIndex  : 0-based rank index
  // actor      : live ActorRuntime (optional) — used to apply stat bonuses to displayed values
  showAbility(e, abilityDef, rankIndex = 0, actor = null, threat = false) {
    const rank = abilityDef.ranks?.[rankIndex] ?? abilityDef.ranks?.[0];
    if (!rank) return;

    // Resolve ability-level damageType array.
    const dtypes       = abilityDef.damageType ?? [];
    const isMixed      = dtypes.length > 1;
    const dtypeLabel   = isMixed ? `random (${dtypes.join('/')})` : (dtypes[0] ?? null);
    const dtypeForBonus = isMixed ? null : (dtypes[0] ?? null);

    // Stat-adjusted damage: applies flatDmg + type-specific bonuses from the actor's stats.
    const effectiveDmg = (base) => {
      if (!actor?.stats || !base) return base;
      const s = actor.stats;
      let d = base + (s.flatDmg ?? 0);
      if (dtypeForBonus === DamageType.SLASHING) d += s.slashingDmg  ?? 0;
      if (dtypeForBonus === DamageType.FIRE)     d += s.fireDmgBonus ?? 0;
      if (dtypeForBonus === DamageType.VOID)     d += s.voidDmgBonus ?? 0;
      return Math.max(0, Math.round(d));
    };

    // Effective cost: rage pays 25%, resolve pays 33%.
    const effCost = (base) => {
      if (!base || !actor) return base;
      if (actor.resourceType === 'rage')    return Math.ceil(base * 0.25);
      if (actor.resourceType === 'resolve') return Math.ceil(base * 0.33);
      return base;
    };

    // Damage-type emoji map.
    const DTYPE_EMOJI = {
      slashing:    '🗡️',
      piercing:    '🏹',
      bludgeoning: '🔨',
      fire:        '🔥',
      cold:        '❄️',
      lightning:   '⚡',
      void:        '🌑',
      arcana:      '✨',
      nature:      '🌿',
      true:        '💀',
    };
    const dtypeSpan = isMixed
      ? ` ${dtypes.map(d => DTYPE_EMOJI[d] ?? d).join(' / ')}`
      : (dtypes[0] ? ` ${DTYPE_EMOJI[dtypes[0]] ?? dtypes[0]}` : '');
    const RES_ABBR  = { energy: 'EN', rage: 'RG', resolve: 'RES', threat: 'THR', none: '' };
    const resLabel  = actor ? (RES_ABBR[actor.resourceType] ?? actor.resourceType) : '';

    let html = `<strong>${abilityDef.icon ?? ''} ${abilityDef.name}</strong>`;

    if (threat) {
      html += `<div class="tt-threat-label">Threat Ability</div>`;
    }

    if ((abilityDef.tags ?? []).length > 0) {
      const pills = abilityDef.tags.map(t => `<span class="tag-pill">${t[0].toUpperCase() + t.slice(1)}</span>`).join('');
      html += `<div class="tt-tags">${pills}</div>`;
    }

    if (rank.cooldown != null) {
      html += `<div class="tt-cd">CD: ${rank.cooldown}s</div>`;
    }

    if (threat) {
      html += `<div class="tt-threat-cost">Always cast at 100% Threat</div>`;
    } else if (rank.cost) {
      const displayed = effCost(rank.cost);
      html += `<div class="tt-res">Cost: ${displayed}${resLabel ? ` ${resLabel}` : ''}</div>`;
    }
    if (threat && abilityDef.isPhaseTransition) {
      html += `<div class="tt-phase-transition">— Phase Transition —</div>`;
    }

    // ── Damage ───────────────────────────────────────────────────────────
    if (rank.damage) {
      html += `<div class="tt-dmg">Damage: ${effectiveDmg(rank.damage)}${dtypeSpan}</div>`;
    }
    if (rank.splashDmg) {
      html += `<div class="tt-dmg">Splash: ${effectiveDmg(rank.splashDmg)}${dtypeSpan}</div>`;
    }
    if (rank.armorDamage) {
      html += `<div class="tt-dmg">Armor Damage: ${rank.armorDamage}</div>`;
    }

    // ── Heals & restores ─────────────────────────────────────────────────
    if (rank.healAmount || rank.healHp) {
      html += `<div>Heal: ${rank.healAmount ?? rank.healHp} HP</div>`;
    }
    if (rank.armorAmount || rank.armorRestore) {
      html += `<div>Restore Armor: +${rank.armorAmount ?? rank.armorRestore}</div>`;
    }
    if (rank.resourceAmount) {
      html += `<div>Restore Resource: +${rank.resourceAmount}${resLabel ? ` ${resLabel}` : ''}</div>`;
    }

    // ── Status effects ────────────────────────────────────────────────────
    if (rank.guardStacks)       html += `<div>Guard: +${rank.guardStacks} stacks (${rank.guardStacks * 2}s)</div>`;
    if (rank.hasteStacks)       html += `<div>Haste: +${rank.hasteStacks} stacks (${rank.hasteStacks * 2}s)</div>`;
    if (rank.slowStacks)        html += `<div>Slow: +${rank.slowStacks} stacks (${rank.slowStacks * 2}s)</div>`;
    if (rank.stacks)            html += `<div>Bleed: +${rank.stacks} stacks (${rank.stacks * 2}s)</div>`;
    if (rank.regenStacks)       html += `<div>Regen: +${rank.regenStacks} stacks (${rank.regenStacks * 2}s)</div>`;
    if (rank.poisonStacks)      html += `<div>Poison: +${rank.poisonStacks} stacks (${rank.poisonStacks * 2}s)</div>`;
    if (rank.blurStacks)        html += `<div>Blur: +${rank.blurStacks} stacks (${rank.blurStacks * 2}s)</div>`;
    if (rank.energizeStacks)    html += `<div>Energize: +${rank.energizeStacks} stacks (${rank.energizeStacks * 2}s)</div>`;
    if (rank.retaliationStacks) html += `<div>Retaliation: +${rank.retaliationStacks} stacks</div>`;
    if (rank.stunChance > 0)    html += `<div>Stun chance: ${Math.round(rank.stunChance * 100)}%</div>`;
    if (rank.burnChance > 0)    html += `<div>Burn chance: ${Math.round(rank.burnChance * 100)}%</div>`;
    if (rank.burnStacks)        html += `<div>Burn: +${rank.burnStacks} stacks</div>`;
    if (rank.ignoresGuard)      html += `<div style="color:var(--text-dim);font-size:0.73rem">Ignores Guard</div>`;

    // ── Threat ───────────────────────────────────────────────────────────
    if (rank.threatDrain) html += `<div>Drain Threat: ${rank.threatDrain}</div>`;
    if (rank.selfThreat)  html += `<div>Gain Threat: +${rank.selfThreat}</div>`;

    if (!threat) {
      html += `<div style="margin-top:4px;font-style:italic;color:#7a6e8a">Rank ${rankIndex + 1}</div>`;
    }
    this.showRaw(html, e);
  },

  // ── Item tooltip ─────────────────────────────────────────────────────────
  // item : ItemInstance (has .rarity, .baseAttribute, .slots[])
  // def  : DATA.items[item.definitionId]  (has .name, .icon, .type, .subtype, .value, .canDestroy)
  showItem(e, item, def) {
    if (!item || !def) return;
    const rarityLabel = _capitalize(item.rarity ?? 'common');
    const typeLabel   = _formatType(def.type ?? '', def.subtype);
    const iconHTML    = def.icon
      ? `<img src="${def.icon}" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;margin-right:4px">`
      : `<span style="margin-right:4px">❓</span>`;

    let html = `<strong>${iconHTML}${def.name}</strong>`;
    html += `<div style="color:var(--text-dim);font-size:0.73rem;margin-top:2px">${typeLabel} · <span class="tt-rarity-${item.rarity}">${rarityLabel}</span></div>`;
    html += `<div class="tt-divider"></div>`;
    if (item.baseAttribute) {
      html += `<div>Base: <em>${item.baseAttribute.name}</em> +${item.baseAttribute.effectValue?.toFixed(2) ?? '?'}</div>`;
    }
    if (item.slots?.length > 0) {
      item.slots.forEach(mod => {
        const tag = `[${(mod.modifierType ?? '').toUpperCase()}]`;
        html += `<div style="color:var(--text-dim);font-size:0.78rem">${tag} ${mod.name} +${mod.effectValue?.toFixed(2) ?? '?'}</div>`;
      });
    }
    html += `<div class="tt-divider"></div>`;
    html += `<div style="color:var(--text-dim);font-size:0.73rem">Value: ${def.value ?? '?'}`;
    if (!def.canDestroy) html += ` · <span style="color:var(--text-gold)">Cannot be destroyed</span>`;
    html += `</div>`;

    this.showRaw(html, e);
  },

  // ── Stat tooltip (for the Stats sub-tab) ─────────────────────────────────
  // statKey : one of the STAT_NAMES keys
  showStat(e, statKey) {
    const name = STAT_NAMES[statKey];
    const desc = STAT_DESCRIPTIONS[statKey];
    if (!name && !desc) return;
    let html = `<strong>${name ?? statKey}</strong>`;
    if (desc) html += `<div style="max-width:200px;margin-top:4px;font-size:0.76rem;color:var(--text-parchment);line-height:1.45">${desc}</div>`;
    this.showRaw(html, e);
  },

  // ── Resistance tooltip ────────────────────────────────────────────────────
  // Shows a formatted breakdown of the actor's current resistances/vulnerabilities.
  showResistances(e, actor) {
    const ALL_TYPES = [
      DamageType.SLASHING, DamageType.PIERCING, DamageType.BLUDGEONING,
      DamageType.FIRE, DamageType.COLD, DamageType.LIGHTNING,
      DamageType.VOID, DamageType.ARCANA, DamageType.NATURE, DamageType.DECAY,
    ];
    const rows = [];
    for (const dtype of ALL_TYPES) {
      const val = actor.getEffectiveResistance(dtype);
      let keyword, cssClass;
      if (val >= 1.0) { keyword = 'Immune';        cssClass = 'resist-immune'; }
      else if (val >= 0.75) { keyword = 'Near Immune';   cssClass = 'resist-near-immune'; }
      else if (val >= 0.50) { keyword = 'Very Resistant'; cssClass = 'resist-very-resistant'; }
      else if (val >= 0.25) { keyword = 'Resistant';     cssClass = 'resist-resistant'; }
      else if (val < 0)     { keyword = 'Vulnerable';    cssClass = 'resist-vulnerable'; }
      else continue; // normal (0..0.25 exclusive) — skip
      const label = dtype.charAt(0).toUpperCase() + dtype.slice(1);
      rows.push(`<div class="resist-row"><span class="resist-type">${label}</span><span class="${cssClass}">${keyword}</span></div>`);
    }
    let html = `<strong>\ud83d\udee1 Resistances</strong>`;
    if (rows.length === 0) {
      html += `<div style="color:var(--text-dim);font-size:0.73rem;margin-top:4px">No special resistances.</div>`;
    } else {
      html += `<div class="tt-divider"></div>${rows.join('')}`;
    }
    this.showRaw(html, e);
  },

  // ── Raw HTML tooltip ─────────────────────────────────────────────────────
  showRaw(html, e) {
    this._el.innerHTML     = html;
    this._el.style.display = 'block';
    this._move(e);
  },

  // ── Hide ─────────────────────────────────────────────────────────────────
  hide() {
    if (this._el) this._el.style.display = 'none';
  },

  // ── Internal: position at cursor with edge detection ─────────────────────
  _move(e) {
    if (!this._el || this._el.style.display === 'none') return;
    const tw = this._el.offsetWidth;
    const th = this._el.offsetHeight;
    let x = e.clientX + 14;
    let y = e.clientY + 14;
    if (x + tw > window.innerWidth  - 8) x = e.clientX - tw - 14;
    if (y + th > window.innerHeight - 8) y = e.clientY - th - 14;
    this._el.style.left = `${x}px`;
    this._el.style.top  = `${y}px`;
  },
};
