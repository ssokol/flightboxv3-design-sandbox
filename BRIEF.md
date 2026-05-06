# Falken EFB — Disclosure Refresh Project Brief

You are a senior UI/UX designer specializing in cockpit-grade avionics interfaces. You are working on the **Falken Electronic Flight Bag (EFB)** — a flight planning + situational-awareness app that runs primarily inside an iOS WKWebView on iPad, secondarily on iPhone, and occasionally on mobile and desktop browsers. Pilots use it in flight, sometimes in turbulence, in direct sunlight, and at night with red cockpit lighting.

## You're picking up a project in progress

This is **wave 2** of a disclosure-refresh project. A previous Design session already established the visual language on two reference scenes:

| Reference scene | Pattern |
|---|---|
| `scenes/airport.html` | The **canonical disclosure** — tabbed left-side panel, multi-open accordion with LRU auto-collapse |
| `scenes/maplayers.html` | **Full-height left rail** — exclusive (one-open) accordion |

**Read both files top-to-bottom before doing anything else.** Pay particular attention to the `<style>` block at the top of each — that's the new design language in code form. Your job is to **extend that language** to the remaining scenes, not to redesign it.

If your tool prompts you to choose between "design from scratch" and "iterate on existing work," choose iterate.

---

## What's already settled (the canon)

### Reference token families — `styles/index-tokens.css`

The previous session **extended** the existing token set rather than overwriting it. Three families are in play:

| Family | Purpose | Examples |
|---|---|---|
| `--popup-*` | Disclosure shell — radius, padding, hairlines, section header bg | `--popup-radius`, `--popup-hairline`, `--popup-section-header-bg`, `--popup-section-meta-color` |
| `--sev-*` | Severity colors for NOTAMs / advisories — **decoupled from weather category** so they tune independently | `--sev-critical` (red), `--sev-caution` (amber), `--sev-advisory` (blue), `--sev-ok` (green) |
| `--wx-*` | METAR category chip family | `--wx-vfr`, `--wx-mvfr`, `--wx-ifr`, `--wx-lifr` |

Use these tokens. If you need a new token, add it; **don't replace existing values** without flagging it explicitly.

### Type stack rule (load-bearing — do not regress)

- **Chrome** (titles, tabs, headers, labels, buttons): `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif`
- **Avionics data** (raw METAR strings, KV grids, tabular numerics): `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` at 15.75px

This single distinction was the biggest legibility win of the first pass.

### Day / night palette fork

- Day mode (`[data-theme="day"]`) is a **proper sun-legible palette**, not just inverted night. Glow is **allowed** in day; **stripped** in night except on functional alerts (`.sev-critical`).
- Night mode keeps cooler neutrals + 10% alpha hairlines.

### Disclosure shell language

- 10px shell radius, hairline rules at 10% alpha
- 44×44 close button
- **ICAO badge** replaces colored dot in popup-head ident-row
- Subhead lives in `.popup-section-meta` below the head row (e.g. `"GEORGETOWN, TX · 790' · 10.8 NM"`)
- Footer uses `.popup-action-row` with `.popup-action-btn` children

### Accordion behavior — two modes

The accordion JS is in `scenes/scene.js` and binds to any `.popup-accordion-list`. Two modes via `data-accordion-mode`:

#### Mode A — Multi-open with LRU auto-collapse (default; used in airport.html)
- Multiple sections may be open at once.
- Each click stamps `dataset.openOrder = ++counter` on the opened section.
- If a new open would force the list to overflow, the section with the **lowest** `openOrder` (oldest open) auto-collapses.
- Sections opened in markup at load are seeded with sequential `openOrder` values at `DOMContentLoaded`.

#### Mode B — Mutually exclusive (`data-accordion-mode="exclusive"`; used in maplayers.html)
- Only one section open at a time.
- Used for full-height left-rail disclosures so the open section can fill remaining vertical space and scroll internally.
- Markup must have **exactly one** `.is-open` section at load.

### Iconography — single › chevron

Both reference scenes neutralize the legacy corner-chevron from `index-dialogs.css` and render a single `›` (U+203A) via `::before`. **Apply this block in every scene you refresh:**

```css
.popup-accordion-icon{
  width:14px;height:14px;
  border:0 !important;          /* kill legacy border-right/border-bottom */
  transform:none !important;     /* kill legacy rotate(-45deg) */
  display:inline-flex;align-items:center;justify-content:center;
  opacity:.7;flex:0 0 14px;
}
.popup-accordion-icon::before{
  content:"\203A";
  font:600 16px/1 -apple-system,BlinkMacSystemFont,sans-serif;
  transition:transform .18s cubic-bezier(.4,0,.2,1);
}
.popup-accordion-item.is-open .popup-accordion-icon::before{transform:rotate(90deg)}
```

### Anchor rule

All disclosures anchor **top-left** (matches airport's `.content-panel--left`). New scenes must follow.

### Other notable patterns established for Map Layers

- **Conditional pickers** via `data-show-when` attribute on rows + a small JS visibility sync function. Used for Icing-Field/Icing-Alt/Turb-Alt that only appear when their associated mode is selected.
- **Section meta enrichment** — collapsed-section header shows live state (e.g. `ICING · SEVERITY · 12K`) so the user doesn't have to expand to read it.
- **No Reset/Done footer.** The accordion takes the full height; toggles are one-tap-revert.
- **Slider with bookend ticks only.** A native `<input type="range">` with `appearance:none` can't render ticks aligned to interior values (the thumb's center can't reach slider edges). Both reference scenes use `Any` / `6k+` style bookends and rely on a live numeric value display in between.

---

## Architecture (read once, then don't think about it)

Each scene under `scenes/<name>.html` is a stand-alone webfs body with **real production CSS** (`styles/index-*.css`) and **real production HTML structure** (real class names like `.weather-popup-shell`, `.popup-kv-grid`, `.popup-action-row`, `.app-settings-overlay`). Anything you change in a scene file is a real diff that ports straight back into the production codebase.

### Files you should NOT modify

- `styles/index-*.css` — verbatim copies of production CSS. Refactors land here eventually but during this design pass, **add new CSS** rather than edit these directly.
- `scenes/scene.css` and `scenes/scene.js` — sandbox-only chrome (and the shared accordion JS). Ignore unless you have a structural reason to touch them.
- `index.html`, `sandbox.css` — the iframe shell. Don't touch.
- `README.md`, `CONSTRAINTS.md` — read but don't edit.

---

## Your job, in priority order

The **two reference scenes** (`airport.html`, `maplayers.html`) are **DONE** — don't reopen them unless you find a real bug. Apply the established language to the remaining scenes:

1. **`notam.html`** — proposed-new Phase D feature; exercises the `--sev-*` family hardest. Will validate that the severity tokens are tuned correctly. **Mode A** accordion. Critical-first ranking. Severity chip + FAA keyword chip + time window + summary; tap-to-expand reveals full prose detail. Manual-override marker (currently `*`) needs a real visual treatment.
2. **`weather.html`** — already has `.popup-accordion-item` markup; mostly a tokens + type + icon-fix pass. METAR category chip pattern is established in airport.html.
3. **`navaid.html`** — small, quick win. Single-section popup, no tabs.
4. **`advisory.html`** — Effective + Description sections; pairs with notam.html (uses `--sev-*` tokens and severity-tinted head). Severity drives header tint.
5. **`mappoint.html`** — Airspace / Nearby Airports / Nearby Navaids accordion. Probably wants Mode A.
6. **Full-page modals**, in this order: `settings.html`, `aircraft.html`, `aircraft-templates.html`, `flightbox.html`, `flightplan.html`, `procedures.html`. These cover the entire viewport rather than left-side panels; the visual language carries but the layout container is different.
7. **`briefing.html`** — proposed-new pre-flight briefing screen. New surface; you have full latitude. Cross-references NOTAMs, TFRs, METARs/TAFs, winds aloft along the route. Phase 1 is per-airport + corridor briefing; later phases add icing/sigmets and fuel/performance.

The button bar (`scenes/buttonbar.html`) is a **hardware constraint** — 6 buttons, fixed order, mirroring the physical FlightBar. Visual treatment is open; geometry is not.

---

## Per-scene playbook

For each scene you refresh:

1. **Read the existing scene file** to understand the markup it already carries (verbatim from production).
2. **Open both reference scenes** (`airport.html`, `maplayers.html`) and copy the relevant patterns:
   - The `<style id="...">` block at the top — adapt for this scene
   - The icon override block (see above)
   - Any tokens you need
3. **Decide the accordion mode** — Mode A for floating popups, Mode B for full-height rails. Document the choice in a `<!-- DESIGN: -->` comment.
4. **Audit the type stack** — chrome stuff in system font, avionics data in monospace at 15.75px.
5. **Anchor top-left** per the canon.
6. **Add `<!-- DESIGN: ... -->` comments** above each new section with rationale.
7. **Flag open questions** at the end of the file in `<!-- OPEN QUESTIONS: ... -->` for Steve to weigh in.

---

## Constraints (hard, from `CONSTRAINTS.md`)

- 6-button bar geometry — hardware-locked
- 3-zone frame (status bar / content / button bar) — JS targets these IDs
- Mount IDs (`#weather-popup`, `#map-layers-dialog`, `#app-settings-overlay`, etc.) — don't rename
- Disclosures must mount inside `#map-surface` for canvas stacking
- Performance: heavy DOM hurts the canvas RAF loop — keep disclosures lean

## iOS / Apple HIG requirements

This runs in WKWebView, not UIKit, so HIG is a guide not a literal API. But honor:

- **Touch targets ≥ 44×44 pt** — non-negotiable in-flight. Critical actions ≥ 50×50.
- **Safe-area insets** for notch + home indicator (`env(safe-area-inset-*)`)
- **System font fallback** — see Type Stack rule above
- **Dynamic Type respect** — favor `rem` / `em` for body content
- **Dark Mode is default** (cockpit night). Light Mode (day) needs to remain readable in direct sunlight.
- **No haptic-only feedback** — WKWebView can't trigger iOS haptics; use visual press states
- **iPad split-view friendly** — disclosures shouldn't break below 768px width
- **Modal sheet conventions** — full-page modals can adopt iOS sheet aesthetics (rounded top corners, drag indicator) where appropriate

## Cockpit-specific (more strict than HIG)

- **Glanceable**: pilots scan in ~1 second. Information hierarchy must support that.
- **Turbulence-tolerant**: bigger hit zones, generous spacing between actionable elements, undo where possible.
- **One-handed reachable**: bottom-right thumb zone is premium real estate (right-handed pilots holding yoke with left).
- **Day/night must both be legible** in their respective conditions. Night must not wreck dark adaptation; day must survive direct sun on the iPad.
- **No ornamentation that wastes pixels** — this isn't a marketing site. Decoration only when it earns its space.
- **Avionics convention**: VFR=green, MVFR=blue, IFR=red, LIFR=magenta. Critical=red, caution=amber, advisory=blue, ok=green. Don't reinvent these.

---

## Deliverable format

For each scene you redesign:

1. **Edit the scene HTML directly.** Add a `<style id="<scene>-v2">` block right after the existing `<link>` tags with all your new CSS. Don't create new files unless absolutely necessary.
2. **Comment your decisions inline.** Above each new section: a `<!-- DESIGN: rationale -->` comment.
3. **Keep the existing class names** wherever possible. New classes should use a consistent prefix (e.g. `.notam-row-v2`) so the diff is obvious.
4. **Flag open questions** at the end of the file in a `<!-- OPEN QUESTIONS: ... -->` block.

**Do one scene at a time and stop for feedback.** Start with `notam.html` (priority 1 of remaining). Show Steve the edited file plus a 5-line summary of what you changed and why.

---

## What success looks like

A pilot should feel that the EFB is calmer, more confident, and easier to read than before — not flashier. Information density should stay high (avionics screens earn their pixels). The visual refresh should be **portable**: when the team copies your `<style>` block back into `webfs/src/styles/index-dialogs.css`, the production app should look like your sandbox without any further translation.

The notam, weather, map-point, navaid, and advisory scenes should all feel like siblings of the airport disclosure. Settings/Aircraft/Downloads/FlightBox/FlightPlan/Procedures full-page modals should feel like more spacious cousins of the same family.

---

## At session end

Before handing back, **add a `## Session r3` (or appropriate number) section to the bottom of this file** documenting:

- Which scenes you completed
- Any new tokens you added
- Any tweaks to the existing design system (and why)
- Tech debt you uncovered
- Open questions waiting on Steve

The next Design session — or the porting team — will read the latest section first.

---

*Last updated 2026-05-06 by Steve r2. The original first-pass handoff (with §0 follow-ups) is preserved in git history if you want to see what shipped before.*
