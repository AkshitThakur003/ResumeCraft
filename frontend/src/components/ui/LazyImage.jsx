import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils';

/**
 * LazyImage component for optimized image loading
 * Implements lazy loading, decoding, and error handling
 * 
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} className - Additional CSS classes
 * @param {string} placeholder - Placeholder image or color (optional)
 * @param {boolean} eager - Load immediately (skip lazy loading)
 */
export const LazyImage = ({ 
  src, 
  alt, 
  className, 
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E',
  eager = false,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Use Intersection Observer for lazy loading
    if (!eager && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
              }
              observer.unobserve(img);
            }
          });
        },
        {
          rootMargin: '50px', // Start loading 50px before image enters viewport
        }
      );

      observer.observe(imgRef.current);

      return () => {
        if (imgRef.current) {
          observer.unobserve(imgRef.current);
        }
      };
    } else if (eager) {
      // Load immediately if eager
      if (imgRef.current.dataset.src) {
        imgRef.current.src = imgRef.current.dataset.src;
        imgRef.current.removeAttribute('data-src');
      }
    }
  }, [eager]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  return (
    <img
      ref={imgRef}
      data-src={!eager ? src : undefined}
      src={eager ? src : placeholder}
      alt={alt}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        hasError && 'opacity-50',
        className
      )}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
};

