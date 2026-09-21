/**
 * AGORA LENS - THEME CONTROLLER
 *
 * Applies the dark (default) or light palette by setting data-theme on <html>.
 * Everything the stylesheets need lives in tokens, so this only has to flip the
 * attribute — the exceptions are the two things CSS can't reach: the Leaflet
 * basemap tiles and the SVG charts the trend dashboard draws from a JS palette.
 * Both listen for the agora:themechange event dispatched here.
 *
 * Preference order: an explicit choice the person has made, else whatever the
 * operating system reports.
 */

const THEME_STORAGE_KEY = 'agora-lens-theme';
const THEMES = ['dark', 'light'];

class AgoraThemeController {
  constructor() {
    this.media = window.matchMedia('(prefers-color-scheme: light)');
    this.theme = this.resolveInitialTheme();
    this.apply(this.theme, { silent: true });
    this.attachListeners();
  }

  storedTheme() {
    // Private browsing and blocked site data both throw here rather than
    // returning null, so a read failure just means "no stored preference".
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return THEMES.includes(stored) ? stored : null;
    } catch (err) {
      return null;
    }
  }

  resolveInitialTheme() {
    return this.storedTheme() || (this.media.matches ? 'light' : 'dark');
  }

  apply(theme, { silent = false } = {}) {
    this.theme = THEMES.includes(theme) ? theme : 'dark';
    document.documentElement.setAttribute('data-theme', this.theme);

    // Keep the mobile browser chrome in step with the page behind it.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', this.theme === 'light' ? '#F7F5F1' : '#151517');

    this.syncToggle();

    if (!silent) {
      document.dispatchEvent(new CustomEvent('agora:themechange', {
        detail: { theme: this.theme }
      }));
    }
  }

  set(theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (err) {
      // A preference that can't be stored still applies for this session.
    }
    this.apply(theme);
  }

  toggle() {
    this.set(this.theme === 'light' ? 'dark' : 'light');
  }

  syncToggle() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;

    const isLight = this.theme === 'light';
    btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    btn.setAttribute('title', isLight ? 'Switch to dark theme' : 'Switch to light theme');

    const label = document.getElementById('theme-toggle-label');
    if (label) {
      label.textContent = window.agoraI18n
        ? window.agoraI18n.t(isLight ? 'theme.light' : 'theme.dark')
        : (isLight ? 'Light theme' : 'Dark theme');
    }
  }

  attachListeners() {
    document.getElementById('theme-toggle-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });

    // Follow the system only while no explicit choice has been stored.
    const onSystemChange = (e) => {
      if (this.storedTheme()) return;
      this.apply(e.matches ? 'light' : 'dark');
    };

    if (typeof this.media.addEventListener === 'function') {
      this.media.addEventListener('change', onSystemChange);
    } else if (typeof this.media.addListener === 'function') {
      this.media.addListener(onSystemChange);
    }
  }
}

// Applied before the rest of the app builds, so nothing renders in the wrong
// palette and then repaints.
window.agoraTheme = new AgoraThemeController();
