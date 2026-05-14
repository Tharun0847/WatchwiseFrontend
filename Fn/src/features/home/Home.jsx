import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchPopularMovies, fetchTopAnime, fetchMoviesByGenre, fetchAnimeByGenre, fetchMovieGenres, fetchAnimeGenres } from "../../services/mediaAPI";
import { useGetWatchlistQuery } from "../../services/watchlistAPI";
import { useGetFavoritesQuery } from "../../services/favoriteAPI";
import { useSelector } from "react-redux";
import FavoriteButton from "../favorites/FavoriteButton";
import WatchlistButton from "../watchlist/WatchlistButton";
import OptimizedImage from "../../common/OptimizedImage";
import MediaSkeleton from "../../common/MediaSkeleton";
import { SAFE_GENRES_TO_EXCLUDE } from "../../utils/mediaHelpers";

function Home() {
  const { user } = useSelector((state) => state.userReducer);
  const [popularMovies, setPopularMovies] = useState([]);
  const [topAnime, setTopAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movieGenres, setMovieGenres] = useState([]);
  const [animeGenres, setAnimeGenres] = useState([]);
  const [error, setError] = useState(null);

  const { data: watchlistData } = useGetWatchlistQuery(user?.id, { skip: !user?.id });
  const { data: favoritesData } = useGetFavoritesQuery(user?.id, { skip: !user?.id });

  const watchlist = useMemo(() => watchlistData || [], [watchlistData]);
  const currentFavorites = useMemo(() => favoritesData || [], [favoritesData]);
  const userPreferences = useMemo(() => user?.preferences || {}, [user?.preferences]);

  const isSafe = useCallback((item) => {
    if (item.adult) return false;
    const rating = item.rating || "";
    if (typeof rating === 'string' && (rating.includes("Rx") || rating.includes("R+"))) return false;

    const unsafeKeywords = ["nude", "sex", "porn", "adult", "erotica"];
    const textToSearch = `${item.title || item.name || ""} ${item.overview || item.synopsis || ""}`.toLowerCase();
    if (unsafeKeywords.some(word => textToSearch.includes(word))) return false;

    return true;
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch Genres First (Parallel)
        const [mGenresRes, aGenresRes] = await Promise.allSettled([
          fetchMovieGenres(),
          fetchAnimeGenres()
        ]);

        const mGenres = mGenresRes.status === 'fulfilled' ? (mGenresRes.value.data.genres || []) : [];
        const aGenres = aGenresRes.status === 'fulfilled' ? (aGenresRes.value.data.data || []) : [];
        
        setMovieGenres(mGenres);
        setAnimeGenres(aGenres);

        // 2. Calculate Interests
        const watchlistIds = new Set(watchlist.map(item => String(item.contentId)));
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

        (userPreferences.genres || []).forEach(g => {
          if (!SAFE_GENRES_TO_EXCLUDE.includes(g)) {
            behaviorGenres[g] = (behaviorGenres[g] || 0) + 1;
          }
        });

        const sortedInterests = Object.entries(behaviorGenres)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0]);

        // 3. Construct Fetch Promises
        let moviesPromise, animePromise;

        if (sortedInterests.length > 0 && mGenres.length > 0 && aGenres.length > 0) {
          const topMovieGenreIds = sortedInterests
            .map(interest => mGenres.find(g => g.name === interest)?.id)
            .filter(Boolean)
            .slice(0, 3)
            .join('|');

          const topAnimeGenreIds = sortedInterests
            .map(interest => aGenres.find(g => g.name === interest)?.mal_id)
            .filter(Boolean)
            .slice(0, 3)
            .join(',');

          moviesPromise = topMovieGenreIds ? fetchMoviesByGenre(topMovieGenreIds) : fetchPopularMovies();
          // Small delay for Jikan rate limit protection
          animePromise = (async () => {
            await new Promise(r => setTimeout(r, 600));
            return topAnimeGenreIds ? fetchAnimeByGenre(topAnimeGenreIds) : fetchTopAnime();
          })();
        } else {
          moviesPromise = fetchPopularMovies();
          animePromise = (async () => {
            await new Promise(r => setTimeout(r, 600));
            return fetchTopAnime();
          })();
        }

        // 4. Execute Fetching (Parallel with individual catch)
        const [mResSettled, aResSettled] = await Promise.allSettled([moviesPromise, animePromise]);
        
        if (mResSettled.status === 'fulfilled') {
          const mData = mResSettled.value.data.results || mResSettled.value.data.data || [];
          setPopularMovies(mData.filter(m => !watchlistIds.has(String(m.id))).filter(isSafe).slice(0, 6));
        } else {
          console.error("Movie fetch failed", mResSettled.reason);
        }

        if (aResSettled.status === 'fulfilled') {
          const aData = aResSettled.value.data.data || aResSettled.value.data.results || [];
          setTopAnime(aData.filter(a => !watchlistIds.has(String(a.mal_id))).filter(isSafe).slice(0, 6));
        } else {
          console.error("Anime fetch failed", aResSettled.reason);
        }

      } catch (err) {
        console.error("Home data loading failed", err);
        setError("Failed to load recommendations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user?.id, userPreferences, watchlist, currentFavorites, isSafe]);

  if (error && popularMovies.length === 0 && topAnime.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger bg-dark text-danger border-danger">
          <h4 className="alert-heading">Discovery Interrupted</h4>
          <p>{error}</p>
          <button className="btn btn-outline-danger mt-3" onClick={() => window.location.reload()}>Retry Discovery</button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section text-center py-4 py-md-5 mb-5 bg-dark text-light rounded shadow-sm border border-secondary">
        <div className="container px-3">
          <h1 className="display-3 fw-bold text-info mb-2 mb-md-3">WatchWise</h1>
          <p className="lead mb-4 opacity-75 small text-md-center px-lg-5 mx-lg-5">
            {userPreferences.genres?.length > 0 
              ? `Personalized for you: Exploring ${userPreferences.genres.slice(0,3).join(', ')} and more.`
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
            <Link to="/movies" className="text-decoration-none h-100" state={{ focusSearch: true }}>
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
                <div className="fs-1 text-warning mb-3">📈</div>
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
        {loading && popularMovies.length === 0 ? (
          <MediaSkeleton count={6} />
        ) : (
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-2 g-md-3">
            {popularMovies.length > 0 ? popularMovies.map(movie => (
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
            )) : !loading && <p className="text-muted ps-3">No movie recommendations found right now.</p>}
          </div>
        )}
      </section>

      {/* Recommended Anime Section */}
      <section className="trending-section mb-5 pb-5">
        <div className="d-flex justify-content-between align-items-center mb-4 px-1">
          <h2 className="text-light border-start border-success border-4 ps-3 h4 h-md-2 mb-0">
            {user?.id ? "Recommended Anime" : "Top Anime"}
          </h2>
          <Link to="/anime" className="text-success text-decoration-none small">View All &rarr;</Link>
        </div>
        {loading && topAnime.length === 0 ? (
          <MediaSkeleton count={6} />
        ) : (
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-2 g-md-3">
            {topAnime.length > 0 ? topAnime.map(anime => (
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
            )) : !loading && <p className="text-muted ps-3">No anime recommendations found right now.</p>}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
