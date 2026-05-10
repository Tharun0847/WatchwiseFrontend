import React, { useState, useEffect } from "react";

/**
 * A robust image component with:
 * 1. Lazy loading support
 * 2. Loading skeleton state
 * 3. Standardized error fallback
 * 4. Progressive loading (opacity fade-in)
 */
const OptimizedImage = ({ src, alt, className, style, loading = "lazy" }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Fallback SVG (Grey placeholder with "No Image" text)
  const fallbackSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23444' font-family='sans-serif' font-size='20'%3ENo Image%3C/text%3E%3C/svg%3E";

  useEffect(() => {
    // Reset state if src changes
    setLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div 
      className={`position-relative overflow-hidden ${className}`} 
      style={{ ...style, backgroundColor: "#1a1a1a" }}
    >
      {/* Loading Skeleton */}
      {!loaded && !error && (
        <div 
          className="skeleton position-absolute top-0 start-0 w-100 h-100" 
          style={{ zIndex: 1 }}
        ></div>
      )}

      <img
        src={error || !src ? fallbackSrc : src}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-100 h-100 object-fit-cover transition-all duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        style={{ 
            display: "block",
            transition: "opacity 0.4s ease-in-out" 
        }}
      />
    </div>
  );
};

export default React.memo(OptimizedImage);
