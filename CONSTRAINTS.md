# FlightBoxV3 Design Sandbox — Constraints

This document is the don't-break list for the FlightBoxV3 EFB UI refactor.
Read it before redesigning anything.

Each scene under `scenes/` is a stand-alone webfs body — real CSS, real
DOM. Iterate freely there; the live `webfs/` codebase is untouched.
Once a design is approved, the team ports it back into webfs by copying
your edited markup/CSS straight in.

## How fidelity works

- `styles/index-*.css` are **verbatim copies** of webfs CSS. Don't
  modify them — those edits won't survive a refresh from webfs.
- `scenes/<name>.html` uses **real webfs class names** (`.weather-popup-shell`,
  `.popup-kv-grid`, `.popup-action-row`, `.app-settings-overlay`, etc.).
  Edits to markup port directly into the matching webfs JS popup
  builder or HTML template.
- `scenes/scene.css` and `scenes/scene.js` are **sandbox-only chrome**
  (the map-area placeholder, the SANDBOX watermark, demo close-button
  interactivity). When porting back, ignore these files entirely.

---

## Hardware constraints (NEVER change)

### 6-button soft button bar

The bar at the bottom of the screen mirrors a **physical FlightBar
hardware peripheral with 6 illuminated buttons**. The on-screen bar
exists so the same workflow works whether the pilot taps the iPad or
presses the box.

- **Cannot add a 7th button** — would orphan it on hardware.
- **Cannot remove a button** — would leave a hardware button dead.
- **Cannot reorder** — the hardware buttons map 1:1 by position.
- The buttons themselves are **dynamically populated** by JS at
  runtime, so labels/icons can change per context (e.g. "PLAN"
  becomes "EDIT PLAN" when a course is loaded).

What you CAN change: the bar's visual treatment (background, divider
style, typography, icon style, active/pressed/illuminated states),
the safe-area handling, and the active-button highlight color.

### iPad / WKWebView platform

The webfs app runs in three places:
1. **iOS native app** (WKWebView). The dominant target.
2. **iPad direct browser** (Safari at the FlightBox device's IP). Less
   common; same code.
3. **Embedded on the FlightBox device itself** (ESP32 serving from
   flash). Lite mode; same UI.

iOS WKWebView has these quirks the design must respect:

- **Virtual keyboard** slides up over the bottom of the screen and
  must cover the button bar. Don't put critical UI in that zone.
- **Touch handling** is overridden — the WKWebView's own scroll +
  delaysContentTouches is disabled for canvas responsiveness. Don't
  rely on iOS Safari default scroll inertia inside the map area.
- **Safe-area insets** for notch/home-bar are honored via
  `env(safe-area-inset-bottom)` in the button-bar CSS.

---

## Frame architecture (don't change geometry, refresh visuals only)

### 3-zone layout

The app frame has three immutable zones:

```
+--------------------------------------------------+
|  health-status-bar  (top, 28px)                  |
+--------------------------------------------------+
|                                                  |
|  content-area (flex 1)                           |
|    └── map-surface (canvas)                      |
|         └── disclosures, badges, modals          |
|                                                  |
+--------------------------------------------------+
|  soft-button-bar  (bottom, 43px iOS / 56px web)  |
+--------------------------------------------------+
```

- **Health status bar** at top: 6 cells (FlightBox / ADS-B / GPS /
  AHRS / ALT / CO). Tap to drill into FlightBox diagnostics. Cells
  show is-green / is-amber / is-red.
- **Map surface** is the floor — a `<canvas>` element with everything
  drawn on it. The map renderer is authoritative for what's painted
  there; UI overlays sit on top.
- **Soft button bar** at bottom (see above).

### Canvas stacking — disclosures live INSIDE map-surface

This is the HARD layout rule. From `feedback_overlay_stacking.md`:
**dynamic overlays (popups, badges, ground-track indicator) must mount
INSIDE `#map-surface`, not in `<body>`.** Putting them outside breaks
canvas stacking and they end up either hidden behind the map or
rendered with wrong stacking against the SVS / replay UI.

The mount points the JS targets:

| Element ID | Purpose |
|---|---|
| `#map-surface` | Map canvas container — disclosures mount inside |
| `#weather-popup` | Left-side disclosure panel (the main popover slot) |
| `#rubber-band-panel` | Same shell as weather-popup, used for box-select results |
| `#map-layers-dialog` | Map layers modal (CURRENTLY a centered modal, being converted to a disclosure) |
| `#app-settings-overlay` | Settings modal |
| `#downloads-overlay` | Region picker / data downloads |
| `#aircraft-profile-overlay` | Aircraft profile modal |
| `#flightbox-overlay` | FlightBox diagnostics modal |
| `#startup-splash` | Bootcheck splash (z-index 40) |

If your refactor renames any of these IDs, the JS that mounts content
into them breaks. Name changes should be a separate explicit ticket.

### Bottom nav-dest strip

When a course is loaded, a 2-row info strip appears floating above
the soft-button-bar (`.nav-dest-bottom`). It shows DEST/ELEV/DIS/GS/
ETE/ETA on the top row and WPT/DIS-NXT/BRG/DTK/TRK/XTE on the leg
row. Geometry is fixed; visual style is open.

---

## Styling system

### Tokens

All colors and dimensions live in `styles/index-tokens.css` as CSS
custom properties (`--bg`, `--panel`, `--text`, `--accent`, `--danger`,
`--ok`, `--border`, plus `--soft-button-bar-height`, `--popup-shell-width`,
etc.). New tokens are welcome but **add, don't replace** — there are
runtime tools that read these (e.g. `map_theme.js` for canvas drawing).

Token-to-runtime mismatch is a known issue (see
`feedback_css_token_divergence.md`): some CSS uses literal colors
that diverged from tokens.css. Refactoring these to use tokens is
welcome cleanup.

### Day / night

The app has two appearance modes that must both stay legible at
altitude in a cockpit:

- **Night** (default): dark navy background (`#0c1a24`), light text.
  Designed for low-light cockpits at night.
- **Day**: needs to be high-contrast in direct sunlight bouncing off
  the cockpit. Currently identical-ish to night with slight tweaks;
  Design can fork the palette properly.

The sandbox supports `data-appearance="night|day"` on `<html>` if you
want to scaffold a true day palette via CSS variable overrides.

### Performance

The map renderer runs in a RAF loop on the main thread. Heavy DOM in
disclosures slows it down. Keep disclosures **lean** — avoid CSS
backdrop-filter on large surfaces, avoid box-shadow on hundreds of
list items, avoid per-frame transform animations.

---

## Component-specific notes

### Airport / Weather / Map-Point disclosure

- Shell width clamped to `min(334px, 100%)`. Don't blow this out
  without a discussion — the disclosure is meant to leave the map
  readable behind it.
- Tab structure (Airport / Weather, soon + NOTAMs) is wired in JS.
  Adding tabs is fine; renaming or removing them needs a discussion.
- The shell has a tab bar (`.weather-popup-tabs`), then accordion
  sections (`.popup-section`) inside the body. Keep the accordion
  pattern — it's the established mental model.
- Footer actions (`.popup-actions`) live at the bottom: typically
  Direct To / Add Stop / Diagrams / etc. Treat these as primary
  actions — they're one-tap from the disclosure.

### Map Layers modal → disclosure

This is the headline conversion. Currently a 700+ px centered modal
with ~6 distinct concerns crammed into a single scrollable column.

The constraints:
- Same controls available as today (don't drop functionality silently).
- Live updates — every checkbox flip is immediate; no Apply button.
- Some controls have dependencies (e.g. Graphical Weather mode +
  altitude pickers). Nested pickers currently use a sub-modal —
  Design should propose an inline alternative that fits the
  disclosure shell.
- Base-layer radios drive a backend reload; should remain
  prominent.

Open question for Design to answer: tabs (e.g. Layers / Base /
Appearance / Weather / Filters) or a single accordion list? Both
have tradeoffs; either is fine if it fits 334px.

### NOTAM tab (proposed new)

Phase D of the NOTAM project (Wally's API + the wx-proxy Worker)
just shipped. The data is ready. Design needs to figure out:

- The list-row pattern: severity chip + keyword + summary + time-window.
- Sort: critical → significant → advisory → info. Within tier,
  effective-start descending.
- Empty state: "No active NOTAMs at KMDW" — clean state matters.
- Expand-to-detail: full prose plus structured `affected` data.
  Inline expansion or push to a sheet? Both reasonable.
- Manual override marker: when human review modified the LLM
  translation, the response carries `manual_override: true`.
  Currently shown as "*"; needs a real treatment.
- High-volume case: KORD has ~150 NOTAMs. List virtualization or
  filter chips?
- The `pushable` flag drives APNS notifications later (not built);
  no UI required for it now but list ranking should reflect severity.

### Briefing screen (proposed new)

A generated half-page pre-flight briefing. Multi-phase:
- **v1 (now)**: NOTAMs (per-airport + corridor) + TFRs + per-airport
  METAR/TAF.
- **v2**: enroute weather (icing, sigmets, lightning, PIREPs).
- **v3**: fuel/performance once the aircraft model is built.

This is the most ambitious surface. Design problem: glanceable
critical-first ranking, scannable per-stop blocks, weather + NOTAM
correlation. Probably its own full-page modal or a dedicated tab.

---

## Things you CAN change freely

- All colors, typography, spacing, hover/active/pressed states.
- Icon style (current icons are PNG; SVG is welcome).
- Section/tab visual treatments.
- Severity chips, status pills, badge styling.
- Empty / loading / error states.
- Animation polish (subtle — this is an avionics app, not a marketing
  site).
- Component decomposition within a disclosure.
- Day-mode palette (currently barely diverged from night).

When proposing a refactor, drop the new HTML/CSS into the appropriate
"Design slot" cell in the sandbox so the before/after comparison is
explicit.

---

## Asks of Design, in priority order

1. **Visual language refresh applied to the airport disclosure.**
   This is the canonical disclosure; landing the language here lets
   us cascade it to weather, map-point, and navaid for free.
2. **Map Layers modal → disclosure conversion.** Highest structural
   change. Decides the pattern for converting other modals later.
3. **NOTAM tab pattern.** New surface; Design has the most leverage
   here because there's no incumbent treatment.
4. **Briefing screen layout.** Phase 2, but brief now so the visual
   language is consistent.
5. **Settings, Aircraft Profile, Downloads, FlightBox modals.** Lower
   priority polish passes after the everyday disclosures land.

— Steve / Harry, 2026-05-06
