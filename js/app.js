/**
 * AGORA LENS - MAIN CONTROLLER & APPLICATION COORDINATOR
 * Wires together UI views, year selectors, navigation tabs, search palette, and state synchronization.
 */

class AgoraApp {
  constructor() {
    this.mapEngine = null;
    this.alertsManager = null;
    this.incidentsManager = null;
    this.reportingWizard = null;
    this.notificationsManager = null;
    this.currentView = 'overview';
    this.currentYear = '2023';
    this.selectedLocationId = 'lagos-ikeja';
    this.reportFilters = { state: '', lga: '', electionType: '', year: '' };
    this.locationIndex = new Map();
    this.cmdModal = document.getElementById('command-palette-dialog');
    this.init();
  }

  init() {
    // Instantiate subsystem modules
    this.mapEngine = new AgoraMapEngine();
    this.hotspotList = new AgoraHotspotList();
    this.alertsManager = new AgoraAlertsManager();
    this.incidentsManager = new AgoraIncidentsManager();
    this.reportingWizard = new AgoraReportingWizard();
    this.notificationsManager = new AgoraNotificationManager();
    this.trendsEngine = new AgoraTrendsEngine();
    this.outcomesTracker = new AgoraOutcomesTracker();

    window.agoraMap = this.mapEngine;
    window.agoraHotspots = this.hotspotList;
    window.agoraAlerts = this.alertsManager;
    window.agoraIncidents = this.incidentsManager;
    window.agoraReporting = this.reportingWizard;
    window.agoraNotifications = this.notificationsManager;
    window.agoraTrends = this.trendsEngine;
    window.agoraOutcomes = this.outcomesTracker;

    this.attachNavListeners();
    this.attachYearSelector();
    this.attachCommandPalette();
    this.attachDrawerListeners();
    this.attachLanguageSwitcher();
    this.attachElectionTypeSelector();
    this.switchView(this.currentView);
    this.updateLocationView(this.selectedLocationId);
    this.renderKPIs(this.currentYear);
    this.populateReportFilters();
    this.attachReportFilterListeners();
    this.renderIncidentReportsTable();
    this.renderElectionFeed();
    this.renderIncidentAlertsView();
  }

  // Synchronize entire UI when a state/LGA is chosen
  updateLocationView(locationId) {
    this.selectedLocationId = locationId;
    const loc = AGORA_DATA.locations[locationId] || AGORA_DATA.locations['lagos-ikeja'];

    // Update Drawer Title & Counts
    const drawerTitle = document.getElementById('drawer-location-title');
    const drawerSubtitle = document.getElementById('drawer-location-subtitle');
    const pillDoc = document.getElementById('drawer-stat-documented');
    const pillCorrob = document.getElementById('drawer-stat-corroborated');
    const pillActive = document.getElementById('drawer-stat-active');
    const drawerReportLabel = document.getElementById('drawer-report-cta-label');
    const timelineBtnLabel = document.getElementById('view-timeline-btn-label');

    const place = loc.lga || 'Ikeja';

    if (drawerTitle) drawerTitle.textContent = t('drawer.alerts', { place });
    if (drawerSubtitle) drawerSubtitle.textContent = `${loc.state} · ${loc.wardsCount} ${t('drawer.wards')} · ${loc.pollingUnitsCount.toLocaleString()} ${t('drawer.pollingUnits')}`;
    if (pillDoc) pillDoc.textContent = `${loc.incidentsCount} ${t('drawer.documented')}`;
    if (pillCorrob) pillCorrob.textContent = `${loc.corroboratedCount} ${t('drawer.corroborated')}`;
    if (pillActive) pillActive.textContent = `${loc.activeCount} ${t('drawer.active')}`;
    // Labels live in dedicated spans so the buttons keep their icon/arrow markup.
    if (drawerReportLabel) drawerReportLabel.textContent = t('drawer.report', { place });
    if (timelineBtnLabel) timelineBtnLabel.textContent = t('drawer.timeline', { place });

    // Render Early Warning Status Banner
    const ewBannerContainer = document.getElementById('early-warning-banner-slot');
    if (ewBannerContainer) {
      this.alertsManager.renderStatusBanner(ewBannerContainer, locationId);
    }

    // Render Drawer Feed Cards
    const drawerCardsContainer = document.getElementById('drawer-cards-feed-container');
    if (drawerCardsContainer) {
      this.incidentsManager.renderDrawerCards(drawerCardsContainer, locationId);
    }

    // Keep the mobile hotspot list showing the same selection as the map.
    this.hotspotList?.setActive(locationId);

    // The bottom panel is deliberately not rendered here: it's the expanded
    // read of whichever drawer card is picked, so it stays hidden until one is
    // (renderDrawerCards resets the selection for the new location).
  }

  // Render KPI Metrics
  renderKPIs(year) {
    const kpi = AGORA_DATA.metrics[year] || AGORA_DATA.metrics['2023'];

    const voters = document.getElementById('kpi-registered-voters');
    const votersSub = document.getElementById('kpi-registered-voters-sub');
    const elections = document.getElementById('kpi-total-elections');
    const documented = document.getElementById('kpi-total-documented');
    const resolved = document.getElementById('kpi-conflicts-resolved');

    if (voters) voters.textContent = kpi.registeredVoters;
    if (votersSub) votersSub.textContent = kpi.registeredVotersFull;
    if (elections) elections.textContent = kpi.totalElectionsConducted;
    if (documented) documented.textContent = kpi.totalDocumentedIncidents;
    if (resolved) resolved.textContent = kpi.conflictsResolved;
  }

  // Navigation Tab Switching
  attachNavListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.getAttribute('data-view');
        if (targetView) {
          this.switchView(targetView);
        }
      });
    });
  }

  switchView(viewName) {
    this.currentView = viewName;

    // Update active nav state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      }
    });

    // Show/hide view containers
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active-view');
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active-view');
    }

    // Track Incident renders on open so it always reflects the selected record.
    if (viewName === 'track-outcomes') {
      // The id is a one-shot hand-off from a report's "Track" action; clearing
      // it means reaching the screen from the sidebar lands on the index.
      this.outcomesTracker?.open(this.trackedIncidentId);
      this.trackedIncidentId = null;
    }

    // The map view runs full-bleed with floating/collapsible panels; every other
    // view keeps the normal padded layout.
    const isMapView = viewName === 'overview';
    if (!isMapView) this.hotspotList?.closeMapSheet();

    document.getElementById('app-container')?.classList.toggle('map-fullbleed', isMapView);
    document.querySelector('.main-viewport')?.classList.toggle('map-fullbleed', isMapView);

    // The trend dashboard paints a darker page background than the app shell.
    // Carry it onto the scroll container so the surrounding gutter matches the
    // area the cards sit on instead of showing the lighter shell colour.
    document.querySelector('.main-viewport')
      ?.classList.toggle('viewport-trend-dark', viewName === 'trend-analysis');

    // The alerts drawer is an expanded view of the map's highlighted issues —
    // it only makes sense alongside the map, so it's Overview-only.
    const drawer = document.getElementById('alerts-drawer');
    const reopenBtn = document.getElementById('drawer-reopen-btn');
    if (drawer) drawer.style.display = isMapView ? '' : 'none';
    if (reopenBtn) reopenBtn.style.display = isMapView ? '' : 'none';
  }

  // Year Selection Filter
  attachYearSelector() {
    document.querySelectorAll('.pill-btn[data-year]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pill-btn[data-year]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const year = btn.getAttribute('data-year');
        this.currentYear = year;
        AGORA_DATA.currentYear = year;
        this.renderKPIs(year);
        if (this.notificationsManager) {
          this.notificationsManager.showToast('Dataset Filter Applied', `Switched to ${year} General Election Archive.`, 'info');
        }
      });
    });
  }

  // Sidebar Language Switcher
  // Election category selector. Mirrors the language switcher's open/close
  // pattern so the header controls behave identically.
  attachElectionTypeSelector() {
    const switcher = document.getElementById('election-type-switcher');
    const toggleBtn = document.getElementById('election-type-btn');
    const labelEl = document.getElementById('election-type-label');
    if (!switcher || !toggleBtn) return;

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = switcher.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
    });

    switcher.querySelectorAll('.header-select-option').forEach(option => {
      option.addEventListener('click', () => {
        const type = option.getAttribute('data-election-type');
        labelEl.textContent = type;
        AGORA_DATA.currentElectionType = type;

        switcher.querySelectorAll('.header-select-option').forEach(o => {
          o.classList.remove('active');
          o.setAttribute('aria-selected', 'false');
        });
        option.classList.add('active');
        option.setAttribute('aria-selected', 'true');

        switcher.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');

        this.currentElectionType = type;
        this.updateLocationView(this.selectedLocationId);
        this.notificationsManager?.showToast('Election Category', `Now viewing ${type} records.`, 'info');
      });
    });

    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target)) {
        switcher.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  attachLanguageSwitcher() {
    const switcher = document.getElementById('lang-switcher');
    const toggleBtn = document.getElementById('lang-switcher-btn');
    const flagEl = document.getElementById('lang-switcher-flag');
    const labelEl = document.getElementById('lang-switcher-label');
    if (!switcher || !toggleBtn) return;

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = switcher.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
    });

    switcher.querySelectorAll('.lang-switcher-option').forEach(option => {
      option.addEventListener('click', () => {
        const lang = option.getAttribute('data-lang');
        const flag = option.getAttribute('data-flag');

        flagEl.textContent = flag;
        labelEl.textContent = lang;

        switcher.querySelectorAll('.lang-switcher-option').forEach(o => {
          o.classList.remove('active');
          o.setAttribute('aria-selected', 'false');
        });
        option.classList.add('active');
        option.setAttribute('aria-selected', 'true');

        switcher.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');

        window.agoraI18n?.setLanguage(lang);
      });
    });

    // Views built in JS hold their strings in markup they generated earlier, so
    // they have to be rebuilt rather than re-labelled.
    document.addEventListener('agora:languagechange', () => {
      this.populateLgaOptions(this.reportFilters.state);
      this.renderIncidentReportsTable();
      this.renderElectionFeed();
      this.renderIncidentAlertsView();
      this.updateLocationView(this.selectedLocationId);
      this.hotspotList?.render();
      this.outcomesTracker?.open();
      window.agoraTheme?.syncToggle();
    });

    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target)) {
        switcher.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Command Palette & Global Shortcut (⌘K)
  attachCommandPalette() {
    // Open on button click
    document.getElementById('sidebar-search-trigger')?.addEventListener('click', () => {
      this.openCommandPalette();
    });

    // Keyboard shortcut (⌘K or Ctrl+K)
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      }
      if (e.key === 'Escape') {
        this.closeCommandPalette();
      }
    });

    const searchInput = document.getElementById('cmd-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.filterCommandPalette(e.target.value);
    });

    this.cmdModal?.addEventListener('click', (e) => {
      if (e.target === this.cmdModal) {
        this.closeCommandPalette();
      }
    });
  }

  openCommandPalette() {
    if (this.cmdModal) {
      this.filterCommandPalette('');
      if (typeof this.cmdModal.showModal === 'function') {
        this.cmdModal.showModal();
      } else {
        this.cmdModal.setAttribute('open', 'true');
      }
      document.getElementById('cmd-search-input')?.focus();
    }
  }

  closeCommandPalette() {
    if (this.cmdModal) {
      if (typeof this.cmdModal.close === 'function') {
        this.cmdModal.close();
      } else {
        this.cmdModal.removeAttribute('open');
      }
    }
  }

  filterCommandPalette(query) {
    const list = document.getElementById('cmd-results-list');
    if (!list) return;

    const q = query.toLowerCase().trim();

    const matchingIncidents = AGORA_DATA.incidents.filter(i => 
      i.title.toLowerCase().includes(q) || i.caseRef.toLowerCase().includes(q) || i.locationCode.toLowerCase().includes(q)
    );

    const matchingLocations = Object.values(AGORA_DATA.locations).filter(l => 
      l.name.toLowerCase().includes(q) || l.state.toLowerCase().includes(q)
    );

    let html = '';

    if (matchingLocations.length > 0) {
      html += `<div style="font-size: 10px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; padding: 6px 12px;">Locations & Electoral Zones</div>`;
      html += matchingLocations.map(l => `
        <div class="cmd-result-item" data-type="location" data-id="${l.id}">
          <div class="cmd-item-left">
            <div class="cmd-item-title">${l.name}</div>
            <div class="cmd-item-desc">${l.electoralZone} · Status: ${l.status}</div>
          </div>
          <span class="badge ${l.status === 'CRITICAL' ? 'badge-active-alert' : 'badge-category'}">${l.status}</span>
        </div>
      `).join('');
    }

    if (matchingIncidents.length > 0) {
      html += `<div style="font-size: 10px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; padding: 6px 12px; margin-top: 6px;">Documented Incidents</div>`;
      html += matchingIncidents.map(i => `
        <div class="cmd-result-item" data-type="incident" data-id="${i.id}">
          <div class="cmd-item-left">
            <div class="cmd-item-title">${i.title}</div>
            <div class="cmd-item-desc">${i.locationCode} · ${i.caseRef}</div>
          </div>
          <span class="badge ${i.badgeClass}">${i.badgeType}</span>
        </div>
      `).join('');
    }

    if (!html) {
      html = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px;">${t('table.empty')}</div>`;
    }

    list.innerHTML = html;

    list.querySelectorAll('.cmd-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.getAttribute('data-type');
        const id = item.getAttribute('data-id');
        this.closeCommandPalette();

        if (type === 'location') {
          this.switchView('overview');
          this.mapEngine?.selectLocation(id);
        } else if (type === 'incident') {
          this.incidentsManager?.openIncidentCase(id);
        }
      });
    });
  }

  // Drawer Toggles & Timeline
  attachDrawerListeners() {
    const drawer = document.getElementById('alerts-drawer');
    const reopenBtn = document.getElementById('drawer-reopen-btn');

    // Keeps the floating top/bottom map chrome narrowed & scaled down while the
    // drawer is open, so nothing ends up hidden behind it.
    this.setMapChromeCompact(true);

    document.getElementById('drawer-close-btn')?.addEventListener('click', () => {
      drawer?.classList.add('drawer-collapsed');
      reopenBtn?.classList.add('visible');
      this.setMapChromeCompact(false);
    });

    reopenBtn?.addEventListener('click', () => {
      drawer?.classList.remove('drawer-collapsed');
      reopenBtn?.classList.remove('visible');
      this.setMapChromeCompact(true);
    });

    document.getElementById('bottom-panel-toggle-btn')?.addEventListener('click', () => {
      // On a phone the panel is a fixed bottom sheet, so collapsing it would
      // slide the toggle off-screen with it — nothing left to tap. There the
      // control dismisses the sheet outright and clears the card selection.
      if (window.matchMedia('(max-width: 1024px)').matches) {
        this.incidentsManager?.clearDrawerSelection();
        return;
      }
      document.getElementById('map-floating-bottombar')?.classList.toggle('panel-collapsed');
    });

    document.getElementById('view-timeline-btn')?.addEventListener('click', () => {
      this.openLocationTimeline(this.selectedLocationId);
    });

    document.getElementById('drawer-report-cta-btn')?.addEventListener('click', () => {
      this.reportingWizard?.openReportModal();
    });
  }

  // Narrows and scales down the floating top/bottom map chrome so it stays
  // clear of, and legible next to, the alerts drawer when it's open.
  setMapChromeCompact(isCompact) {
    document.getElementById('map-floating-topbar')?.classList.toggle('chrome-compact', isCompact);
    document.getElementById('map-floating-bottombar')?.classList.toggle('chrome-compact', isCompact);
  }

  // "View Full <LGA> History & Timeline" hands off to the Incident Reports
  // repository with that jurisdiction already filtered in, so the full record
  // for the location opens in one step.
  openLocationTimeline(locationId) {
    const loc = AGORA_DATA.locations[locationId] || AGORA_DATA.locations['lagos-ikeja'];

    const stateSelect = document.getElementById('filter-state');
    const lgaSelect = document.getElementById('filter-lga');
    const typeSelect = document.getElementById('filter-election-type');
    const yearSelect = document.getElementById('filter-year');

    const state = this.normalizeStateName(loc.state);
    const lga = this.normalizeLgaName(loc.lga);

    // Only commit a filter the select can actually represent, otherwise the
    // dropdown and the table would disagree.
    let appliedState = '';
    if (stateSelect) {
      stateSelect.value = state;
      appliedState = stateSelect.value;
    }

    this.populateLgaOptions(appliedState);

    let appliedLga = '';
    if (lgaSelect && appliedState) {
      lgaSelect.value = lga;
      appliedLga = lgaSelect.value;
    }

    // The timeline is the location's whole history: leave type and year open.
    if (typeSelect) typeSelect.value = '';
    if (yearSelect) yearSelect.value = '';

    this.reportFilters = { state: appliedState, lga: appliedLga, electionType: '', year: '' };

    this.switchView('incident-reports');
    this.renderIncidentReportsTable();
  }

  // Render Table in "Incident Reports" Tab
  // ------------------------------------------------------------------------
  // Incident Reports: jurisdiction & election filters
  // ------------------------------------------------------------------------

  // Record data carries state names in several shapes ("Lagos State",
  // "FCT Abuja"); the registry keys on canonical short names.
  normalizeStateName(name) {
    if (!name) return '';
    const raw = String(name).trim();
    if (/^(fct|f\.c\.t\.?|federal capital territory|abuja)\b/i.test(raw)) {
      return 'Federal Capital Territory';
    }
    return raw.replace(/\s+state$/i, '');
  }

  normalizeLgaName(name) {
    if (!name) return '';
    const raw = String(name).trim();
    const alias = (typeof NIGERIA_LGA_ALIASES !== 'undefined')
      ? NIGERIA_LGA_ALIASES[raw.toLowerCase()]
      : null;
    return alias || raw;
  }

  // State -> sorted LGA list, covering all 36 states and the FCT. Jurisdictions
  // appearing only in local records are folded in so nothing is unfilterable.
  buildLocationIndex() {
    const index = new Map();

    const add = (state, lga) => {
      const stateName = this.normalizeStateName(state);
      if (!stateName) return;
      if (!index.has(stateName)) index.set(stateName, new Set());
      const lgaName = this.normalizeLgaName(lga);
      if (lgaName) index.get(stateName).add(lgaName);
    };

    if (typeof NIGERIA_JURISDICTIONS !== 'undefined') {
      Object.entries(NIGERIA_JURISDICTIONS).forEach(([state, lgas]) => {
        lgas.forEach(lga => add(state, lga));
      });
    }

    Object.values(AGORA_DATA.locations || {}).forEach(loc => add(loc.state, loc.lga));
    (AGORA_DATA.pollingUnitRegistry || []).forEach(pu => add(pu.state, pu.lga));

    return index;
  }

  // Election type is derived from the incident's electoral context so newly
  // added records are classified without needing a separate field.
  getIncidentElectionType(inc) {
    const context = `${inc.electoralContext || ''} ${inc.electoralSubContext || ''}`.toLowerCase();
    if (/gubernatorial|governor/.test(context)) return 'Gubernatorial';
    if (/local government|council|lga/.test(context)) return 'Local Government';
    if (/presidential|nass|national assembly/.test(context)) return 'Presidential';
    return '';
  }

  getIncidentYear(inc) {
    const stamp = inc.watTimestamp || inc.timestamp || '';
    const match = stamp.match(/\b(?:19|20)\d{2}\b/);
    return match ? match[0] : '';
  }

  getIncidentLocation(inc) {
    return AGORA_DATA.locations[inc.locationId] || null;
  }

  populateReportFilters() {
    const stateSelect = document.getElementById('filter-state');
    const yearSelect = document.getElementById('filter-year');
    if (!stateSelect || !yearSelect) return;

    this.locationIndex = this.buildLocationIndex();

    [...this.locationIndex.keys()].sort().forEach(state => {
      stateSelect.insertAdjacentHTML('beforeend', `<option value="${state}">${state}</option>`);
    });

    // Nigeria's general election cycles, newest first.
    const years = new Set(AGORA_DATA.electionYears || Object.keys(AGORA_DATA.metrics || {}));

    [...years].sort((a, b) => Number(b) - Number(a)).forEach(year => {
      yearSelect.insertAdjacentHTML('beforeend', `<option value="${year}">${year}</option>`);
    });

    this.populateLgaOptions('');
  }

  // The LGA list is always scoped to the chosen state, never the whole country.
  populateLgaOptions(state) {
    const lgaSelect = document.getElementById('filter-lga');
    if (!lgaSelect) return;

    const lgas = state ? [...(this.locationIndex.get(state) || [])].sort() : [];

    lgaSelect.innerHTML = `<option value="">${t('filter.allLgas')}</option>` +
      lgas.map(lga => `<option value="${lga}">${lga}</option>`).join('');
    lgaSelect.disabled = !state;
    lgaSelect.value = '';
  }

  attachReportFilterListeners() {
    const stateSelect = document.getElementById('filter-state');
    const lgaSelect = document.getElementById('filter-lga');
    const typeSelect = document.getElementById('filter-election-type');
    const yearSelect = document.getElementById('filter-year');
    const resetBtn = document.getElementById('filter-reset-btn');

    stateSelect?.addEventListener('change', () => {
      this.reportFilters.state = stateSelect.value;
      // A different state invalidates whichever LGA was picked under the old one.
      this.reportFilters.lga = '';
      this.populateLgaOptions(stateSelect.value);
      this.renderIncidentReportsTable();
    });

    lgaSelect?.addEventListener('change', () => {
      this.reportFilters.lga = lgaSelect.value;
      this.renderIncidentReportsTable();
    });

    typeSelect?.addEventListener('change', () => {
      this.reportFilters.electionType = typeSelect.value;
      this.renderIncidentReportsTable();
    });

    yearSelect?.addEventListener('change', () => {
      this.reportFilters.year = yearSelect.value;
      this.renderIncidentReportsTable();
    });

    resetBtn?.addEventListener('click', () => {
      this.reportFilters = { state: '', lga: '', electionType: '', year: '' };
      if (stateSelect) stateSelect.value = '';
      if (typeSelect) typeSelect.value = '';
      if (yearSelect) yearSelect.value = '';
      this.populateLgaOptions('');
      this.renderIncidentReportsTable();
    });
  }

  getFilteredIncidents() {
    const filters = this.reportFilters;

    return AGORA_DATA.incidents.filter(inc => {
      const loc = this.getIncidentLocation(inc);
      const state = loc ? this.normalizeStateName(loc.state) : '';
      const lga = loc ? this.normalizeLgaName(loc.lga) : '';
      if (filters.state && state !== filters.state) return false;
      if (filters.lga && lga !== filters.lga) return false;
      if (filters.electionType && this.getIncidentElectionType(inc) !== filters.electionType) return false;
      if (filters.year && this.getIncidentYear(inc) !== filters.year) return false;
      return true;
    });
  }

  // Render Table in "Incident Reports" Tab
  renderIncidentReportsTable() {
    const tableBody = document.getElementById('incident-reports-tbody');
    if (!tableBody) return;

    const incidents = this.getFilteredIncidents();
    const total = AGORA_DATA.incidents.length;
    const isFiltered = Object.values(this.reportFilters).some(Boolean);

    const countLabel = document.getElementById('filter-result-count');
    if (countLabel) {
      countLabel.textContent = isFiltered
        ? t('outcomes.reportsOf', { shown: incidents.length, total })
        : `${total} ${t('outcomes.reports')}`;
    }

    if (incidents.length === 0) {
      tableBody.innerHTML = `
        <tr class="table-empty-row">
          <td colspan="8">No incident reports match these filters.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = incidents.map(inc => `
      <tr data-incident-id="${inc.id}">
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--text-primary);">${inc.caseRef}</td>
        <td><span class="badge ${inc.badgeClass}">${inc.badgeType}</span></td>
        <td style="font-weight: 600; color: var(--text-primary);">${inc.title}</td>
        <td style="font-family: var(--font-mono);">${inc.locationCode}</td>
        <td>${inc.category}</td>
        <td style="font-family: var(--font-mono); color: var(--accent-green-bright);">${inc.credibilityWeight}</td>
        <td style="color: var(--text-muted);">${inc.watTimestamp}</td>
        <td class="track-td-action">
          <button class="track-row-btn" type="button" data-track-incident="${inc.id}">${t('table.track')} &rarr;</button>
        </td>
      </tr>
    `).join('');

    tableBody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', (e) => {
        const id = row.getAttribute('data-incident-id');
        if (!id) return;
        // The Track action opens the outcome timeline; the row itself keeps its
        // existing behaviour of opening the case inspector.
        if (e.target.closest('[data-track-incident]')) {
          this.openIncidentTrack(id);
          return;
        }
        this.incidentsManager.openIncidentCase(id);
      });
    });
  }

  // Opens the Track Incident view for a specific record.
  openIncidentTrack(incidentId) {
    this.trackedIncidentId = incidentId;
    this.switchView('track-outcomes');
  }

  // Render Live Election Feed Tab (News separate from Alerts)
  // Category thumbnails. The dataset carries no imagery, and a stock photo
  // would misrepresent a real dispatch — so each item gets a generated
  // category card instead. A record with a real `image` URL uses that.
  newsThumbPalette(category) {
    switch (category) {
      case 'Official Announcement': return { tint: '#1fad9d', tag: 'INEC' };
      case 'Observer Report': return { tint: '#34d399', tag: 'OBS' };
      case 'Security Sitrep': return { tint: '#ed6304', tag: 'SEC' };
      default: return { tint: '#7E7E80', tag: 'WIRE' };
    }
  }

  /**
   * Every feed item has an image slot at Assets/feed/<item id>.jpg — drop a
   * file in and it appears. Until then the generated category card shows
   * through underneath: the <img> sits over it and removes itself if the file
   * isn't there, so a missing image is never a broken frame.
   */
  buildNewsThumb(item) {
    const slot = item.image
      ? `<img class="feed-thumb-img" src="${item.image}" alt="" loading="lazy"
           onerror="this.remove()" />`
      : '';

    return `${this.buildNewsThumbFallback(item)}${slot}`;
  }

  buildNewsThumbFallback(item) {
    const { tint, tag } = this.newsThumbPalette(item.category);
    const initials = (item.source || '')
      .split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();

    return `
      <div class="feed-thumb-generated" style="--thumb-tint: ${tint};" aria-hidden="true">
        <svg viewBox="0 0 120 84" preserveAspectRatio="xMidYMid slice" role="presentation">
          <defs>
            <linearGradient id="fg-${item.id}" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="${tint}" stop-opacity="0.34" />
              <stop offset="100%" stop-color="${tint}" stop-opacity="0.06" />
            </linearGradient>
          </defs>
          <rect width="120" height="84" fill="url(#fg-${item.id})" />
          <g stroke="${tint}" stroke-opacity="0.35" stroke-width="1">
            <line x1="0" y1="21" x2="120" y2="21" />
            <line x1="0" y1="42" x2="120" y2="42" />
            <line x1="0" y1="63" x2="120" y2="63" />
          </g>
          <circle cx="94" cy="22" r="13" fill="${tint}" fill-opacity="0.22" />
          <text x="12" y="52" font-family="Schibsted Grotesk, sans-serif" font-size="20"
            font-weight="800" fill="${tint}">${initials}</text>
        </svg>
        <span class="feed-thumb-tag">${tag}</span>
      </div>
    `;
  }

  renderElectionFeed() {
    const feedContainer = document.getElementById('election-feed-list');
    if (!feedContainer) return;

    feedContainer.innerHTML = AGORA_DATA.news.map(n => `
      <article class="feed-card">
        <div class="feed-thumb">${this.buildNewsThumb(n)}</div>
        <div class="feed-card-body">
          <div class="feed-card-top">
            <span class="badge badge-category" style="color: var(--accent-cyan);">${n.source}</span>
            <span class="feed-card-time">${n.timestamp}</span>
          </div>
          <h3 class="feed-card-title">${n.title}</h3>
          <p class="feed-card-snippet">${n.snippet}</p>
          <div class="feed-card-foot">
            <span class="feed-card-type">Type: ${n.category}</span>
            <a href="${n.url || '#'}" class="feed-card-link">Full Wire Dispatch &rarr;</a>
          </div>
        </div>
      </article>
    `).join('');
  }

  // Render Incident Alerts Dedicated Tab
  // Distances are straight-line miles from the viewer's area to the flagged
  // jurisdiction, so "near you" is a statement the list can actually back up.
  formatDistance(miles) {
    if (typeof miles !== 'number') return t('alerts.noDistance');
    if (miles < 1) return t('alerts.underMile');
    return t('alerts.milesAway', { miles: miles < 10 ? miles.toFixed(1) : Math.round(miles) });
  }

  renderIncidentAlertsView() {
    const container = document.getElementById('incident-alerts-grid');
    if (!container) return;

    const nearestFirst = [...AGORA_DATA.alerts].sort(
      (a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity)
    );

    container.innerHTML = nearestFirst.map(a => `
      <div style="background: var(--bg-card); border: 1px solid var(--border-card); border-left: 4px solid ${a.level === 'CRITICAL' ? 'var(--alert-red)' : 'var(--accent-amber-light)'}; border-radius: var(--radius-sm); padding: 16px; display: flex; flex-direction: column; gap: 8px; cursor: pointer;" onclick="window.agoraAlerts.openAlertDetails('${a.id}')">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
          <span class="badge ${a.level === 'CRITICAL' ? 'badge-active-alert' : 'badge-escalation'}">● ${a.statusText}</span>
          <span class="alert-distance-tag">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            ${this.formatDistance(a.distanceMiles)}
          </span>
        </div>
        <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">${a.title}</div>
        <div style="font-size: 12px; color: var(--text-secondary);">${a.flaggedReason}</div>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 8px;">
          <span>${a.reportsLast24h} reports (${a.verifiedCount} verified · ${a.underReviewCount} under review)</span>
          <span style="color: var(--alert-red-light); font-weight: 700;">Inspect Early Warning &rarr;</span>
        </div>
      </div>
    `).join('');
  }
}

// Boot once the dataset is settled — the loader resolves either with the
// published snapshot or with the bundled fallback, so this never blocks.
document.addEventListener('DOMContentLoaded', async () => {
  await window.agoraDataReady;
  window.agoraApp = new AgoraApp();
});

// Register the service worker for offline/repeat-visit caching. Only works over
// http(s) — silently does nothing if Index.html is opened directly as a file.
if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
