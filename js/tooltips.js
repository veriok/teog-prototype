// js/tooltips.js — Echoes of Germolles: Shared Tooltip Infrastructure
//
// Singleton that owns the single tooltip <div>, cursor tracking, and all
// HTML builders.  Import Tooltips wherever hover tooltips are needed.

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
  // abilityDef : object from DATA.abilities  (has .name, .icon, .ranks[])
  // rankIndex  : 0-based rank index (0 = Rank 1)
  showAbility(e, abilityDef, rankIndex = 0) {
    const rank = abilityDef.ranks?.[rankIndex] ?? abilityDef.ranks?.[0];
    if (!rank) return;
    const dtype = rank.damageType
      ? ` <span style="color:var(--text-dim);font-size:0.75rem">(${rank.damageType})</span>`
      : '';

    let html = `<strong>${abilityDef.icon ?? ''} ${abilityDef.name}</strong>`;
    html += `<div class="tt-cd">CD: ${rank.cooldown}s</div>`;
    if (rank.cost)         html += `<div class="tt-res">Cost: ${rank.cost.amount} ${rank.cost.type}</div>`;
    if (rank.damage)       html += `<div class="tt-dmg">Damage: ${rank.damage}${dtype}</div>`;
    if (rank.splashDmg)    html += `<div class="tt-dmg">Splash: ${rank.splashDmg}${dtype}</div>`;
    if (rank.stunDuration) html += `<div>Stun: ${rank.stunDuration}s</div>`;
    if (rank.rootDuration) html += `<div>Root: ${rank.rootDuration}s</div>`;
    if (rank.stacks)       html += `<div>Bleed: +${rank.stacks} stacks (${rank.duration}s)</div>`;
    if (rank.burnChance && rank.burnChance > 0)
                           html += `<div>Burn chance: ${Math.round(rank.burnChance * 100)}%</div>`;
    if (rank.burnStacks)   html += `<div>Burn: +${rank.burnStacks} stacks (8s)</div>`;
    if (rank.slowStacks)   html += `<div>Slow: +${rank.slowStacks} stacks (${rank.slowDuration}s)</div>`;
    if (rank.hasteStacks)  html += `<div>Haste: +${rank.hasteStacks} stacks (${rank.hasteDuration}s)</div>`;
    if (rank.guardStacks)  html += `<div>Guard: +${rank.guardStacks} stacks (12s)</div>`;
    if (rank.healHp)       html += `<div>Heal: ${rank.healHp} HP</div>`;
    if (rank.armorRestore) html += `<div>Restore Armor: +${rank.armorRestore}</div>`;
    if (rank.threatDrain)  html += `<div>Drain Threat: ${rank.threatDrain}</div>`;
    if (rank.selfThreat)   html += `<div>Gain Threat: +${rank.selfThreat}</div>`;
    html += `<div style="margin-top:4px;font-style:italic;color:#7a6e8a">Rank ${rankIndex + 1}</div>`;

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
