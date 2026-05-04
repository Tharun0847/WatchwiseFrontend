import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getWatchlist, removeFromWatchlist, updateWatchlistStatus } from "../services/watchlistAPI";
import { useGetFavoritesQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } from "../services/favoriteAPI";

function Watchlist() {
  const { user } = useSelector((state) => state.userReducer);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dual Filter State
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // Favorite Hooks
  const { data: favorites } = useGetFavoritesQuery(user?.id, { skip: !user?.id });
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  const fetchWatchlist = async () => {
    try {
      const response = await getWatchlist(user.id);
      setItems(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching watchlist", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchWatchlist();
    };
    init();
  }, [user.id]);

  const handleRemove = async (e, id) => {
    e.stopPropagation(); // Prevent navigating to details
    try {
      await removeFromWatchlist(id);
      setItems(items.filter((item) => item._id !== id));
    } catch {
      alert("Error removing item");
    }
  };

  const handleStatusChange = async (e, id) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    try {
      await updateWatchlistStatus(id, newStatus);
      setItems(items.map(item => item._id === id ? { ...item, status: newStatus } : item));
    } catch {
      alert("Error updating status");
    }
  };

  const handleToggleFavorite = async (e, item) => {
    e.stopPropagation();
    if (!user?.id) return alert("Please login to use favorites");
    
    const existingFav = favorites?.find(f => f.contentId === item.contentId);
    
    try {
      if (existingFav) {
        await removeFavorite(existingFav._id).unwrap();
      } else {
        await addFavorite({
          userId: user.id,
          contentId: item.contentId,
          title: item.title,
          image: item.image,
          rating: item.rating || 0,
          genres: item.genres || [],
          type: item.type
        }).unwrap();
      }
    } catch (err) {
      alert("Error toggling favorite");
    }
  };

  // Combined Filtering Logic for the cards display
  const filteredItems = items.filter(item => {
    const statusMatch = statusFilter === "All" || item.status === statusFilter;
    const typeMatch = typeFilter === "All" || item.type.toLowerCase() === typeFilter.toLowerCase();
    return statusMatch && typeMatch;
  });

  const statuses = ["All", "Plan to Watch", "Currently Watching", "Completed"];
  const types = ["All", "Movie", "Anime"];

  // DYNAMIC COUNTS LOGIC
  // 1. Status counts should respect the current Type filter
  const getStatusCount = (status) => {
    const itemsInType = typeFilter === "All" 
      ? items 
      : items.filter(i => i.type.toLowerCase() === typeFilter.toLowerCase());
    
    if (status === "All") return itemsInType.length;
    return itemsInType.filter(i => i.status === status).length;
  };

  // 2. Type counts should respect the current Status filter
  const getTypeCount = (type) => {
    const itemsInStatus = statusFilter === "All"
      ? items
      : items.filter(i => i.status === statusFilter);

    if (type === "All") return itemsInStatus.length;
    return itemsInStatus.filter(i => i.type.toLowerCase() === type.toLowerCase()).length;
  };

  if (loading) return <div className="text-center mt-5 text-light">Loading Watchlist...</div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-4 border-bottom border-secondary pb-4">
        <h2 className="text-light mb-0">My Watchlist</h2>
        
        <div className="d-flex flex-column gap-3">
          {/* Status Row */}
          <div className="d-flex align-items-center gap-3">
            <span className="text-info small opacity-75 uppercase fw-bold" style={{ minWidth: "60px" }}>Status:</span>
            <div className="btn-group shadow-sm" role="group">
              {statuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`btn btn-sm px-3 ${statusFilter === s ? 'btn-info text-dark fw-bold' : 'btn-outline-info opacity-75'}`}
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
          <div className="d-flex align-items-center gap-3">
            <span className="text-success small opacity-75 uppercase fw-bold" style={{ minWidth: "60px" }}>Type:</span>
            <div className="btn-group shadow-sm" role="group">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`btn btn-sm px-3 ${typeFilter === t ? 'btn-success text-white fw-bold' : 'btn-outline-success opacity-75'}`}
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
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
          {filteredItems.map((item) => {
            const isFav = favorites?.some(f => f.contentId === item.contentId);
            return (
              <div key={item._id} className="col">
                <div 
                  className="card h-100 bg-dark text-light border-secondary shadow-sm movie-card position-relative"
                  onClick={() => navigate(`/details/${item.type}/${item.contentId}`)}
                >
                  <button 
                    className={`btn btn-sm rounded-circle position-absolute top-0 end-0 m-2 shadow-sm d-flex align-items-center justify-content-center ${isFav ? 'btn-info text-dark' : 'btn-dark bg-opacity-75 text-info border-info'}`}
                    style={{ width: "32px", height: "32px", zIndex: 10 }}
                    onClick={(e) => handleToggleFavorite(e, item)}
                  >
                    <i className={`bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                  </button>
                  <img src={item.image} className="card-img-top" alt={item.title} style={{ height: "350px", objectFit: "cover" }} />
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <h5 className="card-title text-info text-truncate" title={item.title}>{item.title}</h5>
                      <span className={`badge ${item.type === 'movie' ? 'bg-info' : 'bg-success'} text-dark h-50`}>{item.type.toUpperCase()}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-warning">★ {item.rating}</span>
                      <select 
                        className="form-select form-select-sm bg-dark text-light border-secondary w-auto"
                        value={item.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(e, item._id)}
                      >
                        <option value="Plan to Watch">Plan to Watch</option>
                        <option value="Currently Watching">Currently Watching</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="card-footer border-secondary bg-transparent">
                    <button 
                      className="btn btn-outline-danger btn-sm w-100"
                      onClick={(e) => handleRemove(e, item._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Watchlist;
