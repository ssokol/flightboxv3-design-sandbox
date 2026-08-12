# Flights workspace — Claude Design brief (v1, 2026-08-12)

## What this is

The "Flights" feature: flight-plan filing + weather briefings via Leidos
Flight Service, fully functional against a live stub server. Every screen
works; nothing has had design attention. Your canvas: the Flights S2
workspace (list / flight editor / briefing / pilot-link card), the aircraft
profile "Filing" tab, and the planner-dialog touchpoints.

Files in this bundle: `markup/` (the relevant index.html fragments),
`styles/` (production CSS verbatim — flights sections + tokens), and
`states.md` (every reachable state + the stub triggers that produce it).

## Non-negotiable behaviors (already settled with Steve — style, don't change)

1. **Save buttons ARE dirty-state indicators** — disabled (visibly gray)
   when the form matches disk; enabled only on unsaved changes; persistent
   "Saved." status after success, cleared on next edit. Never a transient flash.
2. **Full screen = the content area only** — status bar and soft button bar
   stay visible; the button bar shows Exit while a workspace owns it.
3. **Leidos text is verbatim** — leidosMessage is never softened, truncated,
   or paraphrased. Status chips exist for ALL of: DRAFT, FILED, ACTIVE,
   CLOSED, CANCELLED, REJECTED, WX_OUTAGE, ERROR, INDETERMINATE + SIM badge
   + "ATC ROUTE CHANGED" ribbon.
4. **WX_OUTAGE is a full-stop card** — never a toast; nothing renders under it.
5. **The amber TEST SERVICE banner** shows whenever the stub answers — must
   never be mistakable for the real service.
6. **Two remarks fields stay visually distinct** — ATC (RMK/) vs Search &
   Rescue (never reaches ATC); the copy explaining which is which matters.
7. **Touch targets: 44×44pt minimum, larger preferred** — this is used in a
   bouncing cockpit. Steve specifically flagged the Pilot/Done head button
   as too small.
8. **Close (SAR loop) must be loud and easy** when a plan is ACTIVE.
9. Dark avionics theme; tokens in `styles/index-tokens.css` are the
   vocabulary (including the new `--z-*` layering scale — use it, no raw
   z-index numbers; a build guard rejects them).

## Known rough spots (why you're here)

- Everything is functional-grade: default input styling, cramped rows,
  no visual hierarchy between sections, chips are minimal.
- The editor is one long card — consider grouping/rhythm for cockpit
  legibility (the ICAO form has ~20 fields).
- List cards: Upcoming/Past grouping exists; the cards deserve a real
  treatment (route is the headline; ETD + tail + rules the support line;
  chips on the right; amber stale-ETD state exists).
- The pilot/link card doubles as first-run setup — it should feel like a
  short form, not a settings page.

## What NOT to touch

- DOM ids and the `fe-*`/`fb-*`/`flights-*` element structure (bound by JS);
  add classes freely, rename nothing.
- DisplayManager/dialog mechanics, button-bar stack behavior.
- Copy that encodes safety rules (remarks explanations, WX_OUTAGE wording,
  1-800-WX-BRIEF references, cutoff hints).
