// js/data/cinematics.js — Echoes of Germolles: Cinematic Registry
// Imported directly by js/cinematic.js — not routed through DATA/index.js.
//
// Scene types:
//   crossfade     — imageA fades out to reveal imageB with animated caption dots
//   title_card    — large centered title + optional subtitle on black
//   image_caption — single image with optional Ken Burns zoom and typewriter caption

export const CINEMATICS = {

  // ── Game intro — plays once per save on first load ─────────────────────
  'game_intro': {
    id: 'game_intro',
    scenes: [
      {
        type: 'image_caption',
        image: 'assets/cinematics/intro_1.png',
        caption: 'The ancient fortress of Germolles has fallen silent. Its halls, once filled with the warmth of court, now echo only with the footsteps of things that should not be.',
        duration: 8000,
        kenBurns: false,
      },
      {
        type: 'image_caption',
        image: 'assets/cinematics/intro_2.png',
        caption: 'A paragon answers the call. What awaits him in the depths of Germolles, none can say.',
        duration: 6000,
        kenBurns: true,
      },
      {
        type: 'title_card',
        title: 'THE ECHOES OF GERMOLLES',
        subtitle: 'A tale of ruin and reckoning.',
        duration: 3500,
      },
    ],
  },

  // ── Loot: chest found ──────────────────────────────────────────────────
  'chest_found': {
    id: 'chest_found',
    scenes: [
      {
        type: 'crossfade',
        imageA: 'assets/cinematics/chest_closed.png',
        imageB: 'assets/cinematics/chest_open.png',
        captionText: 'A chest was found',
        dotCount: 3,
        dotInterval: 600,
        holdAfter: 1000,
      },
    ],
  },

  // ── Boss intro: The Drowned Sergeant ──────────────────────────────────
  'boss_intro_sergeant': {
    id: 'boss_intro_sergeant',
    scenes: [
      {
        type: 'image_caption',
        image: 'assets/actors/drowned_sergeant.png',
        caption: 'Something stirs in the black water. It remembers its orders.',
        duration: 4000,
        kenBurns: true,
      },
      {
        type: 'title_card',
        title: 'THE DROWNED SERGEANT',
        subtitle: 'Boss Encounter',
        duration: 2500,
      },
    ],
  },


  // ── Paragon unlock: Lucile ────────────────────────────────────────────
  'lucile_unlock': {
    id: 'lucile_unlock',
    scenes: [
      {
        type: 'image_caption',
        image: 'assets/actors/lucile.png',
        caption: 'In the courtyard, through the rain — a woman you do not recognise stands watching the gate. She carries a leather satchel and a lantern, and she does not look afraid.',
        duration: 6000,
        kenBurns: true,
      },
      {
        type: 'title_card',
        title: 'LUCILE',
        subtitle: 'A new ally joins your cause.',
        duration: 3000,
      },
    ],
  },

  // ── Paragon unlock: The Harrowed Saint ───────────────────────────────
  'harrowed_saint_unlock': {
    id: 'harrowed_saint_unlock',
    scenes: [
      {
        type: 'image_caption',
        image: 'assets/actors/harrowed_saint.png',
        caption: 'He emerged from the ash and the quiet — not fleeing, not searching. Simply present, as the dead tend to be when something still holds them.',
        duration: 6000,
        kenBurns: true,
      },
      {
        type: 'title_card',
        title: 'THE HARROWED SAINT',
        subtitle: 'He walks with the dead, and they do not protest.',
        duration: 3000,
      },
    ],
  },

};
