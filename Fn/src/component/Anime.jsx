import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addToWatchlist, getWatchlist } from "../services/watchlistAPI";
import { fetchTopAnime, searchAnime, fetchAnimeGenres, fetchAnimeByGenre } from "../services/mediaAPI";
import { useGetFavoritesQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } from "../services/favoriteAPI";

function Anime() {
  const { user } = useSelector((state) => state.userReducer);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Favorite Hooks
  const { data: favorites } = useGetFavoritesQuery(user?.id, { skip: !user?.id });
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();
  
  // URL Params are the source of truth
  const urlQuery = searchParams.get("q") || "";
  const urlGenre = searchParams.get("genre") || "";

  const [animeList, setAnimeList] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [genres, setGenres] = useState([]);
  const [searchInput, setSearchInput] = useState(urlQuery);
  const [loading, setLoading] = useState(true);
  
  const isFirstMount = useRef(true);

  // 1. Fetch Genres once on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetchAnimeGenres();
        setGenres(res.data.data);
      } catch (err) {
        console.error("Failed to fetch genres", err);
      }
    };
    fetchGenres();
  }, []);

  // 2. Main Data Fetcher - Reacts to URL changes
  const fetchData = async (query, genre, retryCount = 0) => {
    setLoading(true);
    try {
      let res, watchlistRes;
      if (query && query.length > 2) {
        res = await searchAnime(query);
      } else if (genre) {
        res = await fetchAnimeByGenre(genre);
      } else {
        res = await fetchTopAnime();
      }
      setAnimeList(res.data.data);

      // Fetch recommendations sequentially
      if (!query && !genre && user?.preferences?.genres?.length > 0 && genres.length > 0) {
        const animeGenreId = genres.find(g => user.preferences.genres.includes(g.name))?.mal_id;
        if (animeGenreId) {
          if (user?.id) {
            watchlistRes = await getWatchlist(user.id);
          }
          const watchlistIds = new Set(watchlistRes?.data.map(item => item.contentId) || []);
          
          await new Promise(r => setTimeout(r, 600)); // Delay for rate limit
          const recRes = await fetchAnimeByGenre(animeGenreId);
          
          const filteredRecs = (recRes.data.data || [])
            .filter(a => !watchlistIds.has(String(a.mal_id)));
            
          setRecommended(filteredRecs.slice(0, 4));
        }
      } else {
        setRecommended([]);
      }

      setLoading(false);
    } catch (err) {
      if (err.response?.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1500;
        setTimeout(() => fetchData(query, genre, retryCount + 1), delay);
      } else {
        console.error("Fetch failed", err);
        setLoading(false);
      }
    }
  };

  // 3. React to URL changes (Back button, initial load, search submit)
  useEffect(() => {
    if (genres.length > 0) {
      fetchData(urlQuery, urlGenre);
      setSearchInput(urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery, urlGenre, genres]);

  // 4. Handle Input Changes (Debounced update to URL)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (searchInput !== urlQuery) {
        if (searchInput.trim()) {
          setSearchParams({ q: searchInput });
        } else {
          setSearchParams({});
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleGenreChange = (e) => {
    const genreId = e.target.value;
    if (genreId) {
      setSearchParams({ genre: genreId });
    } else {
      setSearchParams({});
    }
  };

  const handleAdd = async (e, anime) => {
    e.stopPropagation();
    if (!user.id) return alert("Please login to add to watchlist");
    
    try {
      const item = {
        userId: user.id,
        contentId: anime.mal_id.toString(),
        title: anime.title,
        image: anime.images.jpg.large_image_url,
        rating: anime.score || 0,
        genres: anime.genres?.map(g => g.name) || [],
        type: "anime"
      };
      const res = await addToWatchlist(item);
      if (res.status === 201) alert(`${anime.title} added!`);
    } catch (error) {
      alert(error.response?.data?.message || "Error adding to watchlist");
    }
  };

  const handleToggleFavorite = async (e, anime) => {
    e.stopPropagation();
    if (!user?.id) return alert("Please login to use favorites");
    
    const existingFav = favorites?.find(f => f.contentId === anime.mal_id.toString());
    
    try {
      if (existingFav) {
        await removeFavorite(existingFav._id).unwrap();
      } else {
        await addFavorite({
          userId: user.id,
          contentId: anime.mal_id.toString(),
          title: anime.title,
          image: anime.images.jpg.large_image_url,
          rating: anime.score || 0,
          genres: anime.genres?.map(g => g.name) || [],
          type: "anime"
        }).unwrap();
      }
    } catch (err) {
      alert("Error toggling favorite");
    }
  };

  if (loading && animeList.length === 0) return <div className="text-center py-5 text-light">Loading results...</div>;

  return (
    <div className="container py-4">
      <div className="row mb-4 align-items-center g-3">
        <div className="col-md-4">
          <h2 className="text-light mb-0">Discover Anime</h2>
        </div>
        <div className="col-md-3">
          <select 
            className="form-select bg-dark text-light border-secondary"
            value={urlGenre}
            onChange={handleGenreChange}
          >
            <option value="">All Genres</option>
            {genres.map(g => <option key={g.mal_id} value={g.mal_id}>{g.name}</option>)}
          </select>
        </div>
        <div className="col-md-5">
          <div className="input-group">
            <input 
              type="text" 
              className="form-control bg-dark text-light border-secondary" 
              placeholder="Search anime..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
      </div>

      <>
        {/* Recommended Section */}
        {recommended.length > 0 && !urlQuery && !urlGenre && (
          <div className="mb-5 animate-fade-in">
            <h3 className="text-success border-start border-4 border-success ps-3 mb-4">Recommended for You</h3>
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
              {recommended.map((anime) => {
                const isFav = favorites?.some(f => f.contentId === anime.mal_id.toString());
                return (
                  <div key={`rec-${anime.mal_id}`} className="col">
                    <div 
                      className="card h-100 bg-dark text-light border-success border-opacity-25 shadow-sm movie-card position-relative"
                      onClick={() => navigate(`/details/anime/${anime.mal_id}`)}
                    >
                      <button 
                        className={`btn btn-sm rounded-circle position-absolute top-0 end-0 m-2 shadow-sm d-flex align-items-center justify-content-center ${isFav ? 'btn-info text-dark' : 'btn-dark bg-opacity-75 text-info border-info'}`}
                        style={{ width: "32px", height: "32px", zIndex: 10 }}
                        onClick={(e) => handleToggleFavorite(e, anime)}
                      >
                        <i className={`bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                      </button>
                      <img src={anime.images.jpg.large_image_url} className="card-img-top" alt={anime.title} style={{ height: "300px", objectFit: "cover" }} />
                      <div className="card-body">
                        <h5 className="card-title text-success text-truncate">{anime.title}</h5>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="badge bg-success text-white">Top Pick</span>
                          <span className="text-warning">★ {anime.score || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <hr className="border-secondary mt-5" />
          </div>
        )}

        {/* Main Section Header */}
        <h3 className="text-light mb-4">
          {urlQuery ? `Results for "${urlQuery}"` : urlGenre ? "Genre Matches" : "Top Anime"}
        </h3>

        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
          {animeList.map((anime) => {
            const isFav = favorites?.some(f => f.contentId === anime.mal_id.toString());
            return (
              <div key={anime.mal_id} className="col">
                <div 
                  className="card h-100 bg-dark text-light border-secondary shadow-sm movie-card position-relative"
                  onClick={() => navigate(`/details/anime/${anime.mal_id}`)}
                >
                  <button 
                    className={`btn btn-sm rounded-circle position-absolute top-0 end-0 m-2 shadow-sm d-flex align-items-center justify-content-center ${isFav ? 'btn-info text-dark' : 'btn-dark bg-opacity-75 text-info border-info'}`}
                    style={{ width: "32px", height: "32px", zIndex: 10 }}
                    onClick={(e) => handleToggleFavorite(e, anime)}
                  >
                    <i className={`bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                  </button>
                  <img src={anime.images.jpg.large_image_url} className="card-img-top" alt={anime.title} style={{ height: "400px", objectFit: "cover" }} />
                  <div className="card-body">
                    <h5 className="card-title text-info text-truncate" title={anime.title}>{anime.title}</h5>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="badge bg-secondary text-light">{anime.year || anime.status}</span>
                      <span className="text-warning">★ {anime.score}</span>
                    </div>
                  </div>
                  <div className="card-footer border-secondary bg-transparent">
                    <button 
                      className="btn btn-outline-info btn-sm w-100"
                      onClick={(e) => handleAdd(e, anime)}
                    >
                      Add to Watchlist
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    </div>
  );
}

export default Anime;
