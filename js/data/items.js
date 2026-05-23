// js/data/items.js — Echoes of Germolles: Item Definitions
//
// Static item definitions. All fields here are immutable across every
// instance of that item. Dynamic components (rarity, rolled mods) live on
// ItemInstance in inventory.js.
//
// baseAttributeId  — references a non-rollable modifier in modifiers.js;
//                    its effectValue is formula-computed at drop time.
// canDestroy       — false for quest/unique items that must not be discarded.

import { ItemType, ItemSubtype } from '../enums.js';

export const items = {

  drowned_sword: {
    id: 'drowned_sword', name: "Drowned Soldier's Sword",
    icon: null,
    type: ItemType.MAIN_HAND, subtype: ItemSubtype.SWORD,
    maxStack: 1, value: 8,
    canDestroy: true,
    baseAttributeId: 'base_slashing_dmg',
  },

  drowned_shield: {
    id: 'drowned_shield', name: "Drowned Soldier's Shield",
    icon: null,
    type: ItemType.OFFHAND, subtype: ItemSubtype.SHIELD,
    maxStack: 1, value: 6,
    canDestroy: true,
    baseAttributeId: 'base_armor_value',
  },

  warden_helm: {
    id: 'warden_helm', name: "Warden's Helmet",
    icon: null,
    type: ItemType.HELMET, subtype: undefined,
    maxStack: 1, value: 15,
    canDestroy: true,
    baseAttributeId: 'base_armor_value',
  },

  // Quest item — canDestroy: false, unique drop (see actor drop table).
  sergeant_medallion: {
    id: 'sergeant_medallion', name: "Sergeant's Medallion",
    icon: null,
    type: ItemType.AMULET, subtype: undefined,
    maxStack: 1, value: 50,
    canDestroy: false,
    baseAttributeId: 'base_flat_dmg',
  },

};
