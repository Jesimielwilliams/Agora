/**
 * AGORA LENS - HOTSPOT LIST
 *
 * The mobile stand-in for the map. A pinch-zoomable map of Nigeria is a poor
 * fit for a phone — and unusable with a screen reader — so on small screens the
 * Overview leads with this: the tracked jurisdictions ranked by severity, as
 * ordinary focusable buttons. Picking one drives exactly the same
 * selectLocation() path a map marker does.
 *
 * The map isn't discarded; "View map" opens it full-screen on demand.
 */

const HOTSPOT_STATUS_RANK = {
  CRITICAL: 4,
  HIGH: 3,
  ELEVATED: 2,
  NORMAL: 1
};

class AgoraHotspotList {
  constructor() {
    this.container = document.getElementById('hotspot-panel');
    this.view = document.getElementById('view-overview');
    this.expandedId = null;
    this.hasSynced = false;
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    this.attachListeners();
  }

  /** Worst first: status band, then live alerts, then documented volume. */
  records() {
    return Object.values(AGORA_DATA.locations || {}).sort((a, b) => {
      const rank = (HOTSPOT_STATUS_RANK[b.status] || 0) - (HOTSPOT_STATUS_RANK[a.status] || 0);
      if (rank) return rank;
      if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount;
      return b.incidentsCount - a.incidentsCount;
    });
  }

  render() {
    if (!this.container) return;

    const selectedId = AGORA_DATA.selectedLocationId;

    this.container.innerHTML = `
      <div class="hotspot-head">
        <div class="hotspot-head-text">
          <h2 class="hotspot-title">${t('hotspots.title')}</h2>
          <div class="hotspot-sub">${t('hotspots.sub')}</div>
        </div>
        <button class="hotspot-map-btn" id="open-map-sheet-btn" type="button">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          <span>${t('hotspots.viewMap')}</span>
        </button>
      </div>

      <div class="hotspot-list">
        ${this.records().map(loc => this.renderItem(loc, loc.id === selectedId)).join('')}
      </div>
    `;
  }

  /**
   * A row plus the panel it opens. The incident feed lives inline here on
   * mobile — there's no drawer alongside it to hand off to.
   */
  renderItem(loc, isSelected) {
    return `
      <div class="hotspot-item" data-hotspot-item="${loc.id}">
        ${this.renderRow(loc, isSelected)}
        <div class="hotspot-detail" id="hotspot-detail-${loc.id}" hidden>
          <div class="hotspot-detail-feed" id="hotspot-feed-${loc.id}"></div>
          <div class="hotspot-detail-actions">
            <button class="btn btn-primary-white" type="button" data-hotspot-timeline="${loc.id}">
              <span>${t('drawer.timeline', { place: loc.lga || 'area' })}</span>
              <span>&rarr;</span>
            </button>
            <button class="btn btn-coral-subtle" type="button" data-hotspot-report="${loc.id}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 5h11M3 10h7M3 15h5" />
                <path d="M20.4 8.6a1.9 1.9 0 0 0-2.7-2.7l-6.2 6.2-.9 3.6 3.6-.9 6.2-6.2z" />
              </svg>
              <span>${t('drawer.report', { place: loc.lga || 'this area' })}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderRow(loc, isSelected) {
    const status = (loc.status || 'NORMAL').toUpperCase();
    const split = loc.statsBreakdown || {};
    // The distribution bar is decorative; the legend below it carries the same
    // numbers as text, so nothing here is colour-only.
    const bar = `
      <div class="hotspot-bar" aria-hidden="true">
        <span class="dist-segment-pink" style="width: ${split.ballotBoxSnatch || 0}%;"></span>
        <span class="dist-segment-blue" style="width: ${split.violence || 0}%;"></span>
        <span class="dist-segment-purple" style="width: ${split.missingDocs || 0}%;"></span>
      </div>
    `;

    return `
      <button class="hotspot-row ${isSelected ? 'is-selected' : ''}" type="button"
        data-hotspot="${loc.id}" aria-expanded="false"
        aria-controls="hotspot-detail-${loc.id}">
        <span class="hotspot-row-body">
          <span class="hotspot-row-top">
            <span class="hotspot-status hotspot-status-${status.toLowerCase()}">${status}</span>
            <span class="hotspot-name">${loc.name}</span>
          </span>

          <span class="hotspot-zone">${loc.electoralZone || ''}</span>

          <span class="hotspot-counts">
            <span><strong>${loc.incidentsCount}</strong> ${t('hotspots.documented')}</span>
            <span><strong>${loc.corroboratedCount}</strong> ${t('hotspots.corroborated')}</span>
            <span class="${loc.activeCount > 0 ? 'hotspot-count-active' : ''}">
              <strong>${loc.activeCount}</strong> ${t('hotspots.active')}
            </span>
          </span>

          ${bar}

          <span class="hotspot-legend">
            Ballot snatching ${split.ballotBoxSnatch || 0}% &middot;
            Violence ${split.violence || 0}% &middot;
            Missing docs ${split.missingDocs || 0}%
          </span>
        </span>

        <span class="hotspot-chevron" aria-hidden="true">&rsaquo;</span>
      </button>
    `;
  }

  /**
   * Keeps the list in step with selections made anywhere else — including a
   * marker tapped inside the map sheet, which should leave that jurisdiction's
   * feed open behind it rather than silently marking a collapsed row.
   */
  setActive(locationId) {
    this.container?.querySelectorAll('[data-hotspot]').forEach(row => {
      row.classList.toggle('is-selected', row.getAttribute('data-hotspot') === locationId);
    });

    // The first sync runs during start-up. The list should open collapsed then,
    // so all five jurisdictions are visible at a glance rather than one of them
    // already pushing the rest down the page.
    if (!this.hasSynced) {
      this.hasSynced = true;
      return;
    }

    // offsetParent is null while the panel is display:none — i.e. on desktop,
    // where the drawer is doing this job instead.
    if (this.container?.offsetParent) this.expand(locationId);
  }

  /** Opens one jurisdiction's feed and closes whichever was open before. */
  expand(locationId) {
    this.container?.querySelectorAll('[data-hotspot-item]').forEach(item => {
      const id = item.getAttribute('data-hotspot-item');
      const isTarget = id === locationId;
      const row = item.querySelector('.hotspot-row');
      const detail = item.querySelector('.hotspot-detail');

      item.classList.toggle('is-open', isTarget);
      row?.setAttribute('aria-expanded', isTarget ? 'true' : 'false');
      if (detail) detail.hidden = !isTarget;
    });

    this.expandedId = locationId;

    // Same cards as the desktop drawer feed, rendered in place.
    const feed = document.getElementById(`hotspot-feed-${locationId}`);
    if (feed) window.agoraIncidents?.renderDrawerCards(feed, locationId);
  }

  collapse() {
    this.container?.querySelectorAll('[data-hotspot-item]').forEach(item => {
      item.classList.remove('is-open');
      item.querySelector('.hotspot-row')?.setAttribute('aria-expanded', 'false');
      const detail = item.querySelector('.hotspot-detail');
      if (detail) detail.hidden = true;
    });

    this.expandedId = null;
    window.agoraIncidents?.clearDrawerSelection();
  }

  attachListeners() {
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('#open-map-sheet-btn')) {
        this.openMapSheet();
        return;
      }

      const timeline = e.target.closest('[data-hotspot-timeline]');
      if (timeline) {
        window.agoraApp?.openLocationTimeline(timeline.getAttribute('data-hotspot-timeline'));
        return;
      }

      if (e.target.closest('[data-hotspot-report]')) {
        window.agoraReporting?.openReportModal();
        return;
      }

      const row = e.target.closest('[data-hotspot]');
      if (!row) return;

      const id = row.getAttribute('data-hotspot');

      // Tapping the open row closes it again.
      if (this.expandedId === id) {
        this.collapse();
        return;
      }

      // selectLocation fans out to updateLocationView, which calls setActive
      // above — that's what opens the row, so it isn't expanded twice here.
      window.agoraMap?.selectLocation(id);

      // Bring the row it just opened to the top, so the feed below it is the
      // thing on screen rather than whatever happened to be there before.
      requestAnimationFrame(() => {
        row.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    document.getElementById('map-sheet-close-btn')?.addEventListener('click', () => {
      this.closeMapSheet();
    });

    // Escape closes the sheet, as with any other overlay in the app.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMapSheetOpen()) this.closeMapSheet();
    });
  }

  isMapSheetOpen() {
    return !!this.view?.classList.contains('map-sheet-open');
  }

  openMapSheet() {
    if (!this.view) return;
    this.view.classList.add('map-sheet-open');
    document.body.classList.add('map-sheet-locked');

    setTimeout(() => {
      this.settleMap();
      document.getElementById('map-sheet-close-btn')?.focus();
    }, 0);
  }

  /**
   * Leaflet caches its dimensions, and it measured this container while the
   * container was hidden (or still in flow, mid-layout) — so it can hold a size
   * that has nothing to do with the open sheet. Rather than guess at a delay,
   * re-measure until Leaflet's idea of the size matches the element's own box.
   */
  settleMap(attempt = 0) {
    const map = window.agoraMap?.map;
    const el = document.getElementById('map-canvas-container');
    if (!map || !el || !this.isMapSheetOpen()) return;

    map.invalidateSize();

    const size = map.getSize();
    const agrees = size.x === el.clientWidth && size.y === el.clientHeight;

    if (!agrees && attempt < 10) {
      requestAnimationFrame(() => this.settleMap(attempt + 1));
      return;
    }

    map.setView(NIGERIA_CENTER, NIGERIA_DEFAULT_ZOOM);
    // The popup was positioned against the stale size, so its auto-pan never
    // ran against the real viewport — re-open it now that the map is correct.
    window.agoraMap?.renderPopup();
  }

  closeMapSheet() {
    if (!this.view) return;
    this.view.classList.remove('map-sheet-open');
    document.body.classList.remove('map-sheet-locked');
    document.getElementById('open-map-sheet-btn')?.focus();
  }
}
