import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetWatchlistQuery, useRemoveFromWatchlistMutation, useUpdateWatchlistStatusMutation } from "../../services/watchlistAPI";
import FavoriteButton from "../favorites/FavoriteButton";
import OptimizedImage from "../../common/OptimizedImage";
import MediaSkeleton from "../../common/MediaSkeleton";
import { toast } from "react-hot-toast";

function Watchlist() {
  const { user } = useSelector((state) => state.userReducer);
  const navigate = useNavigate();
  
  // Watchlist Hooks
  const { data: items = [], isLoading: watchlistLoading } = useGetWatchlistQuery(user?.id, { skip: !user?.id });
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation();
  const [updateWatchlistStatus] = useUpdateWatchlistStatusMutation();

  // Dual Filter State
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter, typeFilter]);

  const handleRemove = async (e, id) => {
    e.stopPropagation(); // Prevent navigating to details
    try {
      await removeFromWatchlist(id).unwrap();
      toast.success("Item removed");
    } catch {
      toast.error("Error removing item");
    }
  };

  const handleStatusChange = async (e, id) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    try {
      await updateWatchlistStatus({ id, status: newStatus }).unwrap();
      toast.success("Status updated");
    } catch {
      toast.error("Error updating status");
    }
  };

  // Combined Filtering Logic for the cards display
  const filteredItems = items.filter(item => {
    const statusMatch = statusFilter === "All" || item.status === statusFilter;
    const typeMatch = typeFilter === "All" || item.type.toLowerCase() === typeFilter.toLowerCase();
    return statusMatch && typeMatch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const statuses = ["All", "Plan to Watch", "Currently Watching", "Completed"];
  const types = ["All", "Movie", "Anime"];

  // DYNAMIC COUNTS LOGIC
  const getStatusCount = (status) => {
    const itemsInType = typeFilter === "All" 
      ? items 
      : items.filter(i => i.type.toLowerCase() === typeFilter.toLowerCase());
    
    if (status === "All") return itemsInType.length;
    return itemsInType.filter(i => i.status === status).length;
  };

  const getTypeCount = (type) => {
    const itemsInStatus = statusFilter === "All"
      ? items
      : items.filter(i => i.status === statusFilter);

    if (type === "All") return itemsInStatus.length;
    return itemsInStatus.filter(i => i.type.toLowerCase() === type.toLowerCase()).length;
  };

  if (watchlistLoading) {
    return (
      <div className="container py-4">
        <div className="skeleton-shine mb-4" style={{ height: "100px", width: "100%", borderRadius: "10px" }}></div>
        <MediaSkeleton count={12} />
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-4 border-bottom border-secondary pb-4">
        <h2 className="text-light mb-0">My Watchlist</h2>
        
        <div className="d-flex flex-column gap-3 w-100 w-lg-auto">
          {/* Status Row */}
          <div className="d-flex align-items-start align-items-sm-center gap-2 gap-sm-3 flex-column flex-sm-row">
            <span className="text-info small opacity-75 uppercase fw-bold" style={{ minWidth: "60px" }}>Status:</span>
            <div className="d-flex flex-wrap gap-2" role="group">
              {statuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`btn btn-sm px-3 rounded-pill ${statusFilter === s ? 'btn-info text-dark fw-bold' : 'btn-outline-info opacity-75'}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                  <span className={`badge ms-2 ${statusFilter === s ? 'bg-dark text-info' : 'bg-info text-dark'}`}>
                    {getStatusCount(s)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Type Row */}
          <div className="d-flex align-items-start align-items-sm-center gap-2 gap-sm-3 flex-column flex-sm-row">
            <span className="text-success small opacity-75 uppercase fw-bold" style={{ minWidth: "60px" }}>Type:</span>
            <div className="d-flex flex-wrap gap-2" role="group">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`btn btn-sm px-3 rounded-pill ${typeFilter === t ? 'btn-success text-white fw-bold' : 'btn-outline-success opacity-75'}`}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === "All" ? "All Types" : t + "s"}
                  <span className={`badge ms-2 ${typeFilter === t ? 'bg-dark text-success' : 'bg-success text-white'}`}>
                    {getTypeCount(t)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-5 border border-secondary border-dashed rounded mt-4">
          <p className="text-info opacity-75 mb-0">No items found matching your filters.</p>
          <button className="btn btn-link text-info mt-2" onClick={() => { setStatusFilter("All"); setTypeFilter("All"); }}>Reset Filters</button>
        </div>
      ) : (
        <>
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-2 g-md-4">
            {paginatedItems.map((item) => {
              const optimizedImage = item.type === 'movie' && item.image?.includes('tmdb.org')
                ? item.image.replace('/w500/', '/w342/')
                : item.image;

              return (
                <div key={item._id} className="col">
                  <div 
                    className="card h-100 bg-dark text-light border-secondary shadow-sm movie-card position-relative"
                    onClick={() => navigate(`/details/${item.type}/${item.contentId}`)}
                  >
                    <FavoriteButton 
                      item={item} 
                      type={item.type} 
                      className="position-absolute top-0 end-0 m-1 m-md-2" 
                    />
                    <OptimizedImage 
                      src={optimizedImage} 
                      alt={item.title} 
                      className="card-img-top" 
                      style={{ height: "auto", aspectRatio: "2/3" }}
                    />
                    <div className="card-body p-2 p-md-3">
                      <div className="d-flex justify-content-between mb-1">
                        <h5 className="card-title text-info text-truncate small fw-bold mb-0" title={item.title}>{item.title}</h5>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-warning x-small">★ {item.rating}</span>
                        <span className={`badge ${item.type === 'movie' ? 'bg-info' : 'bg-success'} text-dark x-small d-none d-sm-inline-block`}>{item.type.toUpperCase()}</span>
                      </div>
                      <select 
                        className="form-select form-select-sm bg-dark text-light border-secondary w-100 x-small py-0 px-1 mb-2"
                        value={item.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(e, item._id)}
                        style={{ fontSize: '0.7rem' }}
                      >
                        <option value="Plan to Watch">Plan to Watch</option>
                        <option value="Currently Watching">Watching</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button 
                        className="btn btn-outline-danger btn-sm w-100 x-small py-1"
                        onClick={(e) => handleRemove(e, item._id)}
                        style={{ fontSize: '0.7rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex flex-column align-items-center mt-5 pt-4 border-top border-secondary">
              <div className="d-flex align-items-center gap-3">
                <button 
                  className="btn btn-outline-info rounded-pill px-4 d-flex align-items-center gap-2"
                  onClick={() => {
                    setCurrentPage(prev => Math.max(0, prev - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 0}
                >
                  <i className="bi bi-arrow-left"></i> Previous
                </button>
                
                <span className="text-info opacity-75 fw-bold">
                  Page {currentPage + 1} of {totalPages}
                </span>

                <button 
                  className="btn btn-outline-info rounded-pill px-4 d-flex align-items-center gap-2"
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages - 1}
                >
                  Next <i className="bi bi-arrow-right"></i>
                </button>
              </div>
              <p className="text-info opacity-50 x-small mt-2 uppercase tracking-wider">
                Showing {paginatedItems.length} of {filteredItems.length} items
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Watchlist;
