import { SmartAPIManager } from '../services/api';

/**
 * Resolves image path to full URL for display.
 * - Paths starting with /uploads: prepend backend base URL (from SmartAPIManager)
 * - Full URLs (http/https): use as-is
 * - Other paths (e.g. /diamond-top-up.png): use as-is (frontend public)
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path || !path.trim()) return '';
  const p = path.trim();
  const extractUploadsPath = (value: string): string | null => {
    const marker = '/uploads/';
    const idx = value.indexOf(marker);
    if (idx === -1) return null;
    const after = value.slice(idx);
    const noQuery = after.split('?')[0] || after;
    return noQuery;
  };

  const uploadsPath = extractUploadsPath(p);
  if (uploadsPath) {
    const base = SmartAPIManager.getBackendBaseURL();
    return base ? `${base}${uploadsPath}` : uploadsPath;
  }

  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  return p;
}
