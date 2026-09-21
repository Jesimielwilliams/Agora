/**
 * AGORA LENS - TRACK INCIDENT
 *
 * Detail view for a single incident record: case summary, chronological
 * outcome timeline, and the evidence / sources / legal document tabs.
 *
 * Reads AGORA_DATA.incidents (the record) and AGORA_DATA.incidentTracks (its
 * documented progression). A stage only appears when something was actually
 * documented — an absent stage is an absence of public record, not a finding
 * that an authority failed to act.
 */

const TRACK_STAGE_ORDER = [
  { key: 'reported', num: '01', label: 'Reported' },
  { key: 'review', num: '02', label: 'Under Review' },
  { key: 'verified', num: '03', label: 'Verified' },
  { key: 'referred', num: '04', label: 'Referred' },
  { key: 'investigation', num: '05', label: 'Investigation' },
  { key: 'response', num: '06', label: 'Institutional Response' },
  { key: 'legal', num: '07', label: 'Legal Process' },
  { key: 'conclusion', num: '08', label: 'Conclusion' }
];

/**
 * A source whose kind we don't recognise still has to render. Indexing the
 * table directly threw and took the whole Sources tab down with it.
 */
function sourceType(kind) {
  return TRACK_SOURCE_TYPES[kind] ?? { label: 'Other', cls: 'src-citizen' };
}

const TRACK_SOURCE_TYPES = {
  official: { label: 'Official', cls: 'src-official' },
  media: { label: 'Media', cls: 'src-media' },
  observer: { label: 'Observer', cls: 'src-observer' },
  research: { label: 'Research', cls: 'src-research' },
  citizen: { label: 'Citizen', cls: 'src-citizen' }
};

const TRACK_EVIDENCE_ICONS = {
  video: '&#9654;',
  photo: '&#9632;',
  document: '&#9776;',
  screenshot: '&#9635;'
};

class AgoraOutcomesTracker {
  constructor() {
    this.container = document.getElementById('view-track-outcomes');
    this.slot = document.getElementById('track-incident-slot');
    this.activeIncidentId = null;
    this.activeTab = 'evidence';
    // The screen opens on the index (a recency-sorted list of reports) and
    // drops into a single record only when one is picked.
    this.mode = 'index';
    this.listQuery = '';
    this.listSort = 'recent';
    this.init();
  }

  init() {
    if (!this.slot) return;
    this.attachListeners();
  }

  /**
   * Public entry point — app.js calls this on every switch to the view.
   * With a record id (the "Track" action on a report) it opens that record;
   * without one it shows the default index of recent reports.
   */
  open(incidentId) {
    if (incidentId) {
      this.openIncident(incidentId);
    } else {
      this.openIndex();
    }
  }

  openIncident(incidentId) {
    this.mode = 'detail';
    this.activeIncidentId = incidentId || this.defaultIncidentId();
    this.activeTab = 'evidence';
    this.render();
  }

  openIndex() {
    this.mode = 'index';
    this.activeIncidentId = null;
    this.renderIndex();
  }

  defaultIncidentId() {
    // Prefer a record that actually has a documented track.
    const tracked = Object.keys(AGORA_DATA.incidentTracks || {});
    return tracked[0] || (AGORA_DATA.incidents[0] && AGORA_DATA.incidents[0].id);
  }

  incident() {
    const id = this.activeIncidentId || this.defaultIncidentId();
    return AGORA_DATA.incidents.find(i => i.id === id) || AGORA_DATA.incidents[0];
  }

  /**
   * Guarantees the shape every render site assumes.
   *
   * The published snapshot and the bundled dataset don't carry identical
   * tracks — a record imported mid-migration may have stages but no evidence
   * list, for instance. Normalising once here means the timeline, the summary
   * panel and the three tabs can all read these without ten separate guards,
   * and a missing array renders as empty instead of throwing.
   */
  normaliseTrack(raw) {
    if (!raw) return null;

    return {
      ...raw,
      stages: raw.stages ?? [],
      sources: raw.sources ?? [],
      evidence: raw.evidence ?? [],
      legalDocs: raw.legalDocs ?? [],
      currentStatus: raw.currentStatus ?? null
    };
  }

  track() {
    const inc = this.incident();
    return this.normaliseTrack((AGORA_DATA.incidentTracks || {})[inc.id]);
  }

  location() {
    const inc = this.incident();
    return AGORA_DATA.locations[inc.locationId] || {};
  }

  /* --------------------------------------------------------------------
     Index — default state: recent reports, searchable and sortable
     -------------------------------------------------------------------- */

  escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Record dates are written for people ("25 Feb 2023 · 13:10 WAT"), so they
   * need parsing before they can be ordered. Anything unparseable sorts last
   * rather than throwing the whole list off.
   */
  parseRecordDate(value) {
    if (!value) return 0;
    const text = String(value);
    const date = text.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
    if (!date) return 0;

    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = months.indexOf(date[2].slice(0, 3).toLowerCase());
    if (month < 0) return 0;

    let stamp = Date.UTC(Number(date[3]), month, Number(date[1]));

    // The 24-hour WAT stamp only refines ordering within a single day.
    const time = text.match(/(\d{1,2}):(\d{2})/);
    if (time) stamp += (Number(time[1]) * 3600 + Number(time[2]) * 60) * 1000;

    return stamp;
  }

  /** Every incident, paired with whatever tracking record exists for it. */
  indexRecords() {
    return (AGORA_DATA.incidents || []).map(inc => {
      const track = (AGORA_DATA.incidentTracks || {})[inc.id] || null;
      const loc = AGORA_DATA.locations[inc.locationId] || {};

      return {
        inc,
        track: this.normaliseTrack(track),
        loc,
        reportedAt: this.parseRecordDate(inc.watTimestamp || inc.timestamp),
        updatedAt: track ? this.parseRecordDate(track.lastUpdated) : 0
      };
    });
  }

  filterIndexRecords(records) {
    const query = this.listQuery.trim().toLowerCase();
    if (!query) return records;

    return records.filter(({ inc, loc, track }) => {
      const haystack = [
        inc.caseRef, inc.shortTitle, inc.title, inc.summary, inc.category,
        inc.locationCode, inc.precinctArea, inc.badgeType,
        loc.lga, loc.state,
        track && track.currentStatus ? track.currentStatus.label : '',
        track ? track.externalRef : ''
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  sortIndexRecords(records) {
    const sorted = [...records];

    if (this.listSort === 'oldest') {
      sorted.sort((a, b) => a.reportedAt - b.reportedAt);
    } else if (this.listSort === 'updated') {
      // Untracked records have no update to order by, so they fall in behind
      // the tracked ones, still newest-report-first among themselves.
      sorted.sort((a, b) => (b.updatedAt - a.updatedAt) || (b.reportedAt - a.reportedAt));
    } else {
      sorted.sort((a, b) => b.reportedAt - a.reportedAt);
    }

    return sorted;
  }

  renderIndex() {
    if (!this.slot) return;

    const sortOptions = [
      ['recent', t('outcomes.sortRecent')],
      ['updated', t('outcomes.sortUpdated')],
      ['oldest', t('outcomes.sortOldest')]
    ];

    this.slot.innerHTML = `
      <div class="track-index">
        <div class="track-index-head">
          <h2 class="track-index-title">${t('outcomes.title')}</h2>
          <div class="track-index-sub">
            ${t('outcomes.sub')}
          </div>
        </div>

        <div class="track-index-toolbar">
          <div class="track-search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input class="track-search-input" id="track-search-input" type="search"
              placeholder="${t('outcomes.search')}"
              aria-label="Search incident reports"
              value="${this.escapeHtml(this.listQuery)}">
          </div>

          <div class="track-sort">
            <label class="track-sort-label" for="track-sort-select">${t('outcomes.sortBy')}</label>
            <select class="form-control track-sort-select" id="track-sort-select">
              ${sortOptions.map(([value, label]) => `
                <option value="${value}" ${this.listSort === value ? 'selected' : ''}>${label}</option>
              `).join('')}
            </select>
          </div>

          <span class="track-index-count" id="track-index-count"></span>
        </div>

        <div class="track-index-list" id="track-index-results"></div>
      </div>
    `;

    this.renderIndexResults();
  }

  /**
   * Only the rows and the count redraw on search/sort — re-rendering the whole
   * index would tear the search field out from under the person typing in it.
   */
  renderIndexResults() {
    const list = document.getElementById('track-index-results');
    const count = document.getElementById('track-index-count');
    if (!list) return;

    const all = this.indexRecords();
    const matched = this.sortIndexRecords(this.filterIndexRecords(all));

    if (count) {
      count.textContent = matched.length === all.length
        ? `${all.length} ${t('outcomes.reports')}`
        : t('outcomes.reportsOf', { shown: matched.length, total: all.length });
    }

    if (matched.length === 0) {
      list.innerHTML = `
        <div class="track-index-empty">
          <div class="track-index-empty-title">${t('outcomes.noMatch')} &ldquo;${this.escapeHtml(this.listQuery.trim())}&rdquo;</div>
          <div class="track-index-empty-body">${t('outcomes.noMatchHint')}</div>
        </div>
      `;
      return;
    }

    list.innerHTML = matched.map(({ inc, track, loc }) => {
      // A track can exist with no documented status — the publisher derives it
      // from the last stage, and a record mid-import may have neither. Reading
      // it unguarded crashed the whole list, taking every other row with it.
      const current = track?.currentStatus;
      const status = current?.label
        ? `${current.label} <span class="track-index-stage-state">&mdash; ${current.state ?? 'Ongoing'}</span>`
        : t('outcomes.notProgressed');
      const updated = track
        ? t('outcomes.updated', { date: track.lastUpdated })
        : t('outcomes.noUpdate');
      const place = [loc.lga, loc.state].filter(Boolean).join(', ');

      return `
        <article class="track-index-row ${track ? '' : 'is-untracked'}" data-track-open="${inc.id}"
          role="button" tabindex="0" aria-label="Track ${inc.caseRef}">
          <div class="track-index-row-main">
            <div class="track-index-row-top">
              <span class="badge ${inc.badgeClass}">${inc.badgeType}</span>
              <!-- Where it happened and what kind of incident it was, rather
                   than a case number that means nothing at a glance. -->
              <span class="track-index-place">${place || inc.precinctArea || ''}</span>
              <span class="track-index-kind">${inc.category || ''}</span>
              <!-- Full stamp, not just the day: these reports share a polling
                   day, so the time is what makes the recency order legible. -->
              <span class="track-index-date">${inc.watTimestamp || inc.timestamp || ''}</span>
            </div>
            <h3 class="track-index-row-title">${inc.shortTitle || inc.title}</h3>
            <div class="track-index-row-meta">
              ${[inc.locationCode, inc.precinctArea, inc.caseRef].filter(Boolean).join(' &middot; ')}
            </div>
          </div>

          <div class="track-index-row-side">
            <span class="track-index-stage">${status}</span>
            <span class="track-index-updated">${updated}</span>
            <span class="track-index-cta">${t('table.track')} &rarr;</span>
          </div>
        </article>
      `;
    }).join('');
  }

  /* --------------------------------------------------------------------
     Rendering
     -------------------------------------------------------------------- */

  render() {
    if (!this.slot) return;
    const inc = this.incident();
    const track = this.track();

    if (!track) {
      this.slot.innerHTML = this.renderHeader(inc, null) + `
        <div class="track-empty">
          <div class="track-empty-title">No documented progression yet</div>
          <div class="track-empty-body">
            This incident has been recorded, but no review, referral, institutional
            response or legal development has been documented on the platform.
            No further public update has been documented.
          </div>
        </div>
      `;
      return;
    }

    this.slot.innerHTML =
      this.renderHeader(inc, track) +
      `<div class="track-body">
         ${this.renderSummaryPanel(inc, track)}
         <div class="track-main">
           ${this.renderTimeline(track)}
           ${this.renderTabs(track)}
         </div>
       </div>`;
  }

  renderHeader(inc, track) {
    const loc = this.location();
    const status = track?.currentStatus ?? null;
    const dateLabel = (inc.watTimestamp || '').split('·')[0].trim();

    return `
      <div class="track-header">
        <div class="track-header-main">
          <button class="track-back" id="track-back-btn" type="button">
            &larr; ${t('outcomes.back')}
          </button>
          <div class="track-ref">Incident ${inc.caseRef}</div>
          <h2 class="track-title">${inc.shortTitle || inc.title}</h2>
          <div class="track-meta">
            ${loc.lga || ''}, ${loc.state || ''} &middot; ${dateLabel}
            <span class="track-meta-sep">&middot;</span>
            ${AGORA_DATA.currentYear} ${inc.electoralContext || 'General Election'}
          </div>
        </div>

        ${status ? `
          <div class="track-status-block">
            <span class="track-status-label">CURRENT STATUS</span>
            <div class="track-status-value">
              ${status.label} <span class="track-status-state">&mdash; ${status.state}</span>
            </div>
            <div class="track-status-updated">Last updated: ${track.lastUpdated}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderSummaryPanel(inc, track) {
    const loc = this.location();
    const rows = [
      ['Incident ID', inc.caseRef],
      ['Incident date', (inc.watTimestamp || '').split('·')[0].trim()],
      ['Report date', track.reportedOn],
      ['Location', `${inc.precinctArea || ''}`],
      ['Polling unit', inc.locationCode],
      ['Election', `${AGORA_DATA.currentYear} ${inc.electoralContext || ''}`],
      ['Current status', track.currentStatus?.label
        ? `${track.currentStatus.label} — ${track.currentStatus.state ?? 'Ongoing'}`
        : '—'],
      ['Last updated', track.lastUpdated],
      ['Sources', `${track.sources?.length ?? 0}`],
      ['Evidence items', `${track.evidence?.length ?? 0}`],
      ['External reference', track.externalRef || '—']
    ];

    return `
      <aside class="track-summary">
        <div class="track-summary-title">Case Summary</div>
        <dl class="track-summary-list">
          ${rows.map(([k, v]) => `
            <div class="track-summary-row">
              <dt>${k}</dt>
              <dd>${v || '—'}</dd>
            </div>
          `).join('')}
        </dl>
      </aside>
    `;
  }

  renderTimeline(track) {
    const documented = new Map(track.stages.map(s => [s.key, s]));
    const currentIndex = TRACK_STAGE_ORDER.findIndex(s => s.key === track.currentStageKey);

    const items = TRACK_STAGE_ORDER.map((meta, idx) => {
      const stage = documented.get(meta.key);
      if (!stage) {
        // Only render an unrecorded placeholder for stages after the current
        // one, so the timeline never implies a skipped step was a failure.
        if (idx <= currentIndex) return '';
        return this.renderUnrecordedStage(meta);
      }
      const state = meta.key === track.currentStageKey ? 'current' : 'complete';
      return this.renderStage(meta, stage, state, track);
    }).join('');

    return `
      <section class="track-timeline-card">
        <div class="track-section-head">
          <h3 class="track-section-title">Incident Timeline</h3>
          <div class="track-section-sub">
            Chronological record of documented developments, from initial report to the latest outcome.
          </div>
        </div>
        <ol class="track-timeline">${items}</ol>
      </section>
    `;
  }

  renderStage(meta, stage, state, track) {
    const isCurrent = state === 'current';
    const evidence = (stage.evidenceIds || []).map(id => track.evidence.find(e => e.id === id)).filter(Boolean);
    const sources = (stage.sourceIds || []).map(id => track.sources.find(s => s.id === id)).filter(Boolean);
    const docs = (stage.legalDocIds || []).map(id => track.legalDocs.find(d => d.id === id)).filter(Boolean);

    return `
      <li class="track-stage is-${state}" data-stage="${meta.key}">
        <div class="track-stage-marker" aria-hidden="true"></div>
        <div class="track-stage-card">

          <div class="track-stage-top">
            <div class="track-stage-heading">
              <span class="track-stage-num">${meta.num}</span>
              <span class="track-stage-label">${meta.label}</span>
              ${stage.verifiedByPlatform ? '<span class="badge track-badge-verified">Verified by Agora Lens</span>' : ''}
              ${isCurrent ? '<span class="badge track-badge-current">Current stage</span>' : ''}
            </div>
            <time class="track-stage-date">${stage.date}</time>
          </div>

          <div class="track-stage-actor">${stage.actor}</div>
          <p class="track-stage-desc">${stage.description}</p>

          ${stage.verifiedByPlatform ? `
            <p class="track-verify-note">
              Platform verification reflects corroboration of available evidence. It is not
              an official government or legal determination.
            </p>
          ` : ''}

          ${stage.disputed ? `
            <div class="track-flag track-flag--disputed">
              <div class="track-flag-title">Disputed information</div>
              <div class="track-flag-body">${stage.disputeNote}</div>
            </div>
          ` : ''}

          ${isCurrent ? this.renderCurrentDetail(stage, track) : ''}

          ${stage.reference ? `
            <div class="track-kv"><span>Reference</span><strong>${stage.reference}</strong></div>
          ` : ''}
          ${stage.statusText ? `
            <div class="track-kv"><span>Status</span><strong>${stage.statusText}</strong></div>
          ` : ''}

          ${evidence.length ? `
            <div class="track-chips">
              <span class="track-chips-label">Evidence</span>
              ${evidence.map(e => `<span class="track-chip">${TRACK_EVIDENCE_ICONS[e.kind] || ''} ${e.label}</span>`).join('')}
            </div>
          ` : ''}

          ${docs.length ? `
            <div class="track-chips">
              <span class="track-chips-label">Documents</span>
              ${docs.map(d => `<span class="track-chip">${d.label}</span>`).join('')}
            </div>
          ` : ''}

          <div class="track-stage-foot">
            <div class="track-sources-inline">
              ${sources.map(s => `
                <span class="track-source-tag ${sourceType(s.type).cls}">
                  ${sourceType(s.type).label}
                </span><span class="track-source-name">${s.name ?? 'Unattributed'}</span>
              `).join('')}
            </div>
            <button class="track-details-btn" type="button" data-stage-details="${meta.key}">
              View details &rarr;
            </button>
          </div>

        </div>
      </li>
    `;
  }

  // The current stage carries an expanded panel with the latest information.
  renderCurrentDetail(stage, track) {
    const updates = stage.hearings || stage.updates || [];
    const latest = updates.length ? updates[updates.length - 1] : null;

    return `
      <div class="track-current-detail">
        ${stage.filedOn ? `<div class="track-kv"><span>Filed</span><strong>${stage.filedOn}</strong></div>` : ''}
        ${updates.length ? `
          <div class="track-updates-label">Procedural developments</div>
          <ul class="track-updates">
            ${updates.map(u => `<li><time>${u.date}</time><span>${u.text}</span></li>`).join('')}
          </ul>
        ` : ''}
        <div class="track-flag track-flag--ongoing">
          <div class="track-flag-title">Ongoing</div>
          <div class="track-flag-body">
            The latest documented development occurred on ${latest ? latest.date : track.lastUpdated}.
            No further public update has been documented.
          </div>
        </div>
      </div>
    `;
  }

  renderUnrecordedStage(meta) {
    return `
      <li class="track-stage is-unrecorded" data-stage="${meta.key}">
        <div class="track-stage-marker" aria-hidden="true"></div>
        <div class="track-stage-card">
          <div class="track-stage-top">
            <div class="track-stage-heading">
              <span class="track-stage-num">${meta.num}</span>
              <span class="track-stage-label">${meta.label}</span>
            </div>
          </div>
          <p class="track-stage-desc track-stage-desc--muted">
            No further public update has been documented.
          </p>
        </div>
      </li>
    `;
  }

  renderTabs(track) {
    const tabs = [
      ['evidence', 'Evidence', track.evidence.length],
      ['sources', 'Sources', track.sources.length],
      ['legal', 'Legal Documents', track.legalDocs.length]
    ];

    return `
      <section class="track-tabs-card">
        <div class="track-tablist" role="tablist">
          ${tabs.map(([key, label, count]) => `
            <button class="track-tab ${this.activeTab === key ? 'active' : ''}" role="tab"
              aria-selected="${this.activeTab === key}" data-track-tab="${key}" type="button">
              ${label} <span class="track-tab-count">${count}</span>
            </button>
          `).join('')}
        </div>
        <div class="track-tabpanel">${this.renderTabPanel(track)}</div>
      </section>
    `;
  }

  renderTabPanel(track) {
    if (this.activeTab === 'sources') {
      return `
        <table class="styled-table track-table">
          <thead><tr><th>Type</th><th>Source</th><th>Detail</th><th>Date</th><th></th></tr></thead>
          <tbody>
            ${track.sources.map(s => `
              <tr>
                <td><span class="track-source-tag ${sourceType(s.type).cls}">${sourceType(s.type).label}</span></td>
                <td class="track-td-strong">${s.name ?? 'Unattributed'}</td>
                <td>${s.detail ?? '—'}</td>
                <td class="track-td-muted">${s.date ?? '—'}</td>
                <td class="track-td-action"><button class="track-details-btn" type="button">View details &rarr;</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    if (this.activeTab === 'legal') {
      if (!track.legalDocs.length) {
        return '<div class="track-empty-inline">No further public update has been documented.</div>';
      }
      return `
        <table class="styled-table track-table">
          <thead><tr><th>Document</th><th>Type</th><th>Court / Tribunal</th><th>Filed</th><th></th></tr></thead>
          <tbody>
            ${track.legalDocs.map(d => `
              <tr>
                <td class="track-td-strong">${d.label}</td>
                <td>${d.kind}</td>
                <td>${d.court}</td>
                <td class="track-td-muted">${d.filed}</td>
                <td class="track-td-action"><button class="track-details-btn" type="button">View details &rarr;</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    return `
      <div class="track-evidence-grid">
        ${track.evidence.map(e => `
          <div class="track-evidence-card">
            <div class="track-evidence-kind">${TRACK_EVIDENCE_ICONS[e.kind] || ''} ${e.kind}</div>
            <div class="track-evidence-label">${e.label}</div>
            <div class="track-evidence-meta">${e.origin} &middot; ${e.captured}</div>
            <div class="track-evidence-foot">
              <span class="${e.verified ? 'track-ev-verified' : 'track-ev-unverified'}">
                ${e.verified ? 'Verified by Agora Lens' : 'Not independently verified'}
              </span>
              <button class="track-details-btn" type="button">View details &rarr;</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /* --------------------------------------------------------------------
     Interaction
     -------------------------------------------------------------------- */

  attachListeners() {
    this.slot.addEventListener('input', (e) => {
      if (e.target.id === 'track-search-input') {
        this.listQuery = e.target.value;
        this.renderIndexResults();
      }
    });

    this.slot.addEventListener('change', (e) => {
      if (e.target.id === 'track-sort-select') {
        this.listSort = e.target.value;
        this.renderIndexResults();
      }
    });

    // Index rows are buttons, so they answer to the keyboard as well as the mouse.
    this.slot.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const row = e.target.closest('[data-track-open]');
      if (!row) return;
      e.preventDefault();
      this.openIncident(row.getAttribute('data-track-open'));
    });

    this.slot.addEventListener('click', (e) => {
      const row = e.target.closest('[data-track-open]');
      if (row) {
        this.openIncident(row.getAttribute('data-track-open'));
        return;
      }

      const tab = e.target.closest('[data-track-tab]');
      if (tab) {
        this.activeTab = tab.getAttribute('data-track-tab');
        this.render();
        return;
      }

      if (e.target.closest('#track-back-btn')) {
        this.openIndex();
        return;
      }

      const details = e.target.closest('[data-stage-details]');
      if (details) {
        // Reuses the existing case inspector rather than adding a second modal.
        window.agoraIncidents?.openIncidentCase(this.incident().id);
      }
    });
  }
}
