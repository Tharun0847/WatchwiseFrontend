import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchPopularMovies, fetchTopAnime, fetchMoviesByGenre, fetchAnimeByGenre, fetchMovieGenres, fetchAnimeGenres } from "../../services/mediaAPI";
import { useGetWatchlistQuery } from "../../services/watchlistAPI";
import { useGetFavoritesQuery } from "../../services/favoriteAPI";
import { useSelector } from "react-redux";
import FavoriteButton from "../favorites/FavoriteButton";
import WatchlistButton from "../watchlist/WatchlistButton";
import OptimizedImage from "../../common/OptimizedImage";

const SAFE_GENRES_TO_EXCLUDE = ["Hentai", "Erotica", "Boys Love", "Girls Love", "Ecchi", "Sexual Violence"];

function Home() {
  const { user } = useSelector((state) => state.userReducer);
  const [popularMovies, setPopularMovies] = useState([]);
  const [topAnime, setTopAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movieGenres, setMovieGenres] = useState([]);
  const [animeGenres, setAnimeGenres] = useState([]);

  // Use RTK Query hooks for automatic caching and stability
  const { data: watchlistData } = useGetWatchlistQuery(user?.id, { skip: !user?.id });
  const { data: favoritesData } = useGetFavoritesQuery(user?.id, { skip: !user?.id });

  const prefString = JSON.stringify(user?.preferences || {});
  const userId = user?.id;
  const watchlistStr = JSON.stringify(watchlistData || []);
  const favoritesStr = JSON.stringify(favoritesData || []);

  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Prevent re-running if data is already loaded for this specific user/preferences combination
    // unless watchlist or favorites actually changed.
    const loadData = async () => {
      setLoading(true);
      try {
        const preferences = user?.preferences || {};
        let effectiveGenres = [...(preferences.genres || [])];

        const [mGenresRes, aGenresRes] = await Promise.all([
          fetchMovieGenres(),
          fetchAnimeGenres()
        ]);

        const watchlist = JSON.parse(watchlistStr);
        const currentFavorites = JSON.parse(favoritesStr);
        const watchlistIds = new Set(watchlist.map(item => String(item.contentId)));
        
        setMovieGenres(mGenresRes.data.genres);
        setAnimeGenres(aGenresRes.data.data);

        // ... (genre scoring logic remains the same)
        const behaviorGenres = {};
        watchlist.forEach(item => {
          item.genres?.forEach(g => {
            if (!SAFE_GENRES_TO_EXCLUDE.includes(g)) {
              behaviorGenres[g] = (behaviorGenres[g] || 0) + 2;
            }
          });
        });

        currentFavorites.forEach(item => {
          item.genres?.forEach(g => {
            if (!SAFE_GENRES_TO_EXCLUDE.includes(g)) {
              behaviorGenres[g] = (behaviorGenres[g] || 0) + 5;
            }
          });
        });

        effectiveGenres.forEach(g => {
          if (!SAFE_GENRES_TO_EXCLUDE.includes(g)) {
            behaviorGenres[g] = (behaviorGenres[g] || 0) + 1;
          }
        });

        const sortedInterests = Object.entries(behaviorGenres)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0]);

        let moviesPromise, animePromise;

        if (sortedInterests.length > 0) {
          const topMovieGenreIds = sortedInterests
            .map(interest => mGenresRes.data.genres.find(g => g.name === interest)?.id)
            .filter(Boolean)
            .slice(0, 3)
            .join('|');

          const topAnimeGenreIds = sortedInterests
            .map(interest => aGenresRes.data.data.find(g => g.name === interest)?.mal_id)
            .filter(Boolean)
            .slice(0, 3)
            .join(',');

          moviesPromise = topMovieGenreIds ? fetchMoviesByGenre(topMovieGenreIds) : fetchPopularMovies();
          await new Promise(r => setTimeout(r, 400));
          animePromise = topAnimeGenreIds ? fetchAnimeByGenre(topAnimeGenreIds) : fetchTopAnime();
        } else {
          moviesPromise = fetchPopularMovies();
          await new Promise(r => setTimeout(r, 400));
          animePromise = fetchTopAnime();
        }

        const [mRes, aRes] = await Promise.all([moviesPromise, animePromise]);
        
        const isSafe = (item) => {
          if (item.adult) return false;
          const rating = item.rating;
          if (rating && typeof rating === 'string' && (rating.includes("Rx") || rating.includes("R+"))) return false;

          const unsafeKeywords = ["nude", "sex", "porn", "adult", "erotica"]; // Simplified for performance
          const textToSearch = `${item.title || item.name} ${item.overview || item.synopsis || ""}`.toLowerCase();
          if (unsafeKeywords.some(word => textToSearch.includes(word))) return false;

          return true;
        };

        const filteredMovies = (mRes.data.results || mRes.data.data || [])
          .filter(m => !watchlistIds.has(String(m.id)))
          .filter(isSafe);
          
        const filteredAnime = (aRes.data.data || aRes.data.results || [])
          .filter(a => !watchlistIds.has(String(a.mal_id)))
          .filter(isSafe);
        
        setPopularMovies(filteredMovies.slice(0, 12));
        setTopAnime(filteredAnime.slice(0, 12));
        setLoading(false);
        setDataLoaded(true);
      } catch (error) {
        console.error("Error loading home data", error);
        setLoading(false);
      }
    };

    loadData();
  }, [prefString, userId, watchlistStr, favoritesStr]);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section text-center py-4 py-md-5 mb-5 bg-dark text-light rounded shadow-sm border border-secondary">
        <div className="container px-3">
          <h1 className="display-3 fw-bold text-info mb-2 mb-md-3">WatchWise</h1>
          <p className="lead mb-4 opacity-75 small text-md-center px-lg-5 mx-lg-5">
            {user?.preferences?.genres?.length > 0 
              ? `Personalized for you: Exploring ${user.preferences.genres.slice(0,3).join(', ')} and more.`
              : "Your personalized media recommendation engine. Deep analysis of your taste."}
          </p>
          {user ? (
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 gap-sm-3 px-2">
              <Link to="/movies" className="btn btn-info btn-lg px-4 px-md-5 rounded-pill fw-bold text-dark w-100 w-sm-auto">Explore Movies</Link>
              <Link to="/anime" className="btn btn-outline-info btn-lg px-4 px-md-5 rounded-pill fw-bold w-100 w-sm-auto">Explore Anime</Link>
            </div>
          ) : (
            <div className="px-2">
              <Link to="/signup" className="btn btn-info btn-lg px-5 rounded-pill fw-bold text-dark w-100 w-sm-auto">Get Started for Free</Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Summary */}
      <section className="features-summary mb-5">
        <div className="row g-3 g-md-4 text-center">
          <div className="col-md-4">
            <Link to="/movies" state={{ focusSearch: true }} className="text-decoration-none h-100">
              <div className="p-4 bg-dark text-light rounded border border-secondary h-100 shadow-sm movie-card">
                <div className="fs-1 text-info mb-3">🔍</div>
                <h3 className="h4 text-info">Smart Discovery</h3>
                <p className="opacity-75 small">Find your next favorite movie or anime using our advanced search and filtering system.</p>
              </div>
            </Link>
          </div>
          <div className="col-md-4">
            <Link to="/watchlist" className="text-decoration-none h-100">
              <div className="p-4 bg-dark text-light rounded border border-secondary h-100 shadow-sm movie-card">
                <div className="fs-1 text-success mb-3">📊</div>
                <h3 className="h4 text-success">Track Progress</h3>
                <p className="opacity-75 small">Organize your library with custom statuses: Plan to Watch, Currently Watching, and Completed.</p>
              </div>
            </Link>
          </div>
          <div className="col-md-4">
            <Link to="/profile" className="text-decoration-none h-100">
              <div className="p-4 bg-dark text-light rounded border border-secondary h-100 shadow-sm movie-card">
                <div className="fs-1 text-warning mb-3">📊</div>
                <h3 className="h4 text-warning">Visual Analytics</h3>
                <p className="opacity-75 small">Get deep insights into your viewing patterns with interactive charts and behavioral analysis.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Recommended Content */}
      <section className="trending-section mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4 px-1">
          <h2 className="text-light border-start border-info border-4 ps-3 h4 h-md-2 mb-0">
            {user?.id ? "Recommended Movies" : "Trending Movies"}
          </h2>
          <Link to="/movies" className="text-info text-decoration-none small">View All &rarr;</Link>
        </div>
        <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-2 g-md-3">
          {loading ? (
             [...Array(12)].map((_, i) => (
                <div key={i} className="col">
                  <div className="card h-100 bg-dark border-secondary skeleton" style={{ height: "300px" }}></div>
                </div>
              ))
          ) : (
            popularMovies.map(movie => {
              return (
                <div key={movie.id} className="col">
                  <div className="position-relative">
                    <FavoriteButton 
                      item={movie} 
                      type="movie" 
                      genres={movieGenres} 
                      className="position-absolute top-0 end-0 m-1 m-md-2" 
                    />
                    <Link to={`/details/movie/${movie.id}`} className="text-decoration-none">
                      <div className="card h-100 bg-dark text-light border-secondary movie-card shadow-sm">
                        <OptimizedImage 
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : null} 
                          alt={movie.title} 
                          className="card-img-top"
                          style={{ height: "auto", aspectRatio: "2/3" }}
                        />
                        <div className="card-body p-1 p-md-2 text-center">
                          <p className="card-title text-info x-small text-truncate mb-2" title={movie.title}>{movie.title}</p>
                          <WatchlistButton item={movie} type="movie" genres={movieGenres} variant="icon" />
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
        <div className="d-flex justify-content-between align-items-center mb-4 px-1">
          <h2 className="text-light border-start border-success border-4 ps-3 h4 h-md-2 mb-0">
            {user?.id ? "Recommended Anime" : "Top Anime"}
          </h2>
          <Link to="/anime" className="text-success text-decoration-none small">View All &rarr;</Link>
        </div>
        <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-2 g-md-3">
          {loading ? (
             [...Array(12)].map((_, i) => (
                <div key={i} className="col">
                  <div className="card h-100 bg-dark border-secondary skeleton" style={{ height: "300px" }}></div>
                </div>
              ))
          ) : (
            topAnime.map(anime => {
              return (
                <div key={anime.mal_id} className="col">
                  <div className="position-relative">
                    <FavoriteButton 
                      item={anime} 
                      type="anime" 
                      genres={animeGenres} 
                      className="position-absolute top-0 end-0 m-1 m-md-2" 
                    />
                    <Link to={`/details/anime/${anime.mal_id}`} className="text-decoration-none">
                      <div className="card h-100 bg-dark text-light border-secondary movie-card shadow-sm">
                        <OptimizedImage 
                          src={anime.images?.jpg?.image_url || null} 
                          alt={anime.title} 
                          className="card-img-top"
                          style={{ height: "auto", aspectRatio: "2/3" }}
                        />
                        <div className="card-body p-1 p-md-2 text-center">
                          <p className="card-title text-success x-small text-truncate mb-2" title={anime.title}>{anime.title}</p>
                          <WatchlistButton item={anime} type="anime" genres={animeGenres} variant="icon" />
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
