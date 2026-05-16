import React from "react";
import { useSelector } from "react-redux";
import { useGetWatchlistQuery, useAddToWatchlistMutation, useRemoveFromWatchlistMutation } from "../../services/watchlistAPI";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

/**
 * A reusable Watchlist Button that handles its own state and API logic.
 * Supports two modes: 'icon' (for grid cards) and 'full' (for details page).
 */
const WatchlistButton = ({ item, type, genres = [], variant = "full", className = "" }) => {
  const { user } = useSelector((state) => state.userReducer);
  const navigate = useNavigate();
  
  const { data: watchlist } = useGetWatchlistQuery(user?.id, { skip: !user?.id });
  const [addToWatchlist, { isLoading: isAdding }] = useAddToWatchlistMutation();
  const [removeFromWatchlist, { isLoading: isRemoving }] = useRemoveFromWatchlistMutation();

  const isSyncing = isAdding || isRemoving;

  const itemId = String(item.id || item.mal_id || item.contentId);
  const watchlistItem = watchlist?.find(w => w.contentId === itemId);
  const isInList = !!watchlistItem;

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent rapid double-clicks from causing race conditions
    if (isSyncing) return;

    if (!user?.id) {
      toast.error("Please login to manage your watchlist");
      return navigate("/login");
    }

    try {
      if (isInList) {
        removeFromWatchlist(watchlistItem._id);
        toast.success("Removed from watchlist");
      } else {
        // Map genres properly
        let mappedGenres = [];
        if (item.genres && Array.isArray(item.genres)) {
           mappedGenres = typeof item.genres[0] === 'string' 
            ? item.genres 
            : item.genres.map(g => g.name).filter(Boolean);
        } else if (type === 'movie' && item.genre_ids) {
          mappedGenres = item.genre_ids.map(id => genres.find(g => g.id === id)?.name).filter(Boolean);
        }

        // Standardize Image URL
        let image = "";
        if (item.image) {
          image = item.image;
        } else if (type === 'movie') {
          image = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "";
        } else {
          image = item.images?.jpg?.large_image_url || "";
        }

        addToWatchlist({
          userId: user.id,
          contentId: itemId,
          title: item.title || item.name,
          image: image,
          rating: item.vote_average || item.score || item.rating || 0,
          genres: mappedGenres,
          type: type
        });
        toast.success("Added to watchlist");
      }
    } catch (err) {
      console.error("Watchlist toggle error:", err);
      toast.error("Failed to update watchlist");
    }
  };

  // Icon Variant (Used in Media Cards)
  if (variant === "icon") {
    return (
      <button 
        className={`btn btn-sm rounded-pill x-small py-1 mt-2 w-100 ${isInList ? (type === 'movie' ? 'btn-info text-dark' : 'btn-success text-dark') : (type === 'movie' ? 'btn-outline-info' : 'btn-outline-success')} ${className}`}
        onClick={handleToggle}
      >
        {isInList ? (
          <><i className="bi bi-check2 me-1"></i>In List</>
        ) : (
          <><i className="bi bi-plus-lg me-1"></i>Watchlist</>
        )}
      </button>
    );
  }

  // Full Variant (Used in Details Page)
  return (
    <button 
      className={`btn btn-lg w-100 ${isInList ? 'btn-outline-danger' : 'btn-info'} ${className}`}
      onClick={handleToggle}
    >
      {isInList ? (
        <><i className="bi bi-dash-circle me-2"></i>Remove from Watchlist</>
      ) : (
        <><i className="bi bi-plus-circle me-2"></i>Add to Watchlist</>
      )}
    </button>
  );
};

export default React.memo(WatchlistButton);
