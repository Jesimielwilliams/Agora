/**
 * AGORA LENS - NOTIFICATIONS & PREFERENCES MODULE
 * Contextual, opt-in civic early warning notification preferences.
 */

class AgoraNotificationManager {
  constructor() {
    this.preferencesModal = document.getElementById('notification-preferences-dialog');
    this.toastContainer = document.getElementById('toast-container');
    this.preferences = {
      followedLocations: [
        { type: 'Polling Unit', name: 'PU 24-08-03-018 (Secretariat Gate 2)', enabled: true },
        { type: 'LGA', name: 'Ikeja, Lagos State', enabled: true },
        { type: 'State', name: 'Lagos State', enabled: false }
      ],
      alertTiers: {
        critical: true,      // Confirmed incident / serious security threat
        high: true,          // Elevated multi-signal activity
        informational: false // Aggregated daily rollup
      },
      deliveryChannels: {
        inApp: true,
        sms: false,
        email: true
      }
    };
    this.init();
  }

  init() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Preferences trigger
    document.querySelectorAll('[data-action="open-preferences-modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.openPreferencesModal());
    });

    document.getElementById('close-preferences-modal-btn')?.addEventListener('click', () => {
      this.closePreferencesModal();
    });

    document.getElementById('save-preferences-btn')?.addEventListener('click', () => {
      this.savePreferences();
    });

    // Close on outside click
    this.preferencesModal?.addEventListener('click', (e) => {
      if (e.target === this.preferencesModal) {
        this.closePreferencesModal();
      }
    });
  }

  openPreferencesModal() {
    this.renderPreferencesContent();
    if (this.preferencesModal) {
      if (typeof this.preferencesModal.showModal === 'function') {
        this.preferencesModal.showModal();
      } else {
        this.preferencesModal.setAttribute('open', 'true');
      }
    }
  }

  closePreferencesModal() {
    if (this.preferencesModal) {
      if (typeof this.preferencesModal.close === 'function') {
        this.preferencesModal.close();
      } else {
        this.preferencesModal.removeAttribute('open');
      }
    }
  }

  renderPreferencesContent() {
    const container = document.getElementById('preferences-modal-content');
    if (!container) return;

    container.innerHTML = `
      <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.45;">
        Configure opt-in safety notifications. Agora Lens delivers verified alerts and early warnings without algorithmic spam or unverified rumors.
      </div>

      <!-- Followed Geographies -->
      <div style="background: var(--bg-card-inset); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
        <div style="font-size: 11px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; margin-bottom: 8px;">
          Followed Polling Units & Jurisdictions
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${this.preferences.followedLocations.map((loc, idx) => `
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; padding: 6px 8px; background: var(--bg-card); border-radius: 4px;">
              <div>
                <span class="badge badge-category" style="margin-right: 6px;">${loc.type}</span>
                <span style="color: var(--text-primary); font-weight: 600;">${loc.name}</span>
              </div>
              <input type="checkbox" ${loc.enabled ? 'checked' : ''} id="pref-loc-${idx}" style="accent-color: var(--accent-green-bright);" />
            </div>
          `).join('')}
        </div>
        <button class="btn btn-ghost" style="margin-top: 8px; font-size: 11px; padding: 4px 8px;" id="add-followed-pu-btn">
          + Follow Another Polling Unit or Ward
        </button>
      </div>

      <!-- Alert Level Tiers -->
      <div style="background: var(--bg-card-inset); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
        <div style="font-size: 11px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; margin-bottom: 8px;">
          Alert Sensitivity Levels
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer;">
            <input type="checkbox" ${this.preferences.alertTiers.critical ? 'checked' : ''} id="pref-tier-critical" style="margin-top: 2px; accent-color: var(--alert-red);" />
            <div>
              <div style="font-size: 12px; font-weight: 700; color: var(--alert-red-light);">CRITICAL ALERTS</div>
              <div style="font-size: 10.5px; color: var(--text-muted);">Confirmed disruption or high-severity safety event near your polling unit.</div>
            </div>
          </label>

          <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer;">
            <input type="checkbox" ${this.preferences.alertTiers.high ? 'checked' : ''} id="pref-tier-high" style="margin-top: 2px; accent-color: var(--accent-amber-light);" />
            <div>
              <div style="font-size: 12px; font-weight: 700; color: var(--accent-amber-light);">HIGH & ELEVATED ALERTS</div>
              <div style="font-size: 10.5px; color: var(--text-muted);">Elevated multi-signal activity detected around your LGA or Ward.</div>
            </div>
          </label>

          <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer;">
            <input type="checkbox" ${this.preferences.alertTiers.informational ? 'checked' : ''} id="pref-tier-info" style="margin-top: 2px; accent-color: var(--accent-cyan);" />
            <div>
              <div style="font-size: 12px; font-weight: 700; color: var(--accent-cyan);">INFORMATIONAL ROLLUPS</div>
              <div style="font-size: 10.5px; color: var(--text-muted);">Periodic summary of new verified reports in your electoral state.</div>
            </div>
          </label>
        </div>
      </div>
    `;

    document.getElementById('add-followed-pu-btn')?.addEventListener('click', () => {
      this.showToast('Follow Polling Unit', 'Enter PU Code to track real-time queue health.');
    });
  }

  savePreferences() {
    this.preferences.alertTiers.critical = document.getElementById('pref-tier-critical')?.checked ?? true;
    this.preferences.alertTiers.high = document.getElementById('pref-tier-high')?.checked ?? true;
    this.preferences.alertTiers.informational = document.getElementById('pref-tier-info')?.checked ?? false;

    this.closePreferencesModal();
    this.showToast('Preferences Saved', 'Civic alert subscription settings updated successfully.', 'success');
  }

  // Transient task-completion pop-ups were removed from the bottom-right
  // corner: actions now confirm themselves in place (panels, filters, tables)
  // rather than interrupting the map with a floating card. Kept as a no-op so
  // existing call sites stay valid.
  showToast() {
    return;
  }
}
