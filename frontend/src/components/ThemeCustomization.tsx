import { useState, useEffect, type FormEvent } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import useAuth from '../hooks/useAuth';

function ThemeCustomization() {
  const { primaryColor, secondaryColor, isLoaded, updateTheme } = useTheme();
  const { user } = useAuth();
  const [localPrimary, setLocalPrimary] = useState<string>('#a855f7');
  const [localSecondary, setLocalSecondary] = useState<string>('#8b5cf6');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Initialize local state from theme context
  useEffect(() => {
    if (isLoaded) {
      setLocalPrimary(primaryColor);
      setLocalSecondary(secondaryColor);
    }
  }, [isLoaded, primaryColor, secondaryColor]);

  // Auto-hide message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Apply preview colors
  useEffect(() => {
    if (previewMode) {
      const root = document.documentElement;
      const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : null;
      };

      const primaryRgb = hexToRgb(localPrimary);
      const secondaryRgb = hexToRgb(localSecondary);

      if (primaryRgb) {
        root.style.setProperty('--theme-primary', localPrimary);
        root.style.setProperty('--theme-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
        root.style.setProperty('--theme-primary-light', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.14)`);
        root.style.setProperty('--theme-primary-dark', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8)`);
        root.style.setProperty('--theme-primary-hover', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.9)`);
      }

      if (secondaryRgb) {
        root.style.setProperty('--theme-secondary', localSecondary);
        root.style.setProperty('--theme-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
        const darkerR = Math.max(0, secondaryRgb.r - 20);
        const darkerG = Math.max(0, secondaryRgb.g - 20);
        const darkerB = Math.max(0, secondaryRgb.b - 20);
        root.style.setProperty('--theme-secondary-dark', `rgb(${darkerR}, ${darkerG}, ${darkerB})`);
      }
    }
  }, [previewMode, localPrimary, localSecondary]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate colors
    if (!/^#([A-Fa-f0-9]{6})$/.test(localPrimary)) {
      setMessage({ type: 'error', text: 'Invalid primary color format' });
      return;
    }
    
    if (!/^#([A-Fa-f0-9]{6})$/.test(localSecondary)) {
      setMessage({ type: 'error', text: 'Invalid secondary color format' });
      return;
    }

    setIsSaving(true);
    setMessage(null); // Clear any previous messages
    try {
      await updateTheme(localPrimary, localSecondary, user?.email || 'admin');
      setMessage({ 
        type: 'success', 
        text: 'Theme updated successfully! Changes are live now and saved to MongoDB.' 
      });
      setPreviewMode(false);
    } catch (error: any) {
      console.error('Theme update error:', error);
      const errorMessage = error.message || 'Failed to update theme';
      setMessage({ 
        type: 'error', 
        text: `Failed to save theme: ${errorMessage}. Please check your connection and try again.` 
      });
      // Keep preview mode active so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalPrimary('#a855f7');
    setLocalSecondary('#8b5cf6');
    setPreviewMode(false);
    setMessage(null);
  };

  const handlePreview = () => {
    setPreviewMode(true);
  };

  const handleCancelPreview = () => {
    setPreviewMode(false);
    // Restore original colors
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', primaryColor);
    root.style.setProperty('--theme-secondary', secondaryColor);
    // Re-apply theme to restore all variables
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    };
    const primaryRgb = hexToRgb(primaryColor);
    const secondaryRgb = hexToRgb(secondaryColor);
    if (primaryRgb) {
      root.style.setProperty('--theme-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
      root.style.setProperty('--theme-primary-light', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.14)`);
      root.style.setProperty('--theme-primary-dark', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8)`);
      root.style.setProperty('--theme-primary-hover', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.9)`);
    }
    if (secondaryRgb) {
      root.style.setProperty('--theme-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
      const darkerR = Math.max(0, secondaryRgb.r - 20);
      const darkerG = Math.max(0, secondaryRgb.g - 20);
      const darkerB = Math.max(0, secondaryRgb.b - 20);
      root.style.setProperty('--theme-secondary-dark', `rgb(${darkerR}, ${darkerG}, ${darkerB})`);
    }
  };

  // Preset colors that work well with white background
  const presetColors = [
    { name: 'Purple (Default)', primary: '#a855f7', secondary: '#8b5cf6' },
    { name: 'Blue', primary: '#3b82f6', secondary: '#2563eb' },
    { name: 'Green', primary: '#10b981', secondary: '#059669' },
    { name: 'Pink', primary: '#ec4899', secondary: '#db2777' },
    { name: 'Orange', primary: '#f97316', secondary: '#ea580c' },
    { name: 'Teal', primary: '#14b8a6', secondary: '#0d9488' },
    { name: 'Indigo', primary: '#6366f1', secondary: '#4f46e5' },
    { name: 'Red', primary: '#ef4444', secondary: '#dc2626' },
  ];

  return (
    <div className="pt-4 pb-4 pl-0 pr-4 space-y-6 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
      <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
        <h3 className="mb-4 text-lg font-bold text-slate-900">Store Theme Customization</h3>
        <p className="mb-6 text-sm text-slate-600">
          Customize your store's theme colors. Choose colors that work well with white backgrounds.
          Changes will be applied site-wide and visible to all users.
        </p>

        {message && (
          <div className={`p-4 rounded-xl mb-6 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <p className="font-semibold">{message.text}</p>
          </div>
        )}

        {previewMode && (
          <div className="p-4 mb-6 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">Preview Mode Active</p>
                <p className="text-sm text-blue-700">You are previewing theme changes. Click "Save Theme" to apply or "Cancel Preview" to revert.</p>
              </div>
              <button
                onClick={handleCancelPreview}
                className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-all"
              >
                Cancel Preview
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Color Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Color */}
            <div className="p-4 border rounded-xl bg-slate-50 border-slate-200">
              <label className="block mb-3">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Primary Color *</span>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={localPrimary}
                    onChange={(e) => {
                      setLocalPrimary(e.target.value);
                      if (previewMode) {
                        // Trigger preview update
                        setPreviewMode(false);
                        setTimeout(() => setPreviewMode(true), 10);
                      }
                    }}
                    className="w-20 h-20 rounded-lg border-2 border-slate-300 cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={localPrimary}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[A-Fa-f0-9]{0,6}$/.test(value)) {
                          setLocalPrimary(value.length === 6 ? `#${value}` : value);
                          if (previewMode && value.length === 7) {
                            setPreviewMode(false);
                            setTimeout(() => setPreviewMode(true), 10);
                          }
                        }
                      }}
                      placeholder="#a855f7"
                      className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 font-mono"
                      style={{
                        '--tw-ring-color': 'var(--theme-primary)'
                      } as React.CSSProperties}
                    />
                    <p className="mt-1 text-xs text-slate-500">Used for buttons, links, and primary accents</p>
                  </div>
                </div>
              </label>
            </div>

            {/* Secondary Color */}
            <div className="p-4 border rounded-xl bg-slate-50 border-slate-200">
              <label className="block mb-3">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Secondary Color *</span>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={localSecondary}
                    onChange={(e) => {
                      setLocalSecondary(e.target.value);
                      if (previewMode) {
                        setPreviewMode(false);
                        setTimeout(() => setPreviewMode(true), 10);
                      }
                    }}
                    className="w-20 h-20 rounded-lg border-2 border-slate-300 cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={localSecondary}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[A-Fa-f0-9]{0,6}$/.test(value)) {
                          setLocalSecondary(value.length === 6 ? `#${value}` : value);
                          if (previewMode && value.length === 7) {
                            setPreviewMode(false);
                            setTimeout(() => setPreviewMode(true), 10);
                          }
                        }
                      }}
                      placeholder="#8b5cf6"
                      className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 font-mono"
                      style={{
                        '--tw-ring-color': 'var(--theme-primary)'
                      } as React.CSSProperties}
                    />
                    <p className="mt-1 text-xs text-slate-500">Used for gradients and secondary accents</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Color Preview */}
          <div className="p-4 border rounded-xl bg-slate-50 border-slate-200">
            <span className="block mb-3 text-sm font-semibold text-slate-700">Color Preview</span>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-24 h-24 rounded-lg border-2 border-slate-300 shadow-md"
                  style={{ background: `linear-gradient(135deg, ${localPrimary}, ${localSecondary})` }}
                />
                <span className="text-xs text-slate-600">Gradient</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-24 h-24 rounded-lg border-2 border-slate-300 shadow-md"
                  style={{ backgroundColor: localPrimary }}
                />
                <span className="text-xs text-slate-600">Primary</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-24 h-24 rounded-lg border-2 border-slate-300 shadow-md"
                  style={{ backgroundColor: localSecondary }}
                />
                <span className="text-xs text-slate-600">Secondary</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  className="px-6 py-3 rounded-lg text-white font-semibold shadow-md transition-all"
                  style={{ background: `linear-gradient(135deg, ${localPrimary}, ${localSecondary})` }}
                >
                  Sample Button
                </button>
                <span className="text-xs text-slate-600">Button Style</span>
              </div>
            </div>
          </div>

          {/* Preset Colors */}
          <div className="p-4 border rounded-xl bg-slate-50 border-slate-200">
            <span className="block mb-3 text-sm font-semibold text-slate-700">Quick Presets</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {presetColors.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setLocalPrimary(preset.primary);
                    setLocalSecondary(preset.secondary);
                    if (previewMode) {
                      setPreviewMode(false);
                      setTimeout(() => setPreviewMode(true), 10);
                    }
                  }}
                  className="p-3 border rounded-lg bg-white border-slate-200 hover:border-slate-300 transition-all text-left"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded border border-slate-300"
                      style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                    />
                    <span className="text-sm font-semibold text-slate-700">{preset.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <div
                      className="w-4 h-4 rounded border border-slate-300"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded border border-slate-300"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 font-semibold text-white transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.background = `linear-gradient(135deg, var(--theme-primary-hover), var(--theme-secondary-dark))`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.background = `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`;
                }
              }}
            >
              {isSaving ? 'Saving...' : 'Save Theme'}
            </button>
            <button
              type="button"
              onClick={handlePreview}
              disabled={isSaving || previewMode}
              className="px-6 py-3 font-semibold transition-all bg-blue-100 rounded-xl text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Preview Changes
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-6 py-3 font-semibold transition-all bg-slate-200 rounded-xl text-slate-700 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset to Default
            </button>
          </div>
        </form>

        {/* Current Theme Info */}
        <div className="mt-6 p-4 border rounded-xl bg-slate-50 border-slate-200">
          <span className="block mb-2 text-sm font-semibold text-slate-700">Current Active Theme</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded border border-slate-300"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-sm text-slate-600">Primary: <code className="font-mono">{primaryColor}</code></span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded border border-slate-300"
                style={{ backgroundColor: secondaryColor }}
              />
              <span className="text-sm text-slate-600">Secondary: <code className="font-mono">{secondaryColor}</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThemeCustomization;
