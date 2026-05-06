# FlightBoxV3 Design Sandbox

Iframe-based sandbox for refactoring webfs disclosures, dialogs, and the
Map Layers modal without touching the live `webfs/` codebase.

> **If you're a Claude Design instance reading this for the first time,
> start with [`BRIEF.md`](BRIEF.md).** It explains the project, what's
> already shipped on two reference scenes, and what's left to do. This
> README is a tour of the sandbox plumbing; BRIEF.md is the work order.

## Architecture

Each **scene** is a stand-alone HTML file that loads the verbatim webfs CSS
and uses the verbatim webfs DOM structure (real `#app-frame`, real
`.weather-popup-shell`, etc.). Diffs against a scene file port back into
webfs unchanged.

```
design-sandbox/
├── index.html              ← Iframe shell (sidebar nav + iframe)
├── sandbox.css             ← Shell chrome only (sidebar, stage, iframe wrap)
├── README.md, CONSTRAINTS.md
├── styles/                 ← Verbatim copies of webfs CSS
│   └── index-{tokens,base,layout,map,navigation,flightbox,overlays,dialogs,aircraft-profile,responsive}.css
├── assets/                 ← Icons + favicon + downloads-real.png + (drop) map-placeholder.png
└── scenes/
    ├── scene.css           ← Sandbox-only chrome that lives inside scenes
    │                          (map-area placeholder pattern, watermark)
    ├── scene.js            ← Minimal interactivity (close, tabs, accordions)
    ├── frame.html          ← App frame, no overlays
    ├── splash.html
    ├── buttonbar.html
    ├── airport.html        ← Airport disclosure (verbatim KGTU DOM)
    ├── weather.html
    ├── mappoint.html
    ├── navaid.html
    ├── advisory.html
    ├── maplayers.html      ← The conversion target — currently a top-right dialog
    ├── settings.html
    ├── aircraft.html
    ├── aircraft-templates.html
    ├── downloads.html      ← Static screenshot (live signaling too noisy to recreate)
    ├── flightbox.html
    ├── flightplan.html
    ├── procedures.html
    ├── notam.html          ← Proposed new (Phase D)
    └── briefing.html       ← Proposed new
```

## Run it

```sh
cd design-sandbox
python3 -m http.server 8765
# open http://localhost:8765/
```

`file://` works for the shell but iframes from `file://` can be flaky;
HTTP is recommended.

## How to navigate

The left sidebar lists every scene. Clicking a scene loads it in the
iframe. Theme toggle (Night/Day) and Base toggle (Vector/Sectional/IFR-L/
Terrain/Sat) propagate to the iframe via query params; `scene.js` reads
them and applies `data-appearance` / `data-base-layer` to `<html>`.

You can also open any scene standalone — there's an "Open scene
standalone ↗" link at the bottom of the sidebar that opens the current
scene's HTML directly. Useful when iterating.

## How to iterate as a designer

1. Read `CONSTRAINTS.md` first.
2. Pick a scene from the sidebar.
3. Open `scenes/<name>.html` in your editor.
4. Edit the markup or add sandbox-only CSS via a `<style>` block.
5. Reload. The iframe re-reads the file each time.
6. When the design is approved, port back into webfs:
   - HTML markup → `webfs/src/js/runtime/popup/*.js` (the popup builders)
     or `webfs/src/pages/index.html` (modals)
   - CSS → `webfs/src/styles/index-dialogs.css` (or wherever the live
     class lives)

## Why each scene is its own file

- The webfs `body { > :not(#app-frame)... { display: none !important } }`
  defensive rule applies cleanly to a real webfs body without patches.
- Each scene's CSS is naturally isolated from sibling scenes.
- Design can `cmd+click` "Open scene standalone" and edit the file
  without our shell getting in the way.
- Diffs against the scene file are real webfs diffs.

## Map screenshots

Drop `assets/map-placeholder.png` (and optionally per-theme variants) and
the scenes will pick it up automatically. Until then a procedural cross-
hatch pattern covers the map area.

## Provenance

The CSS files in `styles/` are verbatim copies from
`webfs/dist/flat/index-*.css` taken on 2026-05-06. They will drift as
webfs evolves; refresh by re-running `npm run web:build` in webfs and
re-copying. **No patches** are needed in the verbatim copies anymore —
each scene is a real webfs body.

The disclosure markup in each scene was hand-extracted from live webfs
DOM at http://127.0.0.1:8787 via Playwright. Where webfs-side JS
populates a dialog at runtime (e.g. Aircraft Profile templates,
Downloads region picker), the sandbox carries hand-typed sample data.

— v0.2, 2026-05-06
