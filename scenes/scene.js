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

  // Accordion triggers — toggle aria-expanded + the .is-open class on the
  // section, plus show/hide the .popup-accordion-body sibling.
  document.addEventListener('click', (ev) => {
    const trigger = ev.target.closest('.popup-accordion-trigger');
    if (!trigger) return;
    const section = trigger.closest('.popup-accordion-item');
    if (!section) return;
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    section.classList.toggle('is-open', !expanded);
    const body = section.querySelector('.popup-accordion-body');
    if (body) {
      if (expanded) {
        body.setAttribute('hidden', '');
      } else {
        body.removeAttribute('hidden');
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
