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
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  if (p.startsWith('/uploads')) {
    const base = SmartAPIManager.getBackendBaseURL();
    return base ? `${base}${p}` : p;
  }
  return p;
}
