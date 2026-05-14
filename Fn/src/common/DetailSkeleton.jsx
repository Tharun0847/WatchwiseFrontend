import React from "react";

const DetailSkeleton = () => {
  return (
    <div className="container py-4 py-md-5">
      <div className="skeleton-shine mb-4" style={{ height: "38px", width: "100px", borderRadius: "8px" }}></div>

      <div className="row g-4 g-md-5 mb-5">
        <div className="col-lg-4">
          <div className="skeleton-shine rounded shadow-lg mb-4 w-100" style={{ height: "0", paddingBottom: "150%" }}></div>
          <div className="skeleton-shine" style={{ height: "48px", width: "100%", borderRadius: "8px" }}></div>
        </div>
        
        <div className="col-lg-8">
          <div className="d-flex justify-content-between mb-3">
            <div className="skeleton-shine" style={{ height: "60px", width: "70%", borderRadius: "8px" }}></div>
            <div className="skeleton-shine rounded-circle" style={{ width: "50px", height: "50px" }}></div>
          </div>
          <div className="d-flex gap-3 mb-4">
            <div className="skeleton-shine" style={{ height: "24px", width: "60px", borderRadius: "4px" }}></div>
            <div className="skeleton-shine" style={{ height: "24px", width: "80px", borderRadius: "4px" }}></div>
            <div className="skeleton-shine" style={{ height: "24px", width: "60px", borderRadius: "4px" }}></div>
          </div>

          <div className="mb-4">
            <div className="skeleton-shine mb-3" style={{ height: "20px", width: "120px" }}></div>
            <div className="d-flex gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-shine rounded" style={{ width: "45px", height: "45px" }}></div>
              ))}
            </div>
          </div>
          
          <div className="skeleton-shine mb-3" style={{ height: "30px", width: "150px" }}></div>
          <div className="skeleton-shine mb-2" style={{ height: "16px", width: "100%" }}></div>
          <div className="skeleton-shine mb-2" style={{ height: "16px", width: "100%" }}></div>
          <div className="skeleton-shine mb-4" style={{ height: "16px", width: "60%" }}></div>

          <div className="skeleton-shine" style={{ height: "20px", width: "100px", marginBottom: "15px" }}></div>
          <div className="d-flex gap-2 flex-wrap">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-shine rounded-pill" style={{ width: "80px", height: "24px" }}></div>
            ))}
          </div>
        </div>
      </div>
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

export default DetailSkeleton;
