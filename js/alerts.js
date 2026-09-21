/**
 * AGORA LENS - EARLY WARNING ALERTS MODULE
 * Aggregates observable incident signals into clear status tiers (NORMAL, ELEVATED, HIGH, CRITICAL).
 */

class AgoraAlertsManager {
  constructor() {
    this.alertModal = document.getElementById('alert-detail-dialog');
    this.init();
  }

  init() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    document.getElementById('close-alert-modal-btn')?.addEventListener('click', () => {
      this.closeAlertModal();
    });

    // Close on outside click
    this.alertModal?.addEventListener('click', (e) => {
      if (e.target === this.alertModal) {
        this.closeAlertModal();
      }
    });
  }

  // Render Early Warning Status Banner into target container
  renderStatusBanner(containerElement, locationId) {
    if (!containerElement) return;

    const loc = AGORA_DATA.locations[locationId] || AGORA_DATA.locations['lagos-ikeja'];
    const alert = AGORA_DATA.alerts.find(a => a.locationId === locationId) || AGORA_DATA.alerts[0];

    let bannerHTML = '';

    if (loc.status === 'NORMAL') {
      bannerHTML = `
        <div class="early-warning-banner" style="border-color: var(--border-default); background: var(--bg-card);">
          <div class="ew-header">
            <span class="ew-status-tag" style="color: var(--accent-green-bright);">
              <span class="badge-dot" style="background: var(--accent-green-bright); box-shadow: none;"></span>
              NORMAL ACTIVITY
            </span>
            <span class="badge-category">${loc.state}</span>
          </div>
          <div class="ew-location">${loc.name}</div>
          <div class="ew-summary">Reporting activity within expected baseline parameters. No threshold breach detected.</div>
          <div class="ew-metrics-row" style="border-color: var(--border-subtle);">
            <span>${loc.incidentsCount} reports in last 24h</span>
            <span style="color: var(--accent-green-bright); font-weight: 600;">Status Stable</span>
          </div>
        </div>
      `;
    } else {
      // Three-tier escalation using the brand palette: amber (elevated) -> orange (high) -> red (critical)
      const levelColor = alert.level === 'CRITICAL' ? 'var(--alert-red)' : (alert.level === 'HIGH' ? 'var(--brand-orange)' : 'var(--accent-amber-light)');
      const levelBg = alert.level === 'CRITICAL' ? 'var(--alert-red-bg)' : (alert.level === 'HIGH' ? 'var(--brand-orange-bg)' : 'var(--accent-amber-bg)');
      const levelBorder = alert.level === 'CRITICAL' ? 'var(--alert-red-border)' : (alert.level === 'HIGH' ? 'var(--brand-orange-border)' : 'var(--accent-amber-border)');

      bannerHTML = `
        <div class="early-warning-banner" id="active-early-warning-banner" data-alert-id="${alert.id}" style="background: ${levelBg}; border-color: ${levelBorder};">
          <div class="ew-header">
            <span class="ew-status-tag" style="color: ${levelColor};">
              <span class="badge-dot" style="background: ${levelColor};"></span>
              CURRENT STATUS: ${alert.statusText}
            </span>
            <span class="badge-category">${loc.state}</span>
          </div>
          <div class="ew-location">${loc.name}</div>
          <div class="ew-summary">${alert.reportsLast24h} reports in the last 24 hours · ${alert.verifiedCount} verified · ${alert.underReviewCount} under review</div>
          <div class="ew-metrics-row">
            <span>Updated: ${alert.lastUpdated}</span>
            <span class="ew-view-link">View alert details &rarr;</span>
          </div>
        </div>
      `;
    }

    containerElement.innerHTML = bannerHTML;

    // Attach click event to banner
    document.getElementById('active-early-warning-banner')?.addEventListener('click', () => {
      this.openAlertDetails(alert.id);
    });
  }

  // Open the Deep-Dive Alert Modal
  openAlertDetails(alertId) {
    const alert = AGORA_DATA.alerts.find(a => a.id === alertId) || AGORA_DATA.alerts[0];
    const loc = AGORA_DATA.locations[alert.locationId];

    const contentBox = document.getElementById('alert-modal-content');
    if (!contentBox) return;

    contentBox.innerHTML = `
      <!-- Hero Status Card -->
      <div class="alert-status-hero">
        <div class="hero-status-pill-row">
          <span class="badge badge-active-alert">
            <span class="badge-dot"></span>
            ${alert.statusText}
          </span>
          <span class="hero-timestamp">Last Updated: ${alert.lastUpdated}</span>
        </div>
        <div class="hero-alert-level">${alert.title}</div>
        <div style="font-size: 12px; color: var(--text-secondary);">
          <strong>Location:</strong> ${alert.locationName} (${loc.electoralZone})
        </div>
      </div>

      <!-- Observable Signals Breakdown -->
      <div class="signals-breakdown-box">
        <div style="font-size: 11px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px;">
          Observable Signals & Threshold Rationale
        </div>
        <div style="font-size: 11.5px; color: var(--text-secondary); margin-bottom: 4px;">
          ${alert.flaggedReason}
        </div>
        <div class="signals-list">
          ${alert.signals.map(s => `
            <div class="signal-item">
              <span class="signal-bullet">&#9679;</span>
              <span>${s}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Relationship: Underlying Incidents Generation Flow -->
      <div style="background: var(--bg-card-inset); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
        <div style="font-size: 10px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px;">
          Signal Aggregation Architecture (Multi-Incident Cluster)
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; font-family: var(--font-mono);">
          <div style="padding: 6px 8px; background: var(--bg-card); border-radius: 4px; color: var(--text-secondary); display: flex; justify-content: space-between;">
            <span>INCIDENT #1 · Intimidation Dispersal</span>
            <span style="color: var(--accent-green-bright);">Verified PU 018</span>
          </div>
          <div style="padding: 6px 8px; background: var(--bg-card); border-radius: 4px; color: var(--text-secondary); display: flex; justify-content: space-between;">
            <span>INCIDENT #2 · BVAS Tech Failure</span>
            <span style="color: var(--accent-green-bright);">Verified PU 002</span>
          </div>
          <div style="padding: 6px 8px; background: var(--bg-card); border-radius: 4px; color: var(--text-secondary); display: flex; justify-content: space-between;">
            <span>INCIDENT #3 · Late Material Arrival</span>
            <span style="color: var(--accent-cyan);">Corroborated PU 012</span>
          </div>
          <div style="text-align: center; color: var(--alert-red-light); font-weight: 700; font-size: 12px; margin: 2px 0;">
            &darr; Combined Threshold Exceeded &darr;
          </div>
          <div style="padding: 8px; background: var(--alert-red-bg); border: 1px solid var(--alert-red-border); border-radius: 4px; color: var(--alert-red-light); font-weight: 700; text-align: center;">
            ALERT: ${alert.statusText} (${alert.reportsLast24h} reports / 24h)
          </div>
        </div>
      </div>

      <!-- Historical Context Comparison -->
      <div style="background: var(--bg-card-inset); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
        <div style="font-size: 10px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 4px;">
          Historical Election Baseline Comparison
        </div>
        <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.45;">
          ${alert.historicalContext}
        </div>
      </div>

      <!-- Safety Advisory -->
      <div class="alert-action-advisory">
        <div class="advisory-title">Advisory for Voters & Accredited Observers</div>
        <div>${alert.advisory}</div>
      </div>
    `;

    if (this.alertModal) {
      if (typeof this.alertModal.showModal === 'function') {
        this.alertModal.showModal();
      } else {
        this.alertModal.setAttribute('open', 'true');
      }
    }
  }

  closeAlertModal() {
    if (this.alertModal) {
      if (typeof this.alertModal.close === 'function') {
        this.alertModal.close();
      } else {
        this.alertModal.removeAttribute('open');
      }
    }
  }
}
