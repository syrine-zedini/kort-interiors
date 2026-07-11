import fs from 'fs';
import path from 'path';

export type ProductSource = 'oopos' | 'local';

interface SiteSettings {
  productSource: ProductSource;
}

let _settings: SiteSettings = { productSource: 'oopos' };

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'site-settings.json');

export function loadSiteSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      _settings = { ..._settings, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8')) };
    }
  } catch {
    // keep defaults
  }
}

export function getSiteSettings(): SiteSettings {
  return { ..._settings };
}

export function updateSiteSettings(patch: Partial<SiteSettings>): SiteSettings {
  _settings = { ..._settings, ...patch };
  try {
    const dir = path.dirname(SETTINGS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(_settings, null, 2));
  } catch (err) {
    console.error('[siteSettings] persist error:', err);
  }
  return { ..._settings };
}
