/*
 * scene.js — minimal interactivity for sandbox scenes.
 *
 * Each scene is a static snapshot of webfs's rendered DOM at one moment.
 * The real app's JS (bootstrap.js, popup builders, etc.) is NOT loaded.
 * This script wires up just enough to make the scene feel alive:
 *
 *   - Close ("X") buttons hide the dialog they belong to (cosmetic only).
 *   - Tab clicks switch active tab + show the matching panel.
 *   - Accordion-style sections expand/collapse on click.
 *   - Theme + base-layer query params from the parent shell propagate to
 *     <html data-appearance> and <html data-base-layer>.
 *
 * Nothing here should leak into the production webfs.
 */
(function () {
  'use strict';

  // Theme / base-layer from query params (sent by the outer iframe shell)
  const params = new URLSearchParams(window.location.search);
  const html = document.documentElement;
  if (params.get('theme')) html.setAttribute('data-appearance', params.get('theme'));
  if (params.get('base')) html.setAttribute('data-base-layer', params.get('base'));

  // Close ("X") buttons — find the nearest [role="dialog"] or .map-layers-dialog
  // and toggle hidden.
  document.addEventListener('click', (ev) => {
    const closeBtn = ev.target.closest(
      '.weather-popup-close, .nav-flightplan-close, .nav-directto-close, .nav-nearest-close, ' +
      '#map-layers-dismiss, #app-settings-close, #downloads-close, #flightbox-close, ' +
      '#ap-close, #procedures-close, [data-popup-close], [data-scene-close]'
    );
    if (!closeBtn) return;
    const owner = closeBtn.closest(
      '[role="dialog"], .weather-popup-shell, .map-layers-dialog, ' +
      '.app-settings-dialog, .downloads-dialog, .ap-dialog, ' +
      '.procedures-modal, .nav-flightplan-modal, .content-panel, [data-scene-root]'
    );
    if (owner) {
      owner.style.display = 'none';
      // If parent is a fullscreen overlay, hide that too.
      const overlay = owner.closest(
        '.app-settings-overlay, .downloads-overlay, .aircraft-profile-overlay, ' +
        '.procedures-overlay, .nav-flightplan-overlay, .nav-directto-overlay, ' +
        '.nav-nearest-overlay, .ap-template-overlay'
      );
      if (overlay) overlay.style.display = 'none';
    }
  });

  // Tabs. Look for [role="tablist"] children with data-tab/data-popup-tab
  // attrs; clicking one updates aria-selected on siblings and shows the
  // matching panel via [data-tab-panel] or [data-popup-panel].
  document.addEventListener('click', (ev) => {
    const tab = ev.target.closest(
      '[role="tab"]:not([disabled]):not([aria-disabled="true"])'
    );
    if (!tab) return;
    const tablist = tab.closest('[role="tablist"]');
    if (!tablist) return;
    // Update aria-selected + is-active on siblings
    tablist.querySelectorAll('[role="tab"]').forEach((t) => {
      const isMe = t === tab;
      t.setAttribute('aria-selected', isMe ? 'true' : 'false');
      t.classList.toggle('is-active', isMe);
    });
    // Determine which panel to show
    const tabKey =
      tab.dataset.popupTab || tab.dataset.tab || tab.dataset.flightboxTab ||
      tab.dataset.proceduresTab;
    if (!tabKey) return;
    // Find sibling tab-panel container (look up to the dialog)
    const dialog = tab.closest(
      '[role="dialog"], .weather-popup-shell, .ap-dialog, .procedures-modal, ' +
      '.app-settings-dialog'
    ) || document.body;
    dialog.querySelectorAll('[data-popup-panel], [data-tab-panel]').forEach((p) => {
      const key = p.dataset.popupPanel || p.dataset.tabPanel;
      if (key === tabKey) {
        p.removeAttribute('hidden');
      } else {
        p.setAttribute('hidden', '');
      }
    });
  });

  // Accordion triggers — INTELLIGENT MODE (per Steve r1):
  //   - Multi-open allowed when the open sections fit without scrolling.
  //   - If opening a new section would force the list to scroll, auto-collapse
  //     the OLDEST open section so the freshly tapped one is fully visible.
  //   - Tap the currently-open header to collapse normally.
  // The order in which sections were opened is tracked in dataset.openOrder on
  // the section, monotonically incremented.
  let __openCounter = 0;
  // Seed openOrder on sections that start open in markup so the LRU auto-collapse
  // treats them as oldest. Without this, .is-open-from-HTML sections never appear
  // in the "others to collapse" list and overflow can persist.
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.popup-accordion-item.is-open').forEach((s) => {
      if (!s.dataset.openOrder) s.dataset.openOrder = String(++__openCounter);
    });
  });
  function setSectionOpen(section, open) {
    const trigger = section.querySelector('.popup-accordion-trigger');
    const body = section.querySelector('.popup-accordion-body');
    section.classList.toggle('is-open', open);
    if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (body) { if (open) body.removeAttribute('hidden'); else body.setAttribute('hidden', ''); }
    if (open) section.dataset.openOrder = String(++__openCounter);
    else delete section.dataset.openOrder;
  }
  function listOverflows(list) {
    // Mid-layout sentinel only: if the parent hasn't allotted any height yet,
    // skip the probe (we'll re-probe on the next click). At any real height —
    // sandbox iframe (~22px) or iPad (~600px) — the spec is the same: if
    // opening this section would force a scroll, the oldest open collapses.
    // That naturally produces multi-open-when-it-fits / mutually-exclusive-
    // when-it-doesn't, which is the brief.
    if (list.clientHeight === 0) return false;
    return list.scrollHeight - list.clientHeight > 1;
  }
  document.addEventListener('click', (ev) => {
    const trigger = ev.target.closest('.popup-accordion-trigger');
    if (!trigger) return;
    const section = trigger.closest('.popup-accordion-item');
    if (!section) return;
    const list = section.closest('.popup-accordion-list') || section.parentElement;
    const wasOpen = trigger.getAttribute('aria-expanded') === 'true';
    if (wasOpen) { setSectionOpen(section, false); return; }

    // MODE-A vs MODE-B (Steve r3): on full-height-rail disclosures (data-accordion-mode="exclusive"
    // on the list), be strictly mutually-exclusive — close every other open section before opening
    // this one. The inner list scrolls if the chosen section overflows. On free-floating popups
    // (default), keep the intelligent multi-open + LRU-on-overflow behavior.
    const mode = list && list.dataset.accordionMode;
    if (mode === 'exclusive') {
      Array.from(list.querySelectorAll('.popup-accordion-item.is-open'))
        .filter((s) => s !== section)
        .forEach((s) => setSectionOpen(s, false));
      setSectionOpen(section, true);
      return;
    }

    // Open the tapped section first, then LRU-collapse if it now overflows.
    setSectionOpen(section, true);
    if (list) {
      let guard = 0;
      while (listOverflows(list) && guard++ < 8) {
        const others = Array.from(list.querySelectorAll('.popup-accordion-item.is-open'))
          .filter((s) => s !== section && s.dataset.openOrder)
          .sort((a, b) => Number(a.dataset.openOrder) - Number(b.dataset.openOrder));
        if (!others.length) break;
        setSectionOpen(others[0], false);
      }
    }
  });

  // Map placeholder image — try to load real screenshot, fall back to
  // procedural pattern.
  const mapBg = document.querySelector('#map-surface .scene-map-bg-image');
  if (mapBg) {
    mapBg.addEventListener('load', () => mapBg.dataset.loaded = 'true');
    mapBg.addEventListener('error', () => mapBg.dataset.loaded = 'false');
    // Force the data-loaded attr to read after load attempt
    if (mapBg.complete && mapBg.naturalWidth > 0) mapBg.dataset.loaded = 'true';
  }
})();
