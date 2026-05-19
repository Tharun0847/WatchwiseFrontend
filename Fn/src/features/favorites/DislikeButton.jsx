import React from "react";
import { useSelector } from "react-redux";
import { useGetDislikesQuery, useAddDislikeMutation, useRemoveDislikeMutation } from "../../services/dislikeAPI";
import { useGetFavoritesQuery, useRemoveFavoriteMutation } from "../../services/favoriteAPI";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const DislikeButton = ({ item, type, genres = [], className = "" }) => {
  const { user } = useSelector((state) => state.userReducer);
  const navigate = useNavigate();
  
  const { data: dislikes } = useGetDislikesQuery(user?.id, { skip: !user?.id });
  const { data: favorites } = useGetFavoritesQuery(user?.id, { skip: !user?.id });
  const [addDislike, { isLoading: isAdding }] = useAddDislikeMutation();
  const [removeDislike, { isLoading: isRemoving }] = useRemoveDislikeMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  const isSyncing = isAdding || isRemoving;

  const itemId = String(item.id || item.mal_id || item.contentId);
  const isDisliked = dislikes?.some(d => d.contentId === itemId);
  const existingDislike = dislikes?.find(d => d.contentId === itemId);
  const existingFav = favorites?.find(f => f.contentId === itemId);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSyncing) return;

    if (!user?.id) {
      toast.error("Please login to use dislikes");
      return navigate("/login");
    }

    try {
      if (existingDislike) {
        await removeDislike(existingDislike._id).unwrap();
        toast.success("Removed from dislikes");
      } else {
        // If it's in favorites, remove it first
        if (existingFav) {
          await removeFavorite(existingFav._id).unwrap();
        }

        let mappedGenres = [];
        if (item.genres && Array.isArray(item.genres)) {
           mappedGenres = typeof item.genres[0] === 'string' 
            ? item.genres 
            : item.genres.map(g => g.name).filter(Boolean);
        } else if (type === 'movie' && item.genre_ids) {
          mappedGenres = item.genre_ids.map(id => genres.find(g => g.id === id)?.name).filter(Boolean);
        }

        let image = "";
        if (item.image) {
          image = item.image;
        } else if (type === 'movie') {
          image = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "";
        } else {
          image = item.images?.jpg?.large_image_url || "";
        }

        await addDislike({
          userId: user.id,
          contentId: itemId,
          title: item.title || item.name,
          image: image,
          rating: item.vote_average || item.score || item.rating || 0,
          genres: mappedGenres,
          type: type
        }).unwrap();
        toast.success("Added to dislikes");
      }
    } catch (err) {
      console.error("Dislike toggle error:", err);
      toast.error("Failed to update dislikes");
    }
  };

  return (
    <button 
      className={`btn btn-sm rounded-circle shadow-sm d-flex align-items-center justify-content-center ${isDisliked ? 'btn-danger text-white' : 'btn-dark bg-opacity-75 text-danger border-danger'} ${className}`}
      style={{ width: "28px", height: "28px", zIndex: 10, padding: 0 }}
      onClick={handleToggle}
      title={isDisliked ? "Remove from Dislikes" : "Dislike"}
    >
      <i className={`bi ${isDisliked ? 'bi-hand-thumbs-down-fill' : 'bi-hand-thumbs-down'}`} style={{ fontSize: "0.8rem" }}></i>
    </button>
  );
};

export default React.memo(DislikeButton);
