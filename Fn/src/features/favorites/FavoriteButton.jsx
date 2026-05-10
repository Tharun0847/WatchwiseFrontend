import React from "react";
import { useSelector } from "react-redux";
import { useGetFavoritesQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } from "../../services/favoriteAPI";
import { useNavigate } from "react-router-dom";

const FavoriteButton = ({ item, type, genres = [], className = "" }) => {
  const { user } = useSelector((state) => state.userReducer);
  const navigate = useNavigate();
  
  const { data: favorites } = useGetFavoritesQuery(user?.id, { skip: !user?.id });
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  const itemId = String(item.id || item.mal_id || item.contentId);
  const isFav = favorites?.some(f => f.contentId === itemId);
  const existingFav = favorites?.find(f => f.contentId === itemId);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user?.id) {
      alert("Please login to use favorites");
      return navigate("/login");
    }

    try {
      if (existingFav) {
        await removeFavorite(existingFav._id).unwrap();
      } else {
        // Map genres properly based on source
        let mappedGenres = [];
        if (item.genres && Array.isArray(item.genres)) {
           // If genres is already an array of names or objects with name
           mappedGenres = typeof item.genres[0] === 'string' 
            ? item.genres 
            : item.genres.map(g => g.name).filter(Boolean);
        } else if (type === 'movie' && item.genre_ids) {
          // If genre_ids exists (TMDB list results)
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

        await addFavorite({
          userId: user.id,
          contentId: itemId,
          title: item.title || item.name,
          image: image,
          rating: item.vote_average || item.score || item.rating || 0,
          genres: mappedGenres,
          type: type
        }).unwrap();
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
    }
  };

  return (
    <button 
      className={`btn btn-sm rounded-circle shadow-sm d-flex align-items-center justify-content-center ${isFav ? 'btn-info text-dark' : 'btn-dark bg-opacity-75 text-info border-info'} ${className}`}
      style={{ width: "28px", height: "28px", zIndex: 10, padding: 0 }}
      onClick={handleToggle}
      title={isFav ? "Remove from Favorites" : "Add to Favorites"}
    >
      <i className={`bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}`} style={{ fontSize: "0.8rem" }}></i>
    </button>
  );
};

export default React.memo(FavoriteButton);
