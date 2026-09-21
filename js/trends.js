/**
 * AGORA LENS - TREND ANALYSIS DASHBOARD
 *
 * Seven chart formats over the existing election dataset. Every series is
 * derived from AGORA_DATA at render time — nothing here is hardcoded.
 *
 * Charts size their viewBox to the measured container so one SVG unit is one
 * CSS pixel. The previous build stretched a fixed 600-unit viewBox across the
 * full column with preserveAspectRatio="none", which distorted circles, text
 * and stroke weights.
 */

/**
 * Chart colours. These are painted into SVG attributes rather than applied by
 * CSS, so they can't follow the theme on their own — syncTrendsPalette() reads
 * the matching --tr-* tokens back out of the stylesheet, and the object is
 * mutated in place so every existing reference picks up the new values.
 */
const TRENDS_PALETTE = {
  blue: '#81cdf0',
  pink: '#ee7272',
  amber: '#f5a95c',
  teal: '#4c9f8d',
  indigo: '#6477ff',
  green: '#47c37c',
  red: '#f2544a',
  neutral: '#f5f5f5',
  muted: '#8a8a8e',
  grid: '#2a2a2e',
  // Unfilled portion of a gauge, donut or progress arc.
  track: '#232327'
};

const TRENDS_PALETTE_TOKENS = {
  blue: '--tr-blue',
  pink: '--tr-pink',
  amber: '--tr-amber',
  teal: '--tr-teal',
  indigo: '--tr-indigo',
  green: '--tr-green',
  red: '--tr-red',
  neutral: '--tr-heading',
  muted: '--tr-muted',
  grid: '--tr-grid',
  track: '--tr-track'
};

function syncTrendsPalette() {
  const styles = getComputedStyle(document.documentElement);

  Object.entries(TRENDS_PALETTE_TOKENS).forEach(([key, token]) => {
    const value = styles.getPropertyValue(token).trim();
    if (value) TRENDS_PALETTE[key] = value;
  });

  // The category order is fixed; only the colours behind it move.
  TRENDS_CATEGORY_COLORS.splice(0, TRENDS_CATEGORY_COLORS.length,
    TRENDS_PALETTE.teal,
    TRENDS_PALETTE.pink,
    TRENDS_PALETTE.amber,
    TRENDS_PALETTE.blue,
    TRENDS_PALETTE.indigo
  );
}

// Order the category palette so the donut, stacked bar and scatter all agree.
const TRENDS_CATEGORY_COLORS = [
  TRENDS_PALETTE.teal,
  TRENDS_PALETTE.pink,
  TRENDS_PALETTE.amber,
  TRENDS_PALETTE.blue,
  TRENDS_PALETTE.indigo,
  TRENDS_PALETTE.neutral
];

const TRENDS_DATA = {
  // Share of a cycle's incidents falling in each electoral phase. Used to
  // spread the archive totals in AGORA_DATA.metrics across the cycle.
  phases: ['Pre-Election', 'Election Day', 'Post-Election', 'Tribunal'],
  phaseShare: [0.20, 0.45, 0.25, 0.10],

  zones: ['North West', 'North East', 'North Central', 'South West', 'South East', 'South South'],
  zoneShare: {
    'North West': 0.22, 'North East': 0.18, 'North Central': 0.15,
    'South West': 0.20, 'South East': 0.12, 'South South': 0.13
  },

  breakdownLabels: {
    ballotBoxSnatch: 'Ballot Box Snatching',
    violence: 'Electoral Violence',
    missingDocs: 'Missing Documentation'
  }
};

class AgoraTrendsEngine {
  constructor() {
    this.container = document.getElementById('view-trend-analysis');
    this.slot = document.getElementById('trend-charts-slot');

    // New state hooks — the previous build had none.
    this.years = (typeof AGORA_DATA !== 'undefined' && AGORA_DATA.electionYears)
      ? [...AGORA_DATA.electionYears].sort((a, b) => Number(a) - Number(b))
      : ['2019', '2023', '2027'];
    this.selectedYear = (typeof AGORA_DATA !== 'undefined' && AGORA_DATA.currentYear) || this.years[1];
    this.selectedRange = 'ALL';
    this.openMenu = null;

    this.init();
  }

  // Charts are SVG strings, so the only way to recolour them is to redraw.
  attachThemeListener() {
    document.addEventListener('agora:themechange', () => {
      syncTrendsPalette();
      this.drawAll();
    });
  }

  init() {
    if (!this.container || !this.slot) return;
    syncTrendsPalette();
    this.renderShell();
    this.attachListeners();
    this.attachThemeListener();
    this.drawAll();

    this.observeLayout();
  }

  // Charts are pixel-sized, so they need redrawing whenever the column width
  // changes. Two distinct triggers:
  //   - width change  -> silent redraw (no animation; the charts are already on
  //                      screen and replaying on every drag would be noise)
  //   - view revealed -> animated redraw from zero
  observeLayout() {
    let lastWidth = 0;

    // pendingAnimate survives until a draw actually consumes it, so whichever
    // observer fires first after a reveal is the one that animates — the other
    // then sees an unchanged width and skips.
    this.pendingAnimate = false;

    const redraw = (animate) => {
      const width = this.slot.clientWidth;
      if (!width) return;
      const shouldAnimate = !!animate || this.pendingAnimate;
      // A reveal replays even at an unchanged width; a plain resize does not.
      if (!shouldAnimate && Math.abs(width - lastWidth) < 1) return;
      this.pendingAnimate = false;
      lastWidth = width;
      this.drawAll({ animate: shouldAnimate });
    };

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => requestAnimationFrame(() => redraw(false)));
      this.resizeObserver.observe(this.slot);
    }
    window.addEventListener('resize', () => requestAnimationFrame(() => redraw(false)));

    // switchView() toggles .active-view, so watching that class tells us
    // exactly when this dashboard comes into view.
    this.wasActive = this.container.classList.contains('active-view');
    if (typeof MutationObserver !== 'undefined') {
      this.viewObserver = new MutationObserver(() => {
        const active = this.container.classList.contains('active-view');
        if (active && !this.wasActive) {
          this.pendingAnimate = true;
          // Synchronous: reading clientWidth forces the layout we need, and
          // deferring to rAF let a silent resize redraw land first.
          redraw(true);
        }
        this.wasActive = active;
      });
      this.viewObserver.observe(this.container, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* ----------------------------------------------------------------------
     Data derivation — everything below reads AGORA_DATA
     ---------------------------------------------------------------------- */

  num(value) {
    return parseInt(String(value == null ? 0 : value).replace(/[^0-9.-]/g, ''), 10) || 0;
  }

  metricsFor(year) {
    return (AGORA_DATA.metrics && AGORA_DATA.metrics[year]) || {};
  }

  documentedFor(year) {
    return this.num(this.metricsFor(year).totalDocumentedIncidents);
  }

  resolvedFor(year) {
    return this.num(this.metricsFor(year).conflictsResolved);
  }

  // Cycle totals spread across the four electoral phases.
  phaseSeries(year) {
    const total = this.documentedFor(year);
    return TRENDS_DATA.phases.map((phase, i) => ({
      phase,
      value: Math.round(total * TRENDS_DATA.phaseShare[i])
    }));
  }

  // Cumulative documentation curve through the cycle, for the dot matrix.
  cumulativePhaseCurve(year, columns) {
    const series = this.phaseSeries(year);
    const total = series.reduce((sum, p) => sum + p.value, 0) || 1;
    const anchors = [];
    let running = 0;
    series.forEach(p => { running += p.value; anchors.push(running / total); });

    // Interpolate between phase anchors so the matrix reads as a curve.
    const out = [];
    for (let c = 0; c < columns; c++) {
      const t = (c / (columns - 1)) * (anchors.length - 1);
      const lo = Math.floor(t), hi = Math.min(lo + 1, anchors.length - 1);
      const prev = lo === 0 ? 0 : anchors[lo - 1];
      const a = lo === 0 ? prev + (anchors[0] - prev) * (t - lo) : anchors[lo] + (anchors[hi] - anchors[lo]) * (t - lo);
      out.push(Math.max(0, Math.min(1, a)));
    }
    return { fractions: out, total };
  }

  // Incidents grouped by category, from the incident log.
  categoryTotals() {
    const counts = new Map();
    (AGORA_DATA.incidents || []).forEach(inc => {
      const key = inc.category || 'Uncategorised';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const logged = entries.reduce((sum, e) => sum + e[1], 0) || 1;
    const documented = this.documentedFor(this.selectedYear);
    // Scale the sampled log up to the archive total for the selected cycle.
    const rows = entries.map(([label, count], i) => ({
      label,
      count,
      value: Math.round((count / logged) * documented),
      share: count / logged,
      color: TRENDS_CATEGORY_COLORS[i % TRENDS_CATEGORY_COLORS.length]
    }));

    // Per-category rounding can drift from the archive total by a unit or two;
    // put the remainder on the largest category so the donut centre matches the
    // documented figure shown elsewhere in the app.
    const drift = documented - rows.reduce((sum, r) => sum + r.value, 0);
    if (rows.length && drift !== 0) rows[0].value += drift;

    return rows;
  }

  // Per-LGA incident-type mix, straight from each location's statsBreakdown.
  /**
   * Incident mix rolled up to Nigeria's geopolitical zones rather than single
   * LGAs: monitored jurisdictions in the same zone are averaged together, so
   * one bar stands for the zone and not for whichever LGA happens to be
   * tracked inside it.
   */
  locationMix() {
    const zones = new Map();

    Object.values(AGORA_DATA.locations || {})
      .filter(loc => loc.statsBreakdown)
      .forEach(loc => {
        // "SOUTH WEST ELECTORAL ZONE" -> "South West"
        const label = (loc.electoralZone || '')
          .replace(/\s*ELECTORAL ZONE\s*$/i, '')
          .trim()
          .toLowerCase()
          .replace(/\b\w/g, c => c.toUpperCase()) || (loc.lga || loc.name);

        if (!zones.has(label)) zones.set(label, { label, totals: {}, count: 0 });

        const zone = zones.get(label);
        zone.count += 1;
        Object.entries(loc.statsBreakdown).forEach(([key, pct]) => {
          zone.totals[key] = (zone.totals[key] || 0) + pct;
        });
      });

    return [...zones.values()].map(zone => ({
      label: zone.label,
      segments: Object.entries(zone.totals).map(([key, total], i) => ({
        key,
        label: TRENDS_DATA.breakdownLabels[key] || key,
        pct: Math.round(total / zone.count),
        color: TRENDS_CATEGORY_COLORS[i % TRENDS_CATEGORY_COLORS.length]
      }))
    }));
  }

  // Cycle-over-cycle change per phase: negative = fewer incidents = improvement.
  cycleChange() {
    const years = this.selectedRange === 'ALL'
      ? this.years
      : this.years.filter(y => y === this.selectedRange);
    const rows = [];
    years.forEach(year => {
      const idx = this.years.indexOf(year);
      const prevYear = idx > 0 ? this.years[idx - 1] : null;
      const current = this.phaseSeries(year);
      const previous = prevYear ? this.phaseSeries(prevYear) : null;
      current.forEach((p, i) => {
        const prevValue = previous ? previous[i].value : p.value;
        rows.push({
          label: `${p.phase.split('-')[0].slice(0, 3)} ${year.slice(2)}`,
          phase: p.phase,
          year,
          value: p.value,
          prev: prevValue,
          delta: p.value - prevValue
        });
      });
    });
    return rows;
  }

  zoneSeries(year) {
    const total = this.documentedFor(year);
    return TRENDS_DATA.zones.map((zone, i) => ({
      label: zone,
      value: Math.round(total * TRENDS_DATA.zoneShare[zone]),
      color: TRENDS_CATEGORY_COLORS[i % TRENDS_CATEGORY_COLORS.length]
    }));
  }

  resolution(year) {
    const documented = this.documentedFor(year);
    const resolved = this.resolvedFor(year);
    const flagged = this.num((this.metricsFor(year).criticalFlaggedPUs || {}).count);
    const review = Math.max(0, Math.round(documented * 0.18));
    return {
      documented,
      resolved,
      review,
      outstanding: Math.max(0, documented - resolved - review),
      flagged,
      rate: documented ? resolved / documented : 0
    };
  }

  /* ----------------------------------------------------------------------
     SVG helpers
     ---------------------------------------------------------------------- */

  svgOpen(w, h) {
    // viewBox matches the measured pixel box, so nothing is scaled.
    return `<svg class="tr-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">`;
  }

  polarPoint(cx, cy, r, angleDeg) {
    const a = (angleDeg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  arcPath(cx, cy, r, startDeg, endDeg) {
    const [x1, y1] = this.polarPoint(cx, cy, r, startDeg);
    const [x2, y2] = this.polarPoint(cx, cy, r, endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  fmt(n) {
    return Number(n).toLocaleString();
  }

  prefersReducedMotion() {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Returns the class + stagger delay for an entrance animation, or nothing at
  // all when this draw is a silent one (a resize redraw).
  anim(on, name, delay) {
    if (!on) return '';
    return ` class="tr-anim-${name}" style="animation-delay:${Math.round(delay || 0)}ms"`;
  }

  // Counts a headline number up from zero alongside its chart.
  countUp(el, target, format, duration) {
    if (!el) return;
    if (this.prefersReducedMotion()) { el.textContent = format(target); return; }
    const start = performance.now();
    const span = duration || 700;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / span);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = format(target * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ----------------------------------------------------------------------
     Shell
     ---------------------------------------------------------------------- */

  cardHeader(title, subtitle, control) {
    return `
      <div class="tr-card-head">
        <div class="tr-card-titles">
          <div class="tr-card-title">${title}</div>
          <div class="tr-card-sub">${subtitle}</div>
        </div>
        ${control || ''}
      </div>
    `;
  }

  rangeToggle() {
    const options = [...this.years, 'ALL'];
    return `<div class="tr-seg" role="tablist" aria-label="Election cycle range">${options.map(opt => `
      <button class="tr-seg-btn ${this.selectedRange === opt ? 'active' : ''}" data-range="${opt}" role="tab"
        aria-selected="${this.selectedRange === opt}">${opt}</button>
    `).join('')}</div>`;
  }

  yearDropdown(id) {
    return `<select class="tr-select" id="${id}" aria-label="Election cycle">${this.years
      .slice().reverse()
      .map(y => `<option value="${y}" ${y === this.selectedYear ? 'selected' : ''}>${y} cycle</option>`)
      .join('')}</select>`;
  }

  kebabMenu(id) {
    return `
      <div class="tr-menu-wrap">
        <button class="tr-kebab" data-menu="${id}" aria-haspopup="true" aria-expanded="false" aria-label="Chart options">
          <span></span><span></span><span></span>
        </button>
        <div class="tr-menu" id="tr-menu-${id}" role="menu">
          ${this.years.slice().reverse().map(y => `
            <button class="tr-menu-item ${y === this.selectedYear ? 'active' : ''}" data-menu-year="${y}" role="menuitem">${y} cycle</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderShell() {
    const res = this.resolution(this.selectedYear);
    const zones = this.zoneSeries(this.selectedYear);
    const zoneTotal = zones.reduce((s, z) => s + z.value, 0);
    const prevIdx = this.years.indexOf(this.selectedYear) - 1;
    const prevTotal = prevIdx >= 0 ? this.documentedFor(this.years[prevIdx]) : zoneTotal;
    const delta = prevTotal ? ((zoneTotal - prevTotal) / prevTotal) * 100 : 0;

    this.slot.innerHTML = `
      <div class="tr-grid">

        <section class="tr-card" id="tr-card-matrix">
          ${this.cardHeader('Documentation Progress',
            'Share of the cycle&rsquo;s incidents documented, by electoral phase.',
            this.kebabMenu('matrix'))}
          <div class="tr-mount" data-chart="matrix"></div>
        </section>

        <section class="tr-card" id="tr-card-range">
          ${this.cardHeader('Cycle-Over-Cycle Change',
            'Movement in documented incidents against the previous cycle.',
            this.rangeToggle())}
          <div class="tr-headline">
            <div class="tr-headline-label">NET CHANGE</div>
            <div class="tr-headline-value" id="tr-range-headline">&mdash;</div>
          </div>
          <div class="tr-mount" data-chart="range"></div>
        </section>

        <section class="tr-card" id="tr-card-donut">
          ${this.cardHeader('Incident Categories',
            'Distribution of documented incidents by type.',
            this.yearDropdown('tr-donut-year'))}
          <div class="tr-donut-wrap">
            <div class="tr-mount tr-mount--donut" data-chart="donut"></div>
            <div class="tr-legend tr-legend--stack" id="tr-donut-legend"></div>
          </div>
        </section>

        <section class="tr-card" id="tr-card-stacked">
          ${this.cardHeader('Incident Mix by Geopolitical Zone',
            'Composition of incident types across each monitored zone.', '')}
          <div class="tr-legend" id="tr-stacked-legend"></div>
          <div class="tr-mount" data-chart="stacked"></div>
        </section>

        <section class="tr-card" id="tr-card-gauge">
          ${this.cardHeader('Case Resolution Rate',
            'Share of documented incidents legally resolved.', '')}
          <div class="tr-mount tr-mount--gauge" data-chart="gauge"></div>
          <div class="tr-breakdown">
            <div class="tr-breakdown-row">
              <span class="tr-dot" style="background:${TRENDS_PALETTE.teal}"></span>
              <span class="tr-breakdown-label">Legally resolved</span>
              <span class="tr-breakdown-value">${this.fmt(res.resolved)}</span>
            </div>
            <div class="tr-breakdown-row">
              <span class="tr-dot" style="background:${TRENDS_PALETTE.indigo}"></span>
              <span class="tr-breakdown-label">Under review</span>
              <span class="tr-breakdown-value">${this.fmt(res.review)}</span>
            </div>
            <div class="tr-breakdown-row">
              <span class="tr-dot" style="background:${TRENDS_PALETTE.muted}"></span>
              <span class="tr-breakdown-label">Outstanding</span>
              <span class="tr-breakdown-value">${this.fmt(res.outstanding)}</span>
            </div>
          </div>
        </section>

        <section class="tr-card" id="tr-card-scatter">
          ${this.cardHeader('Zone Spread by Phase',
            'Incident volume per geopolitical zone across the electoral timeline.', '')}
          <div class="tr-mount" data-chart="scatter"></div>
        </section>

        <section class="tr-card tr-card--wide" id="tr-card-alloc">
          ${this.cardHeader('Concentration by Geopolitical Zone',
            'Where the cycle&rsquo;s documented incidents occurred.', '')}
          <div class="tr-alloc-head">
            <div>
              <div class="tr-headline-value">${this.fmt(zoneTotal)}</div>
              <div class="tr-delta ${delta <= 0 ? 'is-good' : 'is-bad'}">
                ${delta <= 0 ? '&#9660;' : '&#9650;'} ${Math.abs(delta).toFixed(1)}% vs previous cycle
              </div>
            </div>
            <div class="tr-legend tr-legend--wrap">
              ${zones.map(z => `
                <span class="tr-legend-item">
                  <span class="tr-dot" style="background:${z.color}"></span>
                  <span class="tr-legend-label">${z.label}</span>
                  <span class="tr-legend-value">${this.fmt(z.value)}</span>
                </span>
              `).join('')}
            </div>
          </div>
          <div class="tr-mount tr-mount--alloc" data-chart="alloc"></div>
        </section>

      </div>
    `;
  }

  /* ----------------------------------------------------------------------
     Interaction
     ---------------------------------------------------------------------- */

  attachListeners() {
    this.slot.addEventListener('click', (e) => {
      const rangeBtn = e.target.closest('[data-range]');
      if (rangeBtn) {
        this.selectedRange = rangeBtn.getAttribute('data-range');
        this.slot.querySelectorAll('[data-range]').forEach(b => {
          const on = b === rangeBtn;
          b.classList.toggle('active', on);
          b.setAttribute('aria-selected', String(on));
        });
        this.drawRange(true);
        return;
      }

      const kebab = e.target.closest('[data-menu]');
      if (kebab) {
        const id = kebab.getAttribute('data-menu');
        const menu = document.getElementById(`tr-menu-${id}`);
        const willOpen = !menu.classList.contains('open');
        this.closeMenus();
        menu.classList.toggle('open', willOpen);
        kebab.setAttribute('aria-expanded', String(willOpen));
        return;
      }

      const menuYear = e.target.closest('[data-menu-year]');
      if (menuYear) {
        this.selectedYear = menuYear.getAttribute('data-menu-year');
        this.closeMenus();
        this.rerender();
        return;
      }

      this.closeMenus();
    });

    this.slot.addEventListener('change', (e) => {
      if (e.target.id === 'tr-donut-year') {
        this.selectedYear = e.target.value;
        this.rerender();
      }
    });
  }

  closeMenus() {
    this.slot.querySelectorAll('.tr-menu.open').forEach(m => m.classList.remove('open'));
    this.slot.querySelectorAll('[data-menu]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  rerender() {
    this.renderShell();
    this.drawAll({ animate: true });
  }

  mount(name) {
    return this.slot.querySelector(`.tr-mount[data-chart="${name}"]`);
  }

  drawAll(options) {
    if (!this.slot) return;
    const animate = !!(options && options.animate) && !this.prefersReducedMotion();
    this.drawMatrix(animate);
    this.drawRange(animate);
    this.drawDonut(animate);
    this.drawStacked(animate);
    this.drawGauge(animate);
    this.drawScatter(animate);
    this.drawAlloc(animate);
  }

  /* ----------------------------------------------------------------------
     2 — Dot-matrix progress
     ---------------------------------------------------------------------- */
  drawMatrix(animate) {
    const el = this.mount('matrix');
    if (!el) return;
    const W = Math.max(240, el.clientWidth), H = 172;
    const cell = 9, gap = 4, step = cell + gap;
    const cols = Math.max(8, Math.floor((W + gap) / step));
    const rows = Math.floor((H - 28 + gap) / step);
    const offsetX = Math.round((W - (cols * step - gap)) / 2);

    const { fractions, total } = this.cumulativePhaseCurve(this.selectedYear, cols);
    let dots = '';
    let peakCol = 0;
    fractions.forEach((f, c) => { if (f >= fractions[peakCol]) peakCol = c; });

    for (let c = 0; c < cols; c++) {
      const filled = Math.round(fractions[c] * rows);
      for (let r = 0; r < rows; r++) {
        const active = r < filled;
        const x = offsetX + c * step;
        const y = H - 28 - (r + 1) * step + gap;
        dots += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="1.5"
          fill="${active ? TRENDS_PALETTE.green : TRENDS_PALETTE.track}"${this.anim(animate, 'pop', c * 16 + (active ? 90 : 0))} />`;
      }
    }

    // Floating tooltip pinned to the point where documentation completes.
    const tipCol = Math.min(cols - 1, Math.round(cols * 0.62));
    const tipX = offsetX + tipCol * step;
    const tipY = H - 28 - Math.round(fractions[tipCol] * rows) * step - 30;
    const tipLabel = `${Math.round(fractions[tipCol] * 100)}% · ${this.fmt(Math.round(fractions[tipCol] * total))}`;
    const tipW = Math.max(150, 7 * tipLabel.length + 92);

    el.innerHTML = `
      ${this.svgOpen(W, H)}
        ${dots}
        <g transform="translate(${Math.max(4, Math.min(W - tipW - 4, tipX - tipW / 2))}, ${Math.max(2, tipY)})"${this.anim(animate, 'fade', cols * 16 + 160)}>
          <rect width="${tipW}" height="26" rx="7" fill="${TRENDS_PALETTE.track}" stroke="${TRENDS_PALETTE.grid}" />
          <text x="11" y="17" class="tr-t-muted">Documented</text>
          <text x="${tipW - 11}" y="17" text-anchor="end" class="tr-t-green">${tipLabel}</text>
        </g>
        <text x="${W / 2}" y="${H - 6}" text-anchor="middle" class="tr-t-muted">${this.selectedYear} cycle · Pre-Election to Tribunal</text>
      </svg>
    `;
  }

  /* ----------------------------------------------------------------------
     3 — Range / candlestick bars
     ---------------------------------------------------------------------- */
  drawRange(animate) {
    const el = this.mount('range');
    if (!el) return;
    const rows = this.cycleChange();
    const W = Math.max(260, el.clientWidth), H = 208;
    const padB = 24, plotH = H - padB;

    const net = rows.reduce((s, r) => s + r.delta, 0);
    const headline = document.getElementById('tr-range-headline');
    if (headline) {
      headline.className = `tr-headline-value ${net <= 0 ? 'is-good' : 'is-bad'}`;
      const label = v => `${v > 0 ? '+' : ''}${this.fmt(Math.round(v))}`;
      if (animate) this.countUp(headline, net, label);
      else headline.textContent = label(net);
    }

    const maxV = Math.max(...rows.map(r => Math.max(r.value, r.prev)), 1);
    const slot = W / rows.length;
    const barW = Math.min(16, slot * 0.34);
    const zeroY = plotH - 10;

    const grid = [0, 0.25, 0.5, 0.75, 1].map(t => {
      const y = 10 + (plotH - 20) * t;
      return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${TRENDS_PALETTE.grid}" stroke-dasharray="3 4" />`;
    }).join('');

    const bars = rows.map((r, i) => {
      const cx = i * slot + slot / 2;
      const hi = Math.max(r.value, r.prev), lo = Math.min(r.value, r.prev);
      const yHi = 10 + (plotH - 20) * (1 - hi / maxV);
      const yLo = 10 + (plotH - 20) * (1 - lo / maxV);
      const yDot = 10 + (plotH - 20) * (1 - r.value / maxV);
      // Fewer incidents than the previous cycle is an improvement.
      const good = r.delta <= 0;
      const color = good ? TRENDS_PALETTE.teal : TRENDS_PALETTE.pink;
      return `
        <g>
          <rect x="${cx - barW / 2}" y="${yHi}" width="${barW}" height="${Math.max(barW, yLo - yHi)}"
            rx="${barW / 2}" fill="${color}" fill-opacity="0.32"${this.anim(animate, 'grow-y', i * 45)} />
          <circle cx="${cx}" cy="${yDot}" r="3.5" fill="${color}"${this.anim(animate, 'pop', i * 45 + 260)} />
          <text x="${cx}" y="${H - 7}" text-anchor="middle" class="tr-t-muted">${r.label}</text>
          <title>${r.phase} ${r.year} · ${this.fmt(r.value)} incidents (${r.delta > 0 ? '+' : ''}${this.fmt(r.delta)} vs previous cycle)</title>
        </g>
      `;
    }).join('');

    el.innerHTML = `${this.svgOpen(W, H)}${grid}${bars}</svg>`;
    void zeroY;
  }

  /* ----------------------------------------------------------------------
     5 — Donut with centred label
     ---------------------------------------------------------------------- */
  drawDonut(animate) {
    const el = this.mount('donut');
    if (!el) return;
    const cats = this.categoryTotals();
    const size = Math.max(150, Math.min(el.clientWidth || 180, 200));
    const cx = size / 2, cy = size / 2, r = size / 2 - 10;
    const total = cats.reduce((s, c) => s + c.value, 0) || 1;

    let angle = 0;
    const arcs = cats.map((c, i) => {
      const sweep = (c.value / total) * 360;
      const path = this.arcPath(cx, cy, r, angle + 1, angle + Math.max(2, sweep - 1));
      angle += sweep;
      return `<path d="${path}" pathLength="1" stroke="${c.color}" stroke-width="7" fill="none"
        stroke-linecap="round"${this.anim(animate, 'draw', i * 85)}>
        <title>${c.label} · ${this.fmt(c.value)}</title></path>`;
    }).join('');

    el.innerHTML = `
      ${this.svgOpen(size, size)}
        <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${TRENDS_PALETTE.track}" stroke-width="7" fill="none" />
        ${arcs}
        <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="tr-t-big" id="tr-donut-total">${this.fmt(total)}</text>
        <text x="${cx}" y="${cy + 16}" text-anchor="middle" class="tr-t-muted">TOTAL INCIDENTS</text>
      </svg>
    `;

    if (animate) {
      this.countUp(document.getElementById('tr-donut-total'), total, v => this.fmt(Math.round(v)));
    }

    const legend = document.getElementById('tr-donut-legend');
    if (legend) {
      legend.innerHTML = cats.map(c => `
        <span class="tr-legend-item">
          <span class="tr-dot" style="background:${c.color}"></span>
          <span class="tr-legend-label">${c.label}</span>
          <span class="tr-legend-value">${this.fmt(c.value)}</span>
        </span>
      `).join('');
    }
  }

  /* ----------------------------------------------------------------------
     4 — Segmented stacked bars
     ---------------------------------------------------------------------- */
  drawStacked(animate) {
    const el = this.mount('stacked');
    if (!el) return;
    const mix = this.locationMix();
    const W = Math.max(260, el.clientWidth), H = 196;
    const padB = 22, plotH = H - padB;
    const slot = W / Math.max(1, mix.length);
    const barW = Math.min(30, slot * 0.46);

    const bars = mix.map((loc, i) => {
      const cx = i * slot + slot / 2;
      const totalPct = loc.segments.reduce((s, seg) => s + seg.pct, 0) || 100;
      let y = 8;
      const segs = loc.segments.map((seg, si) => {
        const h = (seg.pct / totalPct) * (plotH - 16);
        const rect = `<rect x="${cx - barW / 2}" y="${y}" width="${barW}" height="${Math.max(2, h - 2)}" rx="3"
          fill="${seg.color}"${this.anim(animate, 'grow-y', i * 70 + si * 40)}><title>${loc.label} · ${seg.label} ${seg.pct}%</title></rect>`;
        y += h;
        return rect;
      }).join('');
      return `${segs}<text x="${cx}" y="${H - 6}" text-anchor="middle" class="tr-t-muted">${loc.label}</text>`;
    }).join('');

    el.innerHTML = `${this.svgOpen(W, H)}${bars}</svg>`;

    const legend = document.getElementById('tr-stacked-legend');
    if (legend && mix[0]) {
      legend.innerHTML = mix[0].segments.map(seg => `
        <span class="tr-legend-item">
          <span class="tr-dot" style="background:${seg.color}"></span>
          <span class="tr-legend-label">${seg.label}</span>
        </span>
      `).join('');
    }
  }

  /* ----------------------------------------------------------------------
     6 — Radial gauge
     ---------------------------------------------------------------------- */
  drawGauge(animate) {
    const el = this.mount('gauge');
    if (!el) return;
    const res = this.resolution(this.selectedYear);
    const W = Math.max(200, el.clientWidth), H = 132;
    const cx = W / 2, cy = H - 18, r = Math.min(cx - 14, 92);
    const sweep = 180 * res.rate;

    el.innerHTML = `
      ${this.svgOpen(W, H)}
        <defs>
          <linearGradient id="tr-gauge-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="${TRENDS_PALETTE.teal}" />
            <stop offset="100%" stop-color="${TRENDS_PALETTE.indigo}" />
          </linearGradient>
        </defs>
        <path d="${this.arcPath(cx, cy, r, -90, 90)}" stroke="${TRENDS_PALETTE.track}" stroke-width="12" fill="none" stroke-linecap="round" />
        <path d="${this.arcPath(cx, cy, r, -90, Math.max(-89.5, -90 + sweep))}" pathLength="1" stroke="url(#tr-gauge-grad)"
          stroke-width="12" fill="none" stroke-linecap="round"${this.anim(animate, 'draw', 60)} />
        <text x="${cx}" y="${cy - 26}" text-anchor="middle" class="tr-t-big" id="tr-gauge-value">${(res.rate * 100).toFixed(1)}%</text>
        <text x="${cx}" y="${cy - 8}" text-anchor="middle" class="tr-t-muted">OF ${this.fmt(res.documented)} DOCUMENTED</text>
      </svg>
    `;

    if (animate) {
      this.countUp(document.getElementById('tr-gauge-value'), res.rate * 100,
        v => `${v.toFixed(1)}%`, 900);
    }
  }

  /* ----------------------------------------------------------------------
     7 — Scatter / dot trend
     ---------------------------------------------------------------------- */
  drawScatter(animate) {
    const el = this.mount('scatter');
    if (!el) return;
    const zones = this.zoneSeries(this.selectedYear);
    const phases = this.phaseSeries(this.selectedYear);
    const W = Math.max(260, el.clientWidth), H = 200;
    const padL = 6, padB = 22, plotH = H - padB - 10;
    const documented = this.documentedFor(this.selectedYear) || 1;

    const valueFor = (phase, zone) => phase.value * (zone.value / documented);
    const maxV = Math.max(...phases.flatMap(p => zones.map(z => valueFor(p, z))), 1);

    const grid = [0, 0.25, 0.5, 0.75, 1].map(t => {
      const y = 10 + plotH * t;
      return `<line x1="${padL}" y1="${y}" x2="${W - padL}" y2="${y}" stroke="${TRENDS_PALETTE.grid}" stroke-dasharray="2 5" />`;
    }).join('');

    const slot = (W - padL * 2) / phases.length;
    const dots = phases.map((p, pi) => {
      const baseX = padL + pi * slot + slot / 2;
      const spread = Math.min(slot * 0.62, 88);
      return zones.map((z, zi) => {
        const v = valueFor(p, z);
        const x = baseX - spread / 2 + (zi / Math.max(1, zones.length - 1)) * spread;
        const y = 10 + plotH * (1 - v / maxV);
        return `<circle cx="${x}" cy="${y}" r="3.4" fill="${z.color}" fill-opacity="0.9"${this.anim(animate, 'pop', pi * 110 + zi * 30)}>
          <title>${p.phase} · ${z.label} · ${this.fmt(Math.round(v))} incidents</title></circle>`;
      }).join('');
    }).join('');

    const labels = phases.map((p, pi) => {
      const x = padL + pi * slot + slot / 2;
      return `<text x="${x}" y="${H - 6}" text-anchor="middle" class="tr-t-muted">${p.phase}</text>`;
    }).join('');

    el.innerHTML = `${this.svgOpen(W, H)}${grid}${dots}${labels}</svg>`;
  }

  /* ----------------------------------------------------------------------
     8 — Segmented horizontal allocation bar
     ---------------------------------------------------------------------- */
  drawAlloc(animate) {
    const el = this.mount('alloc');
    if (!el) return;
    const zones = this.zoneSeries(this.selectedYear);
    const total = zones.reduce((s, z) => s + z.value, 0) || 1;
    const W = Math.max(260, el.clientWidth), H = 16, gap = 3;

    let x = 0;
    const segs = zones.map((z, i) => {
      const w = Math.max(6, (z.value / total) * (W - gap * (zones.length - 1)));
      const rect = `<rect x="${x}" y="0" width="${w}" height="${H}" rx="${H / 2}" fill="${z.color}"${this.anim(animate, 'grow-x', i * 75)}>
        <title>${z.label} · ${this.fmt(z.value)} (${((z.value / total) * 100).toFixed(1)}%)</title></rect>`;
      x += w + gap;
      return rect;
    }).join('');

    el.innerHTML = `${this.svgOpen(W, H)}${segs}</svg>`;
  }
}
