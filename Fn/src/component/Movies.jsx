import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { addToWatchlist, getWatchlist } from "../services/watchlistAPI";
import { fetchPopularMovies, searchMovies, fetchMovieGenres, fetchMoviesByGenre } from "../services/mediaAPI";
import { useGetFavoritesQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } from "../services/favoriteAPI";

function Movies() {
  const { user } = useSelector((state) => state.userReducer);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef(null);

  // Favorite Hooks
  const { data: favorites } = useGetFavoritesQuery(user?.id, { skip: !user?.id });
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  // Source of truth from URL
  const urlQuery = searchParams.get("q") || "";
  const urlGenre = searchParams.get("genre") || "";

  const [movies, setMovies] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [genres, setGenres] = useState([]);
  const [searchInput, setSearchInput] = useState(urlQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isFirstMount = useRef(true);

  // 1. Fetch genres once
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetchMovieGenres();
        setGenres(res.data.genres);
      } catch (err) {
        console.error("Genre fetch failed", err);
      }
    };
    fetchGenres();
  }, []);

  // 1.5 Handle focus from navigation state
  useEffect(() => {
    if (location.state?.focusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [location.state, loading]);

  // 2. Main data fetcher
  const fetchData = async (query, genre) => {
    setLoading(true);
    try {
      let res, watchlistRes;
      if (query && query.length > 2) {
        res = await searchMovies(query);
      } else if (genre) {
        res = await fetchMoviesByGenre(genre);
      } else {
        res = await fetchPopularMovies();
      }
      setMovies(res.data.results);

      // Fetch recommendations if on default view
      if (!query && !genre && user?.preferences?.genres?.length > 0) {
        const movieGenreId = genres.find(g => user.preferences.genres.includes(g.name))?.id;
        if (movieGenreId) {
          if (user?.id) {
            watchlistRes = await getWatchlist(user.id);
          }
          const recRes = await fetchMoviesByGenre(movieGenreId);
          const watchlistIds = new Set(watchlistRes?.data.map(item => item.contentId) || []);
          
          const filteredRecs = (recRes.data.results || [])
            .filter(m => !watchlistIds.has(String(m.id)));
            
          setRecommended(filteredRecs.slice(0, 4));
        }
      } else {
        setRecommended([]);
      }

      setLoading(false);
    } catch {
      setError("Failed to fetch movies. Check your TMDB Key.");
      setLoading(false);
    }
  };

  // 3. Sync with URL changes
  useEffect(() => {
    if (genres.length > 0) {
      fetchData(urlQuery, urlGenre);
      setSearchInput(urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery, urlGenre, genres]);

  // 4. Update URL from Input (Debounced)
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

  const handleAdd = async (e, movie) => {
    e.stopPropagation();
    if (!user.id) return alert("Please login to add to watchlist");

    try {
      const item = {
        userId: user.id,
        contentId: movie.id.toString(),
        title: movie.title,
        image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='sans-serif' font-size='20'%3ENo Image%3C/text%3E%3C/svg%3E",
        rating: movie.vote_average || 0,
        genres: movie.genre_ids?.map(id => genres.find(g => g.id === id)?.name).filter(Boolean) || [],
        type: "movie"
      };
      const res = await addToWatchlist(item);
      if (res.status === 201) alert(`${movie.title} added!`);
    } catch (error) {
      alert(error.response?.data?.message || "Error adding to watchlist");
    }
  };

  const handleToggleFavorite = async (e, movie) => {
    e.stopPropagation();
    if (!user?.id) return alert("Please login to use favorites");
    
    const existingFav = favorites?.find(f => f.contentId === movie.id.toString());
    
    try {
      if (existingFav) {
        await removeFavorite(existingFav._id).unwrap();
      } else {
        await addFavorite({
          userId: user.id,
          contentId: movie.id.toString(),
          title: movie.title,
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "",
          rating: movie.vote_average || 0,
          genres: movie.genre_ids?.map(id => genres.find(g => g.id === id)?.name).filter(Boolean) || [],
          type: "movie"
        }).unwrap();
      }
    } catch (err) {
      alert("Error toggling favorite");
    }
  };

  if (loading && movies.length === 0) return <div className="text-center mt-5 text-light">Loading Movies...</div>;
  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;

  return (
    <div className="container py-4">
      <div className="row mb-4 align-items-center g-3">
        <div className="col-md-4">
          <h2 className="text-light mb-0">Discover Movies</h2>
        </div>
        <div className="col-md-3">
          <select 
            className="form-select bg-dark text-light border-secondary"
            value={urlGenre}
            onChange={handleGenreChange}
          >
            <option value="">All Genres</option>
            {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="col-md-5">
          <div className="input-group">
            <input 
              type="text" 
              className="form-control bg-dark text-light border-secondary" 
              placeholder="Search movies..." 
              value={searchInput}
              ref={searchInputRef}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading && movies.length === 0 ? (
        <div className="text-center py-5 text-info">Loading results...</div>
      ) : (
        <>
          {/* Recommended Section */}
          {recommended.length > 0 && !urlQuery && !urlGenre && (
            <div className="mb-5 animate-fade-in">
              <h3 className="text-info border-start border-4 border-info ps-3 mb-4">Recommended for You</h3>
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
                {recommended.map((movie) => {
                  const isFav = favorites?.some(f => f.contentId === movie.id.toString());
                  return (
                    <div key={`rec-${movie.id}`} className="col">
                      <div 
                        className="card h-100 bg-dark text-light border-info border-opacity-50 shadow-sm movie-card position-relative"
                        onClick={() => navigate(`/details/movie/${movie.id}`)}
                      >
                        <button 
                          className={`btn btn-sm rounded-circle position-absolute top-0 end-0 m-2 shadow-sm d-flex align-items-center justify-content-center ${isFav ? 'btn-info text-dark' : 'btn-dark bg-opacity-75 text-info border-info'}`}
                          style={{ width: "32px", height: "32px", zIndex: 10 }}
                          onClick={(e) => handleToggleFavorite(e, movie)}
                        >
                          <i className={`bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                        </button>
                        <img 
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='sans-serif' font-size='20'%3ENo Image%3C/text%3E%3C/svg%3E"} 
                          className="card-img-top" 
                          alt={movie.title} 
                        />
                        <div className="card-body">
                          <h5 className="card-title text-info text-truncate">{movie.title}</h5>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="badge bg-info text-dark">Matched Choice</span>
                            <span className="text-warning">★ {movie.vote_average.toFixed(1)}</span>
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
            {urlQuery ? `Results for "${urlQuery}"` : urlGenre ? "Genre Matches" : "Trending Movies"}
          </h3>

          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
          {movies.map((movie) => {
            const isFav = favorites?.some(f => f.contentId === movie.id.toString());
            return (
              <div key={movie.id} className="col">
                <div 
                  className="card h-100 bg-dark text-light border-secondary shadow-sm movie-card position-relative"
                  onClick={() => navigate(`/details/movie/${movie.id}`)}
                >
                  <button 
                    className={`btn btn-sm rounded-circle position-absolute top-0 end-0 m-2 shadow-sm d-flex align-items-center justify-content-center ${isFav ? 'btn-info text-dark' : 'btn-dark bg-opacity-75 text-info border-info'}`}
                    style={{ width: "32px", height: "32px", zIndex: 10 }}
                    onClick={(e) => handleToggleFavorite(e, movie)}
                  >
                    <i className={`bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                  </button>
                  <img 
                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='sans-serif' font-size='20'%3ENo Image%3C/text%3E%3C/svg%3E"} 
                    className="card-img-top" 
                    alt={movie.title} 
                  />
                  <div className="card-body">
                    <h5 className="card-title text-info text-truncate" title={movie.title}>{movie.title}</h5>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="badge bg-secondary text-light">{movie.release_date?.split("-")[0]}</span>
                      <span className="text-warning">★ {movie.vote_average.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="card-footer border-secondary bg-transparent">
                    <button 
                      className="btn btn-outline-info btn-sm w-100"
                      onClick={(e) => handleAdd(e, movie)}
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
      )}
    </div>
  );
}

export default Movies;
