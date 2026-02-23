import { useState, useRef, useEffect } from 'react';
import { getImageUrl } from '../utils/imageUrl';

// Get API base URL (same logic as SmartAPIManager)
const getApiBaseURL = (): string => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  if (!backendUrl) {
    throw new Error(
      'VITE_BACKEND_URL environment variable is not set. ' +
      'Please set it in your .env file or Vercel environment variables.'
    );
  }
  
  return `${backendUrl}/api`;
};

// Get API key for authentication (optional – backend may allow requests without it)
const getApiKey = (): string => {
  return import.meta.env.VITE_API_KEY || '';
};

interface ImageUploadProps {
  value?: string; // Current image URL
  onChange: (url: string) => void;
  onFileSelect?: (file: File | null) => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  uploadEndpoint: string; // '/api/upload/category-image' or '/api/upload/banner-image'
}

function ImageUpload({
  value,
  onChange,
  onFileSelect,
  label = 'Image',
  accept = 'image/*',
  maxSizeMB = 5,
  uploadEndpoint
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when value changes (for existing images from database)
  useEffect(() => {
    if (value && value.trim()) {
      // Use getImageUrl so /uploads paths resolve to backend URL for preview
      setPreview(getImageUrl(value));
    } else if (!value || !value.trim()) {
      // Only clear preview if value is truly empty AND preview is not a data URL (file preview)
      // Don't clear if user is uploading (preview is data URL)
      if (preview && !preview.startsWith('data:')) {
        setPreview(null);
      }
    }
  }, [value, preview]);

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      setPreview(null);
      onChange('');
      onFileSelect?.(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`Image size must be less than ${maxSizeMB}MB`);
      return;
    }

    setError(null);
    setUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      const formData = new FormData();
      formData.append('image', file);

      const baseURL = getApiBaseURL();
      const fullUrl = `${baseURL}${uploadEndpoint}`;
      const apiKey = getApiKey();

      const headers: Record<string, string> = {};
      if (apiKey) headers['X-API-Key'] = apiKey;

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data?.url) {
        const relativePath = result.data.url;
        // Store relative path in DB for portability; use getImageUrl for display
        setPreview(getImageUrl(relativePath));
        onChange(relativePath);
        onFileSelect?.(file);
        setError(null);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setPreview(null);
      onChange('');
      onFileSelect?.(null);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    onFileSelect?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      
      {/* Preview */}
      {preview && (
        <div className="relative w-full max-w-xs">
          <img
            src={preview}
            alt="Preview"
            className="object-cover w-full h-32 border-2 rounded-lg border-slate-300"
          />
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute px-2 py-1 text-xs font-semibold text-white transition-colors bg-red-500 rounded top-1 right-1 hover:bg-red-600"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {/* File Input */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={uploading}
          className="hidden"
          id={`image-upload-${label.replace(/\s+/g, '-')}`}
        />
        <label
          htmlFor={`image-upload-${label.replace(/\s+/g, '-')}`}
          className={`px-4 py-2 text-sm font-semibold text-white rounded-lg cursor-pointer transition-all ${
            uploading ? 'bg-slate-400 cursor-not-allowed' : 'hover:opacity-90'
          }`}
          style={
            uploading
              ? undefined
              : {
                  background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))',
                  boxShadow: '0 4px 14px rgba(var(--theme-primary-rgb), 0.35)'
                }
          }
        >
          {uploading ? 'Uploading...' : preview ? 'Change Image' : 'Choose Image'}
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

export default ImageUpload;
