# Actor Portraits — Setup Guide

Drop PNG files into this folder (`assets/actors/`) to give each actor a portrait on their card.
If an image is missing or fails to load, the card automatically falls back to the emoji icon — no broken images, no errors.

## Expected filenames

| File | Actor |
|---|---|
| `aldric.png` | Sir Aldric (Paragon — Knight) |
| `ysolde.png` | Ysolde (Paragon — Mage) |
| `drowned_soldier.png` | Drowned Soldier (shared by both soldier slots) |
| `siege_crossbowman.png` | Siege Crossbowman |
| `siege_warden.png` | Siege Warden (Elite) |
| `drowned_sergeant.png` | The Drowned Sergeant (Boss) |

## Recommended image specs

- **Size:** 80×100px minimum; 160×200px ideal (2× for crisp display)
- **Format:** PNG with transparency preferred (background shows through)
- **Crop:** Portrait orientation; subject fills the frame top-to-bottom; face/torso visible
- **Style:** Dark-toned, desaturated slightly — the CSS applies `saturate(0.85) contrast(1.05)` to blend with the gothic palette. Full-color art works fine too; just remove the filter in `css/style.css` under `.portrait-img`.

## How it works

Each actor definition in `js/data.js` has a `portrait` field:

```js
aldric: {
  portrait: 'assets/actors/aldric.png',
  ...
}
```

The card builder generates:

```html
<img class="portrait-img" src="assets/actors/aldric.png" alt="Sir Aldric"
     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
<span class="portrait-fallback" style="display:none">🛡️</span>
```

If the PNG loads → image displayed, fallback hidden.  
If the PNG 404s or errors → image hidden, emoji fallback shown.

## Adding a new actor portrait

1. Add your PNG to `assets/actors/your_actor.png`
2. Add `portrait: 'assets/actors/your_actor.png'` to the actor definition in `js/data.js`
3. Done — no other changes needed.

## Changing the portrait path globally

To use a CDN or a different folder, update the `portrait` paths in `js/data.js`.
You can also use absolute URLs:

```js
portrait: 'https://your-cdn.com/images/aldric.png',
```
