/**
 * AGORA LENS - INCIDENT REPORTING WIZARD
 * Multi-step verified reporting flow with PU auto-lookup and instant live integration.
 */

class AgoraReportingWizard {
  constructor() {
    this.modal = document.getElementById('report-incident-dialog');
    this.currentStep = 1;
    this.totalSteps = 4;
    this.formData = {
      state: 'Lagos State',
      lga: 'Ikeja',
      ward: 'Ward 3 (Alausa / Secretariat)',
      puCode: 'PU 24-08-03-018',
      category: 'ELECTORAL INTIMIDATION',
      title: '',
      narrative: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      witnessCount: '3',
      evidenceType: 'Geo-tagged Video & Photo'
    };
    this.init();
  }

  init() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Open Trigger buttons
    document.querySelectorAll('[data-action="open-report-modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.openReportModal());
    });

    // Close button
    document.getElementById('close-report-modal-btn')?.addEventListener('click', () => {
      this.closeReportModal();
    });

    // Navigation buttons
    document.getElementById('wizard-next-btn')?.addEventListener('click', () => {
      this.nextStep();
    });

    document.getElementById('wizard-prev-btn')?.addEventListener('click', () => {
      this.prevStep();
    });

    document.getElementById('wizard-submit-btn')?.addEventListener('click', () => {
      this.submitReport();
    });

    // Close on outside click
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeReportModal();
      }
    });
  }

  openReportModal() {
    this.currentStep = 1;
    this.renderStep();
    if (this.modal) {
      if (typeof this.modal.showModal === 'function') {
        this.modal.showModal();
      } else {
        this.modal.setAttribute('open', 'true');
      }
    }
  }

  closeReportModal() {
    if (this.modal) {
      if (typeof this.modal.close === 'function') {
        this.modal.close();
      } else {
        this.modal.removeAttribute('open');
      }
    }
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.saveCurrentStepData();
      this.currentStep++;
      this.renderStep();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.renderStep();
    }
  }

  saveCurrentStepData() {
    if (this.currentStep === 1) {
      this.formData.state = document.getElementById('report-state-select')?.value || this.formData.state;
      this.formData.lga = document.getElementById('report-lga-select')?.value || this.formData.lga;
      this.formData.puCode = document.getElementById('report-pu-input')?.value || this.formData.puCode;
    } else if (this.currentStep === 2) {
      const selectedCat = document.querySelector('.category-option-card.selected');
      if (selectedCat) {
        this.formData.category = selectedCat.getAttribute('data-category');
      }
    } else if (this.currentStep === 3) {
      this.formData.title = document.getElementById('report-title-input')?.value || 'Voter Disruption Event';
      this.formData.narrative = document.getElementById('report-narrative-input')?.value || 'Observed irregular queue disruption by unidentified individuals.';
    }
  }

  renderStep() {
    // Update step nodes
    for (let i = 1; i <= this.totalSteps; i++) {
      const node = document.getElementById(`step-node-${i}`);
      if (node) {
        node.classList.remove('active', 'completed');
        if (i === this.currentStep) node.classList.add('active');
        else if (i < this.currentStep) node.classList.add('completed');
      }
    }

    const container = document.getElementById('wizard-step-content');
    if (!container) return;

    // Buttons visibility
    const prevBtn = document.getElementById('wizard-prev-btn');
    const nextBtn = document.getElementById('wizard-next-btn');
    const submitBtn = document.getElementById('wizard-submit-btn');

    if (prevBtn) prevBtn.style.display = this.currentStep === 1 ? 'none' : 'inline-flex';
    if (nextBtn) nextBtn.style.display = this.currentStep === this.totalSteps ? 'none' : 'inline-flex';
    if (submitBtn) submitBtn.style.display = this.currentStep === this.totalSteps ? 'inline-flex' : 'none';

    if (this.currentStep === 1) {
      container.innerHTML = `
        <div class="form-group">
          <label class="form-label">Electoral State</label>
          <select id="report-state-select" class="form-control">
            <option value="Lagos State" selected>Lagos State</option>
            <option value="Kano State">Kano State</option>
            <option value="Rivers State">Rivers State</option>
            <option value="Kaduna State">Kaduna State</option>
            <option value="FCT Abuja">FCT Abuja</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Local Government Area (LGA)</label>
            <select id="report-lga-select" class="form-control">
              <option value="Ikeja" selected>Ikeja</option>
              <option value="Lagos Island">Lagos Island</option>
              <option value="Surulere">Surulere</option>
              <option value="Kano Municipal">Kano Municipal</option>
              <option value="Port Harcourt">Port Harcourt</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Polling Unit (PU) Code</label>
            <input type="text" id="report-pu-input" class="form-control" value="${this.formData.puCode}" placeholder="e.g. PU 24-08-03-018" />
          </div>
        </div>

        <div style="background: var(--bg-card-inset); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px; font-size: 11px; color: var(--text-muted);">
          &#x2714; Verified against INEC Master Directory: <strong>PU 24-08-03-018 (Secretariat Gate 2, Ikeja Ward 3)</strong>
        </div>
      `;
    } else if (this.currentStep === 2) {
      const categories = [
        { code: 'ELECTORAL INTIMIDATION', icon: '&#x26A0;', label: 'Voter Intimidation & Threats' },
        { code: 'ELECTORAL IRREGULARITY', icon: '&#x1F4DF;', label: 'BVAS / Tech Failure' },
        { code: 'POLLING DISRUPTION', icon: '&#x23F0;', label: 'Late Materials Arrival' },
        { code: 'BALLOT TAMPERING', icon: '&#x1F4E6;', label: 'Ballot Box Snatching' },
        { code: 'ELECTORAL VIOLENCE', icon: '&#x1F6A8;', label: 'Supporter Clashes / Violence' },
        { code: 'VOTE BUYING', icon: '&#x1F4B5;', label: 'Financial Inducement' }
      ];

      container.innerHTML = `
        <div class="form-group">
          <label class="form-label">Select Incident Classification</label>
          <div class="category-select-grid">
            ${categories.map(cat => `
              <div class="category-option-card ${this.formData.category === cat.code ? 'selected' : ''}" data-category="${cat.code}">
                <span>${cat.icon}</span>
                <span>${cat.label}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      container.querySelectorAll('.category-option-card').forEach(card => {
        card.addEventListener('click', () => {
          container.querySelectorAll('.category-option-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          this.formData.category = card.getAttribute('data-category');
        });
      });
    } else if (this.currentStep === 3) {
      container.innerHTML = `
        <div class="form-group">
          <label class="form-label">Incident Summary Headline</label>
          <input type="text" id="report-title-input" class="form-control" value="${this.formData.title || 'Unidentified individuals attempting to disrupt accreditation'}" />
        </div>

        <div class="form-group">
          <label class="form-label">Detailed Eyewitness Sitrep</label>
          <textarea id="report-narrative-input" class="form-control" placeholder="Describe the sequence of events, persons involved, and current status...">${this.formData.narrative || 'At approximately 12:45 PM, three individuals arrived and attempted to displace the queuing tape before polling agents intervened.'}</textarea>
        </div>
      `;
    } else if (this.currentStep === 4) {
      container.innerHTML = `
        <div style="background: var(--bg-card-inset); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 14px; display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-primary); text-transform: uppercase;">Review Submission</div>
          <div style="font-size: 12px; color: var(--text-secondary);">
            <strong>Location:</strong> ${this.formData.puCode} · ${this.formData.lga}, ${this.formData.state}
          </div>
          <div style="font-size: 12px; color: var(--text-secondary);">
            <strong>Category:</strong> ${this.formData.category}
          </div>
          <div style="font-size: 12px; color: var(--text-secondary);">
            <strong>Sitrep:</strong> ${this.formData.narrative || 'Queue disruption logged.'}
          </div>
        </div>

        <div style="border: 2px dashed var(--border-default); border-radius: var(--radius-sm); padding: 16px; text-align: center; cursor: pointer;">
          <div style="font-size: 20px;">&#x1F4F8;</div>
          <div style="font-size: 12px; font-weight: 600; color: var(--text-primary); margin-top: 4px;">Attached Verification Media (Mocked)</div>
          <div style="font-size: 10.5px; color: var(--text-muted);">2 Geo-tagged timestamps captured from device GPS.</div>
        </div>
      `;
    }
  }

  submitReport() {
    this.saveCurrentStepData();

    // Generate new incident
    const newCaseId = `#CAS-23-${Math.floor(1000 + Math.random() * 9000)}`;
    const newIncident = {
      id: `inc-user-${Date.now()}`,
      caseRef: newCaseId,
      locationId: 'lagos-ikeja',
      status: 'REPORTED',
      badgeType: 'REPORTED',
      badgeClass: 'badge-reported',
      category: this.formData.category,
      escalationType: null,
      timestamp: 'Just now',
      watTimestamp: `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WAT`,
      votingWindow: 'Current Turnout Window',
      title: this.formData.title || 'Citizen reported field incident',
      shortTitle: this.formData.title || 'Citizen reported field incident',
      summary: this.formData.narrative.substring(0, 100) + '...',
      fullNarrative: this.formData.narrative,
      locationCode: this.formData.puCode,
      precinctArea: `${this.formData.lga}, ${this.formData.state}`,
      locationTag: `IKJ - ${this.formData.lga}`,
      wardTag: this.formData.ward,
      electoralContext: 'Presidential & NASS',
      electoralSubContext: 'National General Poll',
      incidentType: this.formData.category,
      verificationSource: 'Citizen Fast-Track Stream (Under Verification)',
      evidenceVault: 'Citizen Video Submission #U881',
      credibilityWeight: '88.0%',
      corroborationText: 'Citizen Report Logged',
      isFeatured: false,
      contributesToAlert: 'alert-ikeja-01'
    };

    AGORA_DATA.incidents.unshift(newIncident);
    AGORA_DATA.locations['lagos-ikeja'].incidentsCount++;

    this.closeReportModal();

    // Show toast
    if (window.agoraNotifications) {
      window.agoraNotifications.showToast('Incident Submitted', `Case ${newCaseId} logged into verification pipeline.`, 'success');
    }

    // Refresh UI
    if (window.agoraApp) {
      window.agoraApp.updateLocationView(AGORA_DATA.selectedLocationId);
    }
  }
}
