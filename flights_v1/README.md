# Flights workspace — design round 1 (2026-08-12)

Read in this order:
1. BRIEF.md      — scope, settled non-negotiables, what not to touch
2. states.md     — every reachable state + the stub trigger that produces it
3. markup/       — extracted production markup (flights workspace, planner
                   dialog, PDF viewer) + aircraft_profile_editor.js.txt
                   (the Filing tab renders from its factories — surface-row motif)
4. styles/       — production CSS verbatim: index-tokens.css (design + z
                   vocabulary — use var(--z-*), never raw numbers),
                   index-dialogs.css (flights sections at the end),
                   index-surfaces.css (profile card motif)

Deliverable: restyled markup/CSS for the flights workspace + Filing tab,
same DOM ids, classes may be added. The app is dark-avionics themed and
used in a bouncing cockpit — 44×44pt touch targets minimum, bigger better.
