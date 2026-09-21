/**
 * AGORA LENS - INTERACTIVE MAP ENGINE
 * Real OpenStreetMap of Nigeria (via Leaflet) with state boundaries, hotspot markers & a floating popover.
 * No API key required — tiles come from CARTO's free dark basemap, built on OpenStreetMap data.
 * Requires NIGERIA_STATES_GEOJSON (js/nigeria-states-geo.js) and the Leaflet <script>/<link> in index.html.
 */

const NIGERIA_CENTER = [9.082, 8.6753];
const NIGERIA_DEFAULT_ZOOM = 6.3;

// Fallback coordinates, used only when a location carries none of its own.
// The published snapshot supplies lat/lng per jurisdiction, so adding an area
// in the database puts it on the map without touching this file.
const LOCATION_COORDS = {
  'lagos-ikeja': [6.6018, 3.3515],
  'kano-municipal': [12.0022, 8.5920],
  'kaduna-north': [10.5222, 7.4383],
  'rivers-portharcourt': [4.8156, 7.0498],
  'fct-abuja': [9.0765, 7.3986]
};

// Maps each NIGERIA_STATES_GEOJSON "shapeName" to the location id it drives (only the 5 tracked hotspots)
const STATE_NAME_TO_LOCATION = {
  'Lagos': 'lagos-ikeja',
  'Kano': 'kano-municipal',
  'Kaduna': 'kaduna-north',
  'Rivers': 'rivers-portharcourt',
  'Abuja Federal Capital Territory': 'fct-abuja'
};


/** Where a jurisdiction sits: its own coordinates first, the table second. */
function coordsFor(locationId) {
  const loc = AGORA_DATA.locations?.[locationId];
  if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) return [loc.lat, loc.lng];
  return LOCATION_COORDS[locationId] || null;
}

class AgoraMapEngine {
  constructor() {
    this.mapContainer = document.getElementById('map-canvas-container');
    this.map = null;
    this.geoLayer = null;
    this.markers = [];
    this.userLocationMarker = null;
    this.popup = null;
    this.selectedLocationId = AGORA_DATA.selectedLocationId || 'lagos-ikeja';
    this.init();
  }

  init() {
    if (!this.mapContainer) return;
    if (!STADIA_API_KEY || STADIA_API_KEY === 'YOUR_STADIA_API_KEY') {
      this.renderNotice(
        'Stadia Maps API key needed',
        'Add your free key to <code>js/config.js</code> to load the live map — see the setup steps in the comment at the top of that file.'
      );
      return;
    }
    this.buildMap();
  }

  renderNotice(title, bodyHTML) {
    this.mapContainer.innerHTML = `
      <div class="map-key-notice">
        <div class="map-key-notice-title">${title}</div>
        <div class="map-key-notice-body">${bodyHTML}</div>
      </div>
    `;
  }

  handleTileError() {
    if (this.tileErrorHandled) return; // tileerror fires once per failed tile — only react once
    this.tileErrorHandled = true;
    this.map?.remove();
    this.map = null;
    this.renderNotice(
      "Couldn't load map tiles",
      'Check that the API key in <code>js/config.js</code> is valid and that this domain (including "localhost" while developing) is added as an allowed property in your Stadia Maps dashboard.'
    );
  }

  buildMap() {
    this.map = L.map(this.mapContainer, {
      center: NIGERIA_CENTER,
      zoom: NIGERIA_DEFAULT_ZOOM,
      minZoom: 5,
      maxZoom: 16,
      zoomControl: false
    });

    this.addTileLayer();

    this.geoLayer = L.geoJSON(NIGERIA_STATES_GEOJSON, {
      style: (feature) => this.getStateStyle(feature),
      onEachFeature: (feature, layer) => {
        layer.on('click', () => this.handleStateClick(feature));
        layer.on('mouseover', () => {
          if (feature.properties.shapeName !== this.selectedShapeName()) {
            layer.setStyle({
              fillColor: this.themeColor('--map-state-hover-fill'),
              color: this.themeColor('--map-state-hover-stroke')
            });
          }
        });
        layer.on('mouseout', () => this.geoLayer.resetStyle(layer));
      }
    }).addTo(this.map);

    this.attachThemeListener();

    this.renderMarkers();
    this.renderPopup();
    this.attachControls();
  }

  selectedShapeName() {
    return Object.keys(STATE_NAME_TO_LOCATION).find(name => STATE_NAME_TO_LOCATION[name] === this.selectedLocationId);
  }

  /* ----------------------------------------------------------------------
     Theming. Leaflet paints tiles and vector shapes itself, so unlike the rest
     of the app it can't be recoloured by CSS tokens alone — it reads them and
     redraws when the theme changes.
     ---------------------------------------------------------------------- */

  themeColor(token) {
    return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  }

  isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  addTileLayer() {
    // Real OpenStreetMap-based tiles via Stadia Maps (free tier, requires an
    // API key — see js/config.js). Unlike osm.org's own server, this is a host
    // that actually permits third-party app embedding. Light mode takes the
    // plain alidade_smooth style; dark mode its _dark counterpart.
    const style = this.isLightTheme() ? 'alidade_smooth' : 'alidade_smooth_dark';

    this.tileLayer = L.tileLayer(
      `https://tiles.stadiamaps.com/tiles/${style}/{z}/{x}/{y}{r}.png?api_key=${STADIA_API_KEY}`,
      {
        attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noopener">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
        maxZoom: 20
      }
    ).addTo(this.map).on('tileerror', () => this.handleTileError());
  }

  attachThemeListener() {
    document.addEventListener('agora:themechange', () => {
      if (!this.map) return;

      // Swap the basemap, then restyle the state shapes drawn over it.
      if (this.tileLayer) this.map.removeLayer(this.tileLayer);
      this.addTileLayer();

      this.geoLayer?.setStyle((feature) => this.getStateStyle(feature));
      this.renderMarkers();
      this.renderPopup();
    });
  }

  getStateStyle(feature) {
    const isActive = feature.properties.shapeName === this.selectedShapeName();
    return {
      // Selection is marked with an outline rather than a fill — filling the
      // state hid the basemap, place labels and the incident markers sitting
      // inside it.
      fillColor: this.themeColor('--map-state-fill'),
      fillOpacity: isActive ? 0.55 : 0.75,
      color: isActive ? this.themeColor('--map-state-stroke-active') : this.themeColor('--map-state-stroke'),
      weight: isActive ? 2.5 : 1
    };
  }

  handleStateClick(feature) {
    const locationId = STATE_NAME_TO_LOCATION[feature.properties.shapeName] || 'lagos-ikeja';
    this.selectLocation(locationId);
  }

  // Render clickable hot-spot markers (static — no pulsing animation)
  renderMarkers() {
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    // Every monitored jurisdiction, straight from the data. One colour for all
    // of them — with 30+ areas on a national view, tinting by severity turned
    // the south-west into one indistinct blob, and the ranked list beside the
    // map carries severity far more legibly than a dot can.
    //
    // Size carries volume instead. Scaled on the square root of the count so
    // the circle's AREA tracks the number of incidents: radius alone would make
    // a jurisdiction with four times the reports look sixteen times worse.
    const places = Object.values(AGORA_DATA.locations || {});
    const counts = places.map(l => l.incidentsCount ?? 0);
    const fewest = Math.min(...counts);
    const most = Math.max(...counts);
    const spread = Math.max(1, most - fewest);
    const markerColor = this.themeColor('--alert-red');

    // Scaled across the observed range rather than from zero. Monitored
    // jurisdictions carry broadly similar counts, so a zero-based scale — the
    // usual advice — compressed every marker into barely a pixel of each other
    // and encoded nothing at all. This stretches the actual spread instead.
    //
    // The trade-off is that the smallest marker means "fewest of these", not
    // "none": the exact figure is in the tooltip, and the ranked list beside
    // the map gives the real numbers.
    const radiusFor = (count) => 3.5 + 5 * (((count ?? 0) - fewest) / spread);

    places.forEach(loc => {
      const position = coordsFor(loc.id);
      if (!position) return;

      const marker = L.circleMarker(position, {
        radius: radiusFor(loc.incidentsCount),
        color: markerColor,
        weight: 1,
        fillColor: markerColor,
        fillOpacity: 0.8
      }).addTo(this.map);

      marker.bindTooltip(`${loc.lga || loc.name} · ${loc.incidentsCount ?? 0} documented`, {
        direction: 'top',
        offset: [0, -6]
      });
      marker.on('click', () => this.selectLocation(loc.id));
      this.markers.push(marker);
    });
  }

  // Render Floating Popover Tooltip, anchored to the selected location's real coordinates
  renderPopup() {
    if (this.popup) {
      this.map.closePopup(this.popup);
      this.popup = null;
    }

    const loc = AGORA_DATA.locations[this.selectedLocationId] || AGORA_DATA.locations['lagos-ikeja'];
    const coords = coordsFor(this.selectedLocationId) || coordsFor('lagos-ikeja');

    const html = `
      <div class="map-floating-popover animate-fade-in">
        <div class="popover-header">
          <div class="popover-location-title">
            <span class="popover-title-dot"></span>
            <span>${loc.name}</span>
          </div>
          <span class="popover-residents-badge">${loc.residentsCount}</span>
        </div>
        <div class="popover-zone-subtitle">${loc.electoralZone}</div>
        <div class="popover-narrative">${loc.summary}</div>

        <div class="popover-dist-bar">
          <div class="dist-segment-pink" style="width: ${loc.statsBreakdown.ballotBoxSnatch}%;"></div>
          <div class="dist-segment-blue" style="width: ${loc.statsBreakdown.violence}%;"></div>
          <div class="dist-segment-purple" style="width: ${loc.statsBreakdown.missingDocs}%;"></div>
        </div>

        <div class="popover-dist-legend">
          <div class="dist-legend-item">
            <span class="legend-dot-pink"></span>
            <span>Ballot Snatch</span>
            <span class="dist-legend-value">${loc.statsBreakdown.ballotBoxSnatch}%</span>
          </div>
          <div class="dist-legend-item">
            <span class="legend-dot-blue"></span>
            <span>Violence</span>
            <span class="dist-legend-value">${loc.statsBreakdown.violence}%</span>
          </div>
          <div class="dist-legend-item">
            <span class="legend-dot-purple"></span>
            <span>Missing Docs</span>
            <span class="dist-legend-value">${loc.statsBreakdown.missingDocs}%</span>
          </div>
        </div>

        <div class="popover-cta-link" id="popover-see-incidents-btn">
          <span>See Full Incidents</span>
          <span>&rarr;</span>
        </div>
      </div>
    `;

    const isCompact = window.matchMedia('(max-width: 1024px)').matches;

    this.popup = L.popup({
      className: 'agora-popover-wrapper',
      closeButton: false,
      autoClose: false,
      closeOnClick: false,
      offset: [0, -6],
      // Keep the popup clear of the floating topbar/controls/bottombar chrome,
      // which now correctly sits above the map (rather than letting the map's
      // own panes bleed over the interface).
      //
      // In the mobile map sheet there is no floating chrome to dodge — only the
      // close button and zoom controls — and desktop's generous padding leaves
      // less room than the popup needs on a 375px screen, so it can never pan
      // fully into view. Tighter padding there.
      autoPanPaddingTopLeft: isCompact ? L.point(14, 58) : L.point(90, 190),
      // Right padding covers the zoom/locate controls, which sit top-right on
      // mobile (see responsive.css) instead of left-center as on desktop.
      autoPanPaddingBottomRight: isCompact ? L.point(14, 58) : L.point(70, 170)
    })
      .setLatLng(coords)
      .setContent(html)
      .openOn(this.map);

    this.popup.getElement()?.querySelector('#popover-see-incidents-btn')?.addEventListener('click', () => {
      window.agoraApp?.openLocationTimeline(this.selectedLocationId);
    });
  }

  // Select Location and notify app components
  selectLocation(locationId) {
    this.selectedLocationId = locationId;
    AGORA_DATA.selectedLocationId = locationId;

    if (this.geoLayer) this.geoLayer.setStyle((feature) => this.getStateStyle(feature));
    if (this.map) this.renderPopup();

    if (window.agoraApp) {
      window.agoraApp.updateLocationView(locationId);
    }
  }

  // Zoom / Recenter / Locate Controls (native Leaflet drag & scroll handle panning/zooming)
  attachControls() {
    document.getElementById('map-zoom-in-btn')?.addEventListener('click', () => this.map?.zoomIn());
    document.getElementById('map-zoom-out-btn')?.addEventListener('click', () => this.map?.zoomOut());
    document.getElementById('map-reset-btn')?.addEventListener('click', () => {
      this.map?.setView(NIGERIA_CENTER, NIGERIA_DEFAULT_ZOOM);
    });
    document.getElementById('map-locate-btn')?.addEventListener('click', () => this.locateMe());
  }

  locateMe() {
    if (!navigator.geolocation) {
      window.agoraNotifications?.showToast('Location Unavailable', 'Your browser does not support geolocation.', 'error');
      return;
    }

    window.agoraNotifications?.showToast('Locating You', 'Requesting your current position…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const here = [position.coords.latitude, position.coords.longitude];
        this.map?.setView(here, 12);

        if (this.userLocationMarker) this.map.removeLayer(this.userLocationMarker);
        this.userLocationMarker = L.circleMarker(here, {
          radius: 7,
          color: this.themeColor('--map-state-stroke-active'),
          weight: 2,
          fillColor: this.themeColor('--accent-green-bright'),
          fillOpacity: 1
        }).addTo(this.map);

        window.agoraNotifications?.showToast('Location Found', 'Centered the map on your current position.', 'success');
      },
      () => {
        window.agoraNotifications?.showToast('Location Unavailable', 'Permission denied or your position could not be determined.', 'error');
      }
    );
  }
}
