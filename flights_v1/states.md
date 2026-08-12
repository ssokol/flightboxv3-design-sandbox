# Flights — every reachable state and how to produce it

The app runs against a stateful Leidos STUB on wx-dev (restart wipes it).
Every stub response carries stub:true → the amber TEST SERVICE banner.

## Workspace views (all inside #flights-overlay)

| View | Reach it by |
|---|---|
| Flight list (Upcoming/Past) | More page → Flights (default when pilot setup complete) |
| Pilot/link card | Pilot button in the head; auto-shown when pilot info or link missing |
| Flight editor | tap any list card |
| Briefing view | editor → Get Briefing / View Briefing |
| PDF viewer | briefing view → View Briefing PDF (dialog swap; Exit key on button bar) |

## Pilot / link states

- Unlinked form: Unlink Account on the linked card
- SPA-pending (authorize-Falken instruction card): link `unauthorized@example.com`
- Linked: link any other username
- Dirty-gated saves: edit any field → Save enables; save → gray + persistent "Saved."

## Flight lifecycle states (chips on list cards + filing panel in editor)

- DRAFT: planner → build route → "Flights" button
- FILED: editor → File Plan (complete the live "Still needed" checklist first)
- ACTIVE: FILED VFR → Activate · CLOSED: ACTIVE VFR → Close (card moves to Past)
- CANCELLED: FILED → Cancel (two-tap arm)
- REJECTED: file with departure `KERR` (stub trigger; verbatim Leidos-style message)
- WX_OUTAGE stop card: Get Briefing with `WXOUT` in the route field
- SIM badge: aircraft profile Filing tab → SIM-only, then create a draft
- Amend mode: FILED → Amend (fields unlock, button = Send Amendment)
- IFR cutoff lock: FILED IFR with ETD inside the departure-ARTCC window →
  Amend/Cancel gray + 1-800-WX-BRIEF hint
- Past-ETD invalid: set ETD in the past → red field + checklist line + amber list ETD

## Filing tab (aircraft profile card → Filing)

Rendered by aircraft_profile_editor.js (renderFilingTab) using the
surface-row motif — see markup/aircraft_profile_editor.js.txt. Live
"Filed as" readout updates with every answer; warnings amber.
