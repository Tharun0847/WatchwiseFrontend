import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPopularMovies, fetchTopAnime, fetchMoviesByGenre, fetchAnimeByGenre, fetchMovieGenres, fetchAnimeGenres } from "../services/mediaAPI";
import { getWatchlist } from "../services/watchlistAPI";
import { useSelector } from "react-redux";
import { useGetFavoritesQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } from "../services/favoriteAPI";
import axios from "axios";
import { API_BASE_URL } from "../config";

function Home() {
  const { user } = useSelector((state) => state.userReducer);
  const [popularMovies, setPopularMovies] = useState([]);
  const [topAnime, setTopAnime] = useState([]);
  const [loading, setLoading] = useState(true);

  // Favorite Hooks
  const { data: favorites } = useGetFavoritesQuery(user?.id, { skip: !user?.id });
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let effectiveGenres = [...(user?.preferences?.genres || [])];
        let watchlistPromise, favoritesPromise;

        if (user?.id) {
          watchlistPromise = getWatchlist(user.id);
          favoritesPromise = axios.get(`${API_BASE_URL}/favorites/${user.id}`);
        }

        const [wRes, fRes] = await Promise.all([
          watchlistPromise || Promise.resolve({ data: [] }),
          favoritesPromise || Promise.resolve({ data: [] })
        ]);

        const watchlist = wRes.data;
        const currentFavorites = fRes.data;
        const watchlistIds = new Set(watchlist.map(item => item.contentId));

        // 1. Calculate dynamic interests based on behavior
        const behaviorGenres = {};
        [...watchlist, ...currentFavorites].forEach(item => {
          item.genres?.forEach(g => {
            behaviorGenres[g] = (behaviorGenres[g] || 0) + 1;
          });
        });

        // 2. Combine with initial interests (give them a base weight)
        effectiveGenres.forEach(g => {
          behaviorGenres[g] = (behaviorGenres[g] || 0) + 2; // Weight initial interests slightly higher
        });

        // 3. Sort genres by "interest score"
        const sortedInterests = Object.entries(behaviorGenres)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0]);

        let moviesPromise, animePromise;

        if (sortedInterests.length > 0) {
          const [mGenresRes, aGenresRes] = await Promise.all([
            fetchMovieGenres(),
            fetchAnimeGenres()
          ]);

          // Find IDs for the top interested genres
          const movieGenreId = mGenresRes.data.genres.find(g => sortedInterests.includes(g.name))?.id;
          const animeGenreId = aGenresRes.data.data.find(g => sortedInterests.includes(g.name))?.mal_id;

          moviesPromise = movieGenreId ? fetchMoviesByGenre(movieGenreId) : fetchPopularMovies();
          await new Promise(r => setTimeout(r, 500));
          animePromise = animeGenreId ? fetchAnimeByGenre(animeGenreId) : fetchTopAnime();
        } else {
          moviesPromise = fetchPopularMovies();
          await new Promise(r => setTimeout(r, 500));
          animePromise = fetchTopAnime();
        }

        const [mRes, aRes] = await Promise.all([moviesPromise, animePromise]);
        
        const filteredMovies = (mRes.data.results || mRes.data.data || [])
          .filter(m => !watchlistIds.has(String(m.id)));
          
        const filteredAnime = (aRes.data.data || aRes.data.results || [])
          .filter(a => !watchlistIds.has(String(a.mal_id)));
        
        setPopularMovies(filteredMovies.slice(0, 6));
        setTopAnime(filteredAnime.slice(0, 6));
        setLoading(false);
      } catch (error) {
        console.error("Error loading home data", error);
        setLoading(false);
      }
    };
    loadData();
  }, [user?.preferences, user?.id]);

  const handleToggleFavorite = async (e, item, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.id) return alert("Please login to use favorites");
    
    const itemId = String(item.id || item.mal_id);
    const existingFav = favorites?.find(f => f.contentId === itemId);
    
    try {
      if (existingFav) {
        await removeFavorite(existingFav._id).unwrap();
      } else {
        await addFavorite({
          userId: user.id,
          contentId: itemId,
          title: item.title || item.name,
          image: type === 'movie' 
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
            : item.images.jpg.large_image_url,
          rating: item.vote_average || item.score || 0,
          genres: [], // Genres might need more complex fetching if needed here
          type: type
        }).unwrap();
      }
    } catch (err) {
      alert("Error toggling favorite");
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section text-center py-5 mb-5 bg-dark text-light rounded shadow-sm border border-secondary">
        <div className="container">
          <h1 className="display-3 fw-bold text-info mb-3">WatchWise</h1>
          <p className="lead mb-4 opacity-75">
            {user?.preferences?.genres?.length > 0 
              ? `Personalized for you: Exploring ${user.preferences.genres.slice(0,3).join(', ')} and more.`
              : "Your personalized media recommendation engine. Deep analysis of your taste."}
          </p>
          {user ? (
            <div className="d-flex justify-content-center gap-3">
              <Link to="/movies" className="btn btn-info btn-lg px-5 rounded-pill fw-bold text-dark">Explore Movies</Link>
              <Link to="/anime" className="btn btn-outline-info btn-lg px-5 rounded-pill fw-bold">Explore Anime</Link>
            </div>
          ) : (
            <Link to="/signup" className="btn btn-info btn-lg px-5 rounded-pill fw-bold text-dark">Get Started for Free</Link>
          )}
        </div>
      </section>

      {/* Features Summary */}
      <section className="features-summary mb-5">
        <div className="row g-4 text-center">
          <div className="col-md-4">
            <Link to="/movies" state={{ focusSearch: true }} className="text-decoration-none h-100">
              <div className="p-4 bg-dark text-light rounded border border-secondary h-100 shadow-sm movie-card">
                <div className="fs-1 text-info mb-3">🔍</div>
                <h3 className="h4 text-info">Smart Discovery</h3>
                <p className="opacity-75">Find your next favorite movie or anime using our advanced search and filtering system.</p>
              </div>
            </Link>
          </div>
          <div className="col-md-4">
            <Link to="/watchlist" className="text-decoration-none h-100">
              <div className="p-4 bg-dark text-light rounded border border-secondary h-100 shadow-sm movie-card">
                <div className="fs-1 text-success mb-3">📊</div>
                <h3 className="h4 text-success">Track Progress</h3>
                <p className="opacity-75">Organize your library with custom statuses: Plan to Watch, Currently Watching, and Completed.</p>
              </div>
            </Link>
          </div>
          <div className="col-md-4">
            <Link to="/analytics" className="text-decoration-none h-100">
              <div className="p-4 bg-dark text-light rounded border border-secondary h-100 shadow-sm movie-card">
                <div className="fs-1 text-warning mb-3">📊</div>
                <h3 className="h4 text-warning">Visual Analytics</h3>
                <p className="opacity-75">Get deep insights into your viewing patterns with interactive charts and behavioral analysis.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Recommended Content */}
      <section className="trending-section mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-light border-start border-info border-4 ps-3">
            {user?.id ? "Recommended Movies" : "Trending Movies"}
          </h2>
          <Link to="/movies" className="text-info text-decoration-none">View All &rarr;</Link>
        </div>
        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-3">
          {loading ? (
             [...Array(6)].map((_, i) => (
                <div key={i} className="col">
                  <div className="card h-100 bg-dark border-secondary skeleton" style={{ height: "250px" }}></div>
                </div>
              ))
          ) : (
            popularMovies.map(movie => {
              const isFav = favorites?.some(f => f.contentId === String(movie.id));
              return (
                <div key={movie.id} className="col">
                  <div className="position-relative">
                    <button 
                      className={`btn btn-sm rounded-circle position-absolute top-0 end-0 m-2 shadow-sm d-flex align-items-center justify-content-center ${isFav ? 'btn-info text-dark' : 'btn-dark bg-opacity-75 text-info border-info'}`}
                      style={{ width: "28px", height: "32px", zIndex: 10, padding: "0" }}
                      onClick={(e) => handleToggleFavorite(e, movie, 'movie')}
                    >
                      <i className={`bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}`} style={{ fontSize: "0.9rem" }}></i>
                    </button>
                    <Link to={`/details/movie/${movie.id}`} className="text-decoration-none">
                      <div className="card h-100 bg-dark text-light border-secondary movie-card shadow-sm">
                        <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} className="card-img-top" alt={movie.title} />
                        <div className="card-body p-2 text-center">
                          <p className="card-title text-info small text-truncate mb-0" title={movie.title}>{movie.title}</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="trending-section mb-5 pb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-light border-start border-success border-4 ps-3">
            {user?.id ? "Recommended Anime" : "Top Anime"}
          </h2>
          <Link to="/anime" className="text-success text-decoration-none">View All &rarr;</Link>
        </div>
        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-3">
          {loading ? (
             [...Array(6)].map((_, i) => (
                <div key={i} className="col">
                  <div className="card h-100 bg-dark border-secondary skeleton" style={{ height: "250px" }}></div>
                </div>
              ))
          ) : (
            topAnime.map(anime => {
              const isFav = favorites?.some(f => f.contentId === String(anime.mal_id));
              return (
                <div key={anime.mal_id} className="col">
                  <div className="position-relative">
                    <button 
                      className={`btn btn-sm rounded-circle position-absolute top-0 end-0 m-2 shadow-sm d-flex align-items-center justify-content-center ${isFav ? 'btn-info text-dark' : 'btn-dark bg-opacity-75 text-info border-info'}`}
                      style={{ width: "28px", height: "32px", zIndex: 10, padding: "0" }}
                      onClick={(e) => handleToggleFavorite(e, anime, 'anime')}
                    >
                      <i className={`bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}`} style={{ fontSize: "0.9rem" }}></i>
                    </button>
                    <Link to={`/details/anime/${anime.mal_id}`} className="text-decoration-none">
                      <div className="card h-100 bg-dark text-light border-secondary movie-card shadow-sm">
                        <img src={anime.images.jpg.image_url} className="card-img-top" alt={anime.title} style={{ height: "220px", objectFit: "cover" }} />
                        <div className="card-body p-2 text-center">
                          <p className="card-title text-success small text-truncate mb-0" title={anime.title}>{anime.title}</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
