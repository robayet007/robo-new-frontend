/**
 * Image Preloader Utility
 * Preloads images to improve perceived performance and eliminate loading delays
 */

/**
 * Preloads a single image
 * @param url - The image URL to preload
 * @returns Promise that resolves when image is loaded (or fails gracefully)
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    // Skip empty or invalid URLs
    if (!url || typeof url !== 'string' || url.trim() === '') {
      resolve();
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      resolve();
    };
    
    img.onerror = () => {
      // Log error in development but don't throw
      if (import.meta.env.DEV) {
        console.warn(`Failed to preload image: ${url}`);
      }
      resolve(); // Resolve anyway to not block other preloads
    };
    
    img.src = url;
  });
}

/**
 * Preloads multiple images in parallel
 * @param urls - Array of image URLs to preload
 * @returns Promise that resolves when all images are loaded (or failed gracefully)
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  if (!urls || urls.length === 0) {
    return Promise.resolve([]);
  }

  // Filter out duplicates and invalid URLs
  const uniqueUrls = [...new Set(urls.filter(url => url && typeof url === 'string' && url.trim() !== ''))];
  
  if (uniqueUrls.length === 0) {
    return Promise.resolve([]);
  }

  // Preload all images in parallel
  return Promise.all(uniqueUrls.map(url => preloadImage(url)));
}
