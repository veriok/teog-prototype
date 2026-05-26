// js/data/index.js

import { statuses }   from './statuses.js';
import { abilities }  from './abilities.js';
import { actors }     from './actors.js';
import { paragons }   from './paragons.js';
import { locations }  from './locations.js';
import { items }      from './items.js';
import { modifiers }  from './modifiers.js';

export const DATA = {
  statuses,
  abilities,
  actors:   { ...actors, ...paragons }, // merged flat lookup — DATA.actors[id] works for all
  paragons,                             // separate namespace for unlock checks & paragon-specific data
  locations,
  items,
  modifiers,
};
