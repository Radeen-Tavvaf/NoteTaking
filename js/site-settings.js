const SITE_SETTINGS_KEY = 'notetaking-site-settings';
const DEFAULT_SITE_SETTINGS = {
  theme: 'violet',
  background: '#f6f4ff',
};

function isHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function getSiteSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SITE_SETTINGS_KEY) || '{}');
    return {
      theme: typeof stored.theme === 'string' ? stored.theme : DEFAULT_SITE_SETTINGS.theme,
      background: isHexColor(stored.background) ? stored.background : DEFAULT_SITE_SETTINGS.background,
    };
  } catch {
    return { ...DEFAULT_SITE_SETTINGS };
  }
}

export function applySiteSettings(settings = DEFAULT_SITE_SETTINGS) {
  const theme = settings.theme || DEFAULT_SITE_SETTINGS.theme;
  const background = isHexColor(settings.background) ? settings.background : DEFAULT_SITE_SETTINGS.background;
  document.body.setAttribute('data-theme', theme);
  document.body.style.setProperty('--site-background', background);
}

export function saveSiteSettings(settings) {
  const nextSettings = {
    theme: settings.theme || DEFAULT_SITE_SETTINGS.theme,
    background: isHexColor(settings.background) ? settings.background : DEFAULT_SITE_SETTINGS.background,
  };
  localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(nextSettings));
  applySiteSettings(nextSettings);
  return nextSettings;
}
