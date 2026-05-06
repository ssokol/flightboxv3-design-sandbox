# FlightBoxV3 — Disclosure Refresh: Handoff

**Branch / PR scope:** Visual + interaction refresh of disclosure dialogs ("popups") in the FlightBox sandbox. Two scenes complete; remaining scenes are stubs that need the same treatment.

**Status as of this handoff:**
- ✅ `scenes/airport.html` — fully refreshed
- ✅ `scenes/maplayers.html` — fully refreshed (full-height left rail, exclusive accordion)
- ⏳ Remaining scenes still on v1 visuals (see "Next session" below)

---

## 1. Design system additions

All token work lives in `styles/index-tokens.css`. We **extended** the existing token set rather than overwriting it; v1 popups still render with the original tokens via cascade.

### New token families

| Family | Purpose | Examples |
|---|---|---|
| `--popup-*` | Disclosure shell (radius, padding, hairline rules, section header bg) | `--popup-radius`, `--popup-hairline`, `--popup-section-header-bg`, `--popup-section-meta-color` |
| `--sev-*` | Severity color anchor for NOTAMs / advisories — **decoupled from weather category** so they tune independently | `--sev-critical` (red), `--sev-caution` (amber), `--sev-advisory` (blue), `--sev-ok` (green) |
| `--wx-*` | METAR category chip family | `--wx-vfr`, `--wx-mvfr`, `--wx-ifr`, `--wx-lifr` |

### Day/Night fork
- Day mode (`[data-theme="day"]`) is a proper sun-legible palette, not just inverted night. Glow is **allowed** in day; **stripped** in night except on functional alerts (`.sev-critical`).
- Night mode keeps cooler neutrals + 10% alpha hairlines.

### Type system rule (load-bearing)
- **Chrome** (titles, tabs, headers, labels, buttons): `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif`
- **Avionics data** (raw METAR strings, tabular numerics): `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
- This single change was the biggest legibility win. Do not regress it.

### Shell language
- 10px shell radius, hairline rules at 10% alpha, 44×44 close button, ICAO badge replaces colored dot, name + meta in `popup-section-meta` (e.g. `"GEORGETOWN, TX · 790' · 10.8 NM"`).

---

## 2. Accordion behavior — two modes

The accordion JS lives inline in each scene (we did not extract to a shared module yet — see "Tech debt" below). Two modes are supported via `data-accordion-mode` on `.popup-accordion-list`:

### Mode A — Multi-open with LRU auto-collapse (default, used in `airport.html`)
- Multiple sections may be open simultaneously.
- Each click stamps `dataset.openOrder = ++counter` on the opened section.
- On open, JS measures whether the new state would force the list to overflow its `max-height`. If yes, the section with the **lowest** `openOrder` (oldest open) is auto-collapsed.
- Sections opened in markup at load are seeded with sequential `openOrder` values at `DOMContentLoaded` so the LRU logic treats them as oldest.

### Mode B — Mutually exclusive (`data-accordion-mode="exclusive"`, used in `maplayers.html`)
- Only one section open at a time.
- Used for full-height left-rail disclosures so the open section can fill remaining vertical space and scroll internally; closed sections collapse to header-only.
- Markup must have **exactly one** `.is-open` section at load. Click handler closes all siblings before opening the target.

### Layout contract (both modes)
- `.popup-accordion-list` is a flex column with `min-height: 0` and `overflow: hidden`.
- `.popup-section-body` of an open section is the scroll container (`overflow: auto`), not the list itself.
- The overflow probe in Mode A guards on `clientHeight < 120` to avoid false positives during initial layout.

---

## 3. Iconography fix (last commit)

**Problem:** `.popup-accordion-icon` was double-rendering — a corner-chevron from `styles/index-dialogs.css` plus the new triangle/chevron from the scene file.

**Resolution:** Both refreshed scenes now neutralize the legacy rule with `!important` and render a single `›` (U+203A) via `::before`:

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

**This fix must be applied to every other scene** when refreshing them (advisory, navaid, notam, mappoint, weather). The clean path is to lift this block into `styles/index-dialogs.css` and delete the legacy corner-chevron rule entirely — see Tech Debt #1.

---

## 4. Scene-specific notes

### `scenes/airport.html`
- Subhead: `GEORGETOWN, TX · 790' · 10.8 NM`
- Accordion order: **Frequencies → Runways → Airport** (the user's call — frequencies are highest-priority in flight)
- KV value type bumped 14 → 16px
- Runway-end lines bumped 12 → 14px with a left rule
- METAR category promoted from kv row to `.wx-cat-chip` in the section header
- Mode A accordion (multi-open + LRU)

### `scenes/maplayers.html`
- Full-height left rail — flush to top/left/bottom, no border-radius, no shadow, hairline right edge instead of all-around card border
- Mode B accordion (exclusive) — one section open, fills remaining height
- Initial state: only **Visibility** open
- Anchor rule: **all disclosures anchor top-left** (matches airport's `.content-panel--left`). Future scenes must follow.

---

## 5. Tech debt for next session

1. **Lift accordion CSS + JS to shared modules.** Each scene currently has its own inline `<script>` and an override block for `.popup-accordion-icon`. The right shape is:
   - Move the corrected `.popup-accordion-icon` rule into `styles/index-dialogs.css` and **delete** the legacy corner-chevron rule.
   - Extract the multi-open + LRU + exclusive-mode logic into `scenes/scene.js` (or a new `scenes/accordion.js`) that auto-binds to any `.popup-accordion-list`, reading `data-accordion-mode`.
2. **`styles/index-dialogs.css` is currently a single-line minified blob.** Hard to diff. Suggest unminifying as part of this PR or the next.
3. **Pre-existing 404s** on `scenes/maplayers.html` for `assets/map-placeholder.png`, `assets/track-up.png`, etc. — not in this PR's scope, but flag for cleanup.
4. **Open questions** are inlined in the bottom of each refreshed scene as `<!-- OPEN QUESTIONS -->` comments. Resolve and remove before merge.

---

## 6. Next session — recommended order

Apply the same playbook to the remaining disclosures, in this order:

1. **`notam.html`** — exercises the `--sev-*` family hardest; will validate that the severity tokens are tuned correctly. Mode A accordion.
2. **`weather.html`** — already has `.popup-accordion-item` markup; mostly a tokens + type + icon-fix pass.
3. **`navaid.html`** — small, quick win.
4. **`advisory.html`** — Effective + Description sections; pairs with notam.
5. **`mappoint.html`** — Airspace / Nearby Airports / Nearby Navaids. Probably wants Mode A.

For each: (a) apply the icon override block from §3, (b) audit type stack against §1, (c) decide accordion mode, (d) seed `dataset.openOrder` on markup-open sections at DOMContentLoaded if Mode A, (e) anchor top-left.

---

## 7. Files touched in this PR

```
HANDOFF.md                    (new — this file)
styles/index-tokens.css       (extended: --popup-*, --sev-*, --wx-* families; day/night fork)
scenes/airport.html           (full refresh)
scenes/maplayers.html         (full refresh — full-height left rail, exclusive accordion)
scenes/airport_original.html  (preserved as v1 reference for sidebar comparison)
index.html                    (sidebar entries for airport / airport_original / maplayers)
```

No changes to `styles/index-dialogs.css` yet — see Tech Debt #1.
