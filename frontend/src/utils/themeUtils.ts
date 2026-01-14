/**
 * Theme utility functions for color conversions and gradient generation
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
}

/**
 * Generate a darker shade of a color
 */
export function darkenColor(hex: string, amount: number = 20): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const r = Math.max(0, rgb.r - amount);
  const g = Math.max(0, rgb.g - amount);
  const b = Math.max(0, rgb.b - amount);
  
  return rgbToHex(r, g, b);
}

/**
 * Generate a lighter shade of a color
 */
export function lightenColor(hex: string, amount: number = 20): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const r = Math.min(255, rgb.r + amount);
  const g = Math.min(255, rgb.g + amount);
  const b = Math.min(255, rgb.b + amount);
  
  return rgbToHex(r, g, b);
}

/**
 * Create a gradient string from two colors
 */
export function createGradient(
  color1: string,
  color2: string,
  direction: 'to right' | 'to left' | 'to bottom' | 'to top' | 'to bottom right' | 'to bottom left' | 'to top right' | 'to top left' | '135deg' | '45deg' = 'to right'
): string {
  if (direction === '135deg' || direction === '45deg') {
    return `linear-gradient(${direction}, ${color1}, ${color2})`;
  }
  return `linear-gradient(${direction}, ${color1}, ${color2})`;
}

/**
 * Create rgba color string
 */
export function rgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Get theme gradient style object for inline styles
 */
export function getThemeGradientStyle(
  primary: string = 'var(--theme-primary)',
  secondary: string = 'var(--theme-secondary)',
  direction: string = 'to right'
): React.CSSProperties {
  return {
    background: createGradient(primary, secondary, direction as any)
  };
}

/**
 * Get theme color style object for inline styles
 */
export function getThemeColorStyle(color: string = 'var(--theme-primary)'): React.CSSProperties {
  return {
    color: color
  };
}

/**
 * Get theme background color style object for inline styles
 */
export function getThemeBgStyle(color: string = 'var(--theme-primary)'): React.CSSProperties {
  return {
    backgroundColor: color
  };
}

/**
 * Get theme border color style object for inline styles
 */
export function getThemeBorderStyle(color: string = 'var(--theme-primary)'): React.CSSProperties {
  return {
    borderColor: color
  };
}
