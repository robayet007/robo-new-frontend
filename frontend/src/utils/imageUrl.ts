/**
 * Resolves image path to full URL for display.
 * - Paths starting with /uploads: prepend backend base URL
 * - Full URLs (http/https): use as-is
 * - Other paths (e.g. /diamond-top-up.png): use as-is (frontend public)
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path || !path.trim()) return '';
  const p = path.trim();
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  if (p.startsWith('/uploads')) {
    const base = (
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.VITE_API_URL ||
      (import.meta.env.DEV ? 'http://localhost:5000' : '')
    )
      .toString()
      .replace(/\/$/, '');
    return base ? `${base}${p}` : p;
  }
  return p;
}
