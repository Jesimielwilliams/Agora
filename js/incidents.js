/**
 * AGORA LENS - INCIDENTS MODULE
 * Renders featured incident card, drawer feed list, case inspection modal, and report filters.
 */

class AgoraIncidentsManager {
  constructor() {
    this.caseModal = document.getElementById('incident-case-dialog');
    this.selectedIncidentId = null;
    this.init();
  }

  init() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    document.getElementById('close-case-modal-btn')?.addEventListener('click', () => {
      this.closeCaseModal();
    });

    this.caseModal?.addEventListener('click', (e) => {
      if (e.target === this.caseModal) {
        this.closeCaseModal();
      }
    });
  }

  // Render the bottom expanded-incident panel for one specific incident.
  // It's no longer a standing "featured" card: it only appears once a drawer
  // card is picked, as the expanded read of that exact record.
  renderIncidentPanel(containerElement, incidentId) {
    if (!containerElement) return;

    const incident = AGORA_DATA.incidents.find(inc => inc.id === incidentId);
    if (!incident) return;

    const badgeType = incident.badgeType || 'CORROBORATED INCIDENT';
    const badgeClass = incident.badgeClass || 'badge-corroborated';

    const html = `
      <div class="featured-incident-card" id="featured-card-${incident.id}">
        <div class="featured-header-badges">
          <span class="badge ${badgeClass}">
            <span class="badge-dot" style="background: var(--accent-cyan);"></span>
            ${badgeType}
          </span>
          ${incident.escalationType ? `
            <span class="badge badge-escalation">
              <span class="badge-dot" style="background: var(--accent-amber-light);"></span>
              ${incident.escalationType}
            </span>
          ` : ''}
        </div>

        <div class="featured-title">
          ${incident.title}
        </div>

        <div class="featured-description">
          ${incident.fullNarrative || incident.summary}
        </div>

        <!-- 4 Inset Metadata Boxes (Exact Match with Reference) -->
        <div class="featured-meta-grid">
          <div class="meta-inset-box">
            <span class="meta-inset-label">LOCATION</span>
            <span class="meta-inset-primary">${incident.locationTag}</span>
            <span class="meta-inset-secondary">${incident.wardTag}</span>
          </div>

          <div class="meta-inset-box">
            <span class="meta-inset-label">EVENT TIMESTAMP</span>
            <span class="meta-inset-primary">${incident.watTimestamp}</span>
            <span class="meta-inset-secondary">${incident.votingWindow}</span>
          </div>

          <div class="meta-inset-box">
            <span class="meta-inset-label">ELECTORAL CONTEXT</span>
            <span class="meta-inset-primary">${incident.electoralContext}</span>
            <span class="meta-inset-secondary">${incident.electoralSubContext}</span>
          </div>

          <div class="meta-inset-box">
            <span class="meta-inset-label">Credibility Weight: <strong class="meta-inset-primary accent-green">${incident.credibilityWeight}</strong></span>
            <span class="meta-inset-secondary">${incident.corroborationText}</span>
            <div class="credibility-bar-container">
              <div class="credibility-bar-fill" style="width: ${incident.credibilityWeight};"></div>
            </div>
          </div>
        </div>

        <div class="featured-card-footer">
          <span class="case-ref-tag">${t('drawer.caseRef')}: ${incident.caseRef}</span>
          <span class="read-report-link">${t('drawer.openDossier')} &rarr;</span>
        </div>
      </div>
    `;

    containerElement.innerHTML = html;

    // Attach click to open case dialog
    document.getElementById(`featured-card-${incident.id}`)?.addEventListener('click', () => {
      this.openIncidentCase(incident.id);
    });
  }

  // Render Right Drawer Incident Cards List
  renderDrawerCards(containerElement, locationId) {
    if (!containerElement) return;

    const locIncidents = AGORA_DATA.incidents.filter(inc => inc.locationId === locationId);
    const displayList = locIncidents.length > 0 ? locIncidents : AGORA_DATA.incidents.slice(0, 3);

    const html = displayList.map(inc => {
      let highlightClass = '';
      if (inc.status === 'ACTIVE_ALERT') highlightClass = 'card-alert-highlight';
      else if (inc.status === 'VERIFIED') highlightClass = 'card-verified-highlight';
      else highlightClass = 'card-reported-highlight';

      const isActiveAlert = inc.status === 'ACTIVE_ALERT';

      // Live alerts lead with the time they broke; settled cases lead with
      // their electoral category.
      const topRightMeta = isActiveAlert
        ? `<span class="drawer-card-timestamp">${inc.timestamp}</span>`
        : `<span class="badge-category">${inc.category}</span>`;

      // ...and mirror that in the inset box: an active alert states what kind
      // of incident it is, everything else states when it happened.
      const thirdRow = isActiveAlert
        ? (inc.incidentType ? `
            <span class="kv-key">Incident Type</span>
            <span class="kv-val kv-val-uppercase">${inc.incidentType}</span>
          ` : '')
        : (inc.timestamp ? `
            <span class="kv-key">Timestamp</span>
            <span class="kv-val">${inc.timestamp}</span>
          ` : '');

      const sourceLabel = isActiveAlert ? 'Verification Source' : 'Evidence Vault';

      return `
        <div class="drawer-card ${highlightClass}" data-incident-id="${inc.id}">
          <div class="drawer-card-top-row">
            <span class="badge ${inc.badgeClass}">
              ${isActiveAlert ? `
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ` : ''}
              ${inc.badgeType}
            </span>
            ${topRightMeta}
          </div>

          <div class="drawer-card-title">${inc.shortTitle || inc.title}</div>
          <div class="drawer-card-summary">${inc.summary}</div>

          <!-- Key-Value Metadata Inset -->
          <div class="card-inset-kv-table">
            <span class="kv-key">Location Code</span>
            <span class="kv-val">${inc.locationCode}</span>

            <span class="kv-key">Precinct Area</span>
            <span class="kv-val">${inc.precinctArea}</span>

            ${thirdRow}

            ${inc.verificationSource ? `
              <span class="kv-key">${sourceLabel}</span>
              <span class="kv-val highlight-green">${inc.verificationSource}</span>
            ` : ''}
          </div>

          <div class="drawer-card-footer">
            <span class="case-ref-tag">${t('drawer.caseRef')}: ${inc.caseRef}</span>
            <span class="read-report-link">${t('drawer.readReport')} &rarr;</span>
          </div>
        </div>
      `;
    }).join('');

    containerElement.innerHTML = html;

    // A fresh feed starts with nothing picked: no card is outlined and the
    // bottom panel stays hidden until one is.
    this.clearDrawerSelection();

    // Picking a card outlines it and expands it into the bottom panel;
    // picking it again puts both back.
    containerElement.querySelectorAll('.drawer-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-incident-id');
        if (!id) return;
        if (id === this.selectedIncidentId) {
          this.clearDrawerSelection();
        } else {
          this.selectDrawerIncident(id);
        }
      });
    });
  }

  // Outline the chosen card and expand it into the bottom panel.
  // The same cards render in two places — the desktop drawer and the mobile
  // hotspot accordion — so selection is tracked across every feed on the page.
  selectDrawerIncident(incidentId) {
    const panelContainer = document.getElementById('featured-incident-card-container');
    const bottomBar = document.getElementById('map-floating-bottombar');

    document.querySelectorAll('.drawer-card').forEach(card => {
      card.classList.toggle('is-selected', card.getAttribute('data-incident-id') === incidentId);
    });

    this.selectedIncidentId = incidentId;
    this.renderIncidentPanel(panelContainer, incidentId);

    // A collapsed panel would swallow the selection, so re-open it too.
    bottomBar?.classList.remove('panel-hidden', 'panel-collapsed');
  }

  // Drop the outline and take the bottom panel back down.
  clearDrawerSelection() {
    const panelContainer = document.getElementById('featured-incident-card-container');
    const bottomBar = document.getElementById('map-floating-bottombar');

    document.querySelectorAll('.drawer-card.is-selected').forEach(card => {
      card.classList.remove('is-selected');
    });

    this.selectedIncidentId = null;
    bottomBar?.classList.add('panel-hidden');
    if (panelContainer) panelContainer.innerHTML = '';
  }

  // Open Full Incident Case Inspector Modal
  openIncidentCase(incidentId) {
    const inc = AGORA_DATA.incidents.find(i => i.id === incidentId) || AGORA_DATA.incidents[0];
    const contentBox = document.getElementById('case-modal-content');
    if (!contentBox) return;

    contentBox.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span class="badge ${inc.badgeClass}">${inc.badgeType}</span>
        <span class="case-ref-tag" style="font-size: 12px; font-weight: 700;">${inc.caseRef}</span>
      </div>

      <div style="font-size: 16px; font-weight: 800; color: var(--text-primary); line-height: 1.35;">
        ${inc.title}
      </div>

      <div style="background: var(--bg-card-inset); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
        <div style="font-size: 10px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 6px;">
          Full Verified Sitrep Narrative
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.55;">
          ${inc.fullNarrative}
        </div>
      </div>

      <div class="featured-meta-grid" style="grid-template-columns: 1fr 1fr; margin-top: 0;">
        <div class="meta-inset-box">
          <span class="meta-inset-label">Polling Unit Code</span>
          <span class="meta-inset-primary">${inc.locationCode}</span>
          <span class="meta-inset-secondary">${inc.precinctArea}</span>
        </div>
        <div class="meta-inset-box">
          <span class="meta-inset-label">Credibility Index</span>
          <span class="meta-inset-primary accent-green">${inc.credibilityWeight}</span>
          <span class="meta-inset-secondary">${inc.corroborationText}</span>
        </div>
      </div>

      <div style="background: var(--bg-card-inset); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
        <div style="font-size: 10px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 6px;">
          Evidence Vault & Corroborating Observer Logs
        </div>
        <div style="font-size: 11.5px; color: var(--text-secondary); font-family: var(--font-mono);">
          &#x1F4C1; ${inc.evidenceVault || inc.verificationSource}
        </div>
        <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 4px;">
          Cryptographically hashed observer submission verified against INEC Master Polling Directory.
        </div>
      </div>
    `;

    if (this.caseModal) {
      if (typeof this.caseModal.showModal === 'function') {
        this.caseModal.showModal();
      } else {
        this.caseModal.setAttribute('open', 'true');
      }
    }
  }

  closeCaseModal() {
    if (this.caseModal) {
      if (typeof this.caseModal.close === 'function') {
        this.caseModal.close();
      } else {
        this.caseModal.removeAttribute('open');
      }
    }
  }
}
