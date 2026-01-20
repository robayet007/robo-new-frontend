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
 * Preloads multiple images in parallel with performance optimization
 * Uses requestIdleCallback when available to defer heavy operations
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

  // Use requestIdleCallback if available to defer heavy operations
  // This prevents setTimeout handler violations by running during idle time
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return new Promise((resolve) => {
      const preloadBatch = () => {
        // Preload images in smaller batches to avoid blocking
        const batchSize = 5;
        const batches: string[][] = [];
        for (let i = 0; i < uniqueUrls.length; i += batchSize) {
          batches.push(uniqueUrls.slice(i, i + batchSize));
        }
        
        // Process batches sequentially to avoid overwhelming the browser
        const processBatches = async (index: number): Promise<void> => {
          if (index >= batches.length) {
            resolve([]);
            return;
          }
          
          await Promise.all(batches[index].map(url => preloadImage(url)));
          
          // Use requestIdleCallback for next batch if available
          if (index + 1 < batches.length) {
            if ('requestIdleCallback' in window) {
              window.requestIdleCallback(() => {
                processBatches(index + 1);
              }, { timeout: 1000 });
            } else {
              // Fallback to setTimeout with small delay
              setTimeout(() => processBatches(index + 1), 0);
            }
          } else {
            resolve([]);
          }
        };
        
        processBatches(0);
      };
      
      window.requestIdleCallback(preloadBatch, { timeout: 2000 });
    });
  }

  // Fallback: Preload all images in parallel (original behavior)
  return Promise.all(uniqueUrls.map(url => preloadImage(url)));
}
