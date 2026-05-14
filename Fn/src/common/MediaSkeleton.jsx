import React from "react";

const MediaSkeleton = ({ count = 6 }) => {
  return (
    <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-2 g-md-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="col">
          <div className="card h-100 bg-dark border-secondary shadow-sm overflow-hidden" style={{ minHeight: "250px" }}>
            {/* Poster Skeleton */}
            <div 
              className="skeleton-shine" 
              style={{ 
                height: "0", 
                paddingBottom: "150%", 
                backgroundColor: "#222" 
              }}
            ></div>
            <div className="card-body p-2">
              {/* Title Skeleton */}
              <div 
                className="skeleton-shine mb-2" 
                style={{ 
                  height: "12px", 
                  width: "80%", 
                  backgroundColor: "#333",
                  borderRadius: "4px" 
                }}
              ></div>
              {/* Button Skeleton */}
              <div 
                className="skeleton-shine mx-auto" 
                style={{ 
                  height: "24px", 
                  width: "100%", 
                  backgroundColor: "#333",
                  borderRadius: "20px" 
                }}
              ></div>
            </div>
          </div>
        </div>
      ))}
      <style>{`
        .skeleton-shine {
          position: relative;
          overflow: hidden;
          background-color: #2c2c2c;
        }
        .skeleton-shine::after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.05) 20%,
            rgba(255, 255, 255, 0.1) 60%,
            rgba(255, 255, 255, 0)
          );
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default MediaSkeleton;
