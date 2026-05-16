import React, { useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  useGetMovieGenresQuery, 
  useGetAnimeGenresQuery, 
  useGetPopularMoviesQuery, 
  useGetTopAnimeQuery, 
  useGetMoviesByGenreQuery, 
  useGetAnimeByGenreQuery 
} from "../../services/mediaAPI";
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
  const userPreferences = useMemo(() => user?.preferences || {}, [user?.preferences]);

  // 1. Fetch Basic Data
  const { data: watchlistData } = useGetWatchlistQuery(user?.id, { skip: !user?.id });
  const { data: favoritesData } = useGetFavoritesQuery(user?.id, { skip: !user?.id });
  const { data: movieGenresData } = useGetMovieGenresQuery();
  const { data: animeGenresData } = useGetAnimeGenresQuery();

  const watchlist = useMemo(() => watchlistData || [], [watchlistData]);
  const currentFavorites = useMemo(() => favoritesData || [], [favoritesData]);
  const movieGenres = useMemo(() => movieGenresData?.genres || [], [movieGenresData]);
  const animeGenres = useMemo(() => animeGenresData?.data || [], [animeGenresData]);

  const isSafe = useCallback((item) => {
    if (item.adult) return false;
    const rating = item.rating || "";
    if (typeof rating === 'string' && (rating.includes("Rx") || rating.includes("R+"))) return false;

    const unsafeKeywords = ["nude", "sex", "porn", "adult", "erotica"];
    const textToSearch = `${item.title || item.name || ""} ${item.overview || item.synopsis || ""}`.toLowerCase();
    if (unsafeKeywords.some(word => textToSearch.includes(word))) return false;

    return true;
  }, []);

  // 2. Calculate Interests
  const sortedInterests = useMemo(() => {
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

    return Object.entries(behaviorGenres)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
  }, [watchlist, currentFavorites, userPreferences.genres]);

  // 3. Determine top genre IDs for fetching
  const { topMovieGenreIds, topAnimeGenreIds } = useMemo(() => {
    if (sortedInterests.length === 0 || movieGenres.length === 0 || animeGenres.length === 0) {
      return { topMovieGenreIds: null, topAnimeGenreIds: null };
    }

    const mIds = sortedInterests
      .map(interest => movieGenres.find(g => g.name === interest)?.id)
      .filter(Boolean)
      .slice(0, 3)
      .join('|');

    const aIds = sortedInterests
      .map(interest => animeGenres.find(g => g.name === interest)?.mal_id)
      .filter(Boolean)
      .slice(0, 3)
      .join(',');

    return { topMovieGenreIds: mIds, topAnimeGenreIds: aIds };
  }, [sortedInterests, movieGenres, animeGenres]);

  // 4. Fetch Recommendations and Trending (Trending acts as fallback)
  const movieTrendingQuery = useGetPopularMoviesQuery({ page: 1 });
  const movieRecQuery = useGetMoviesByGenreQuery({ genreId: topMovieGenreIds, page: 1 }, { skip: !topMovieGenreIds });
  
  const animeTopQuery = useGetTopAnimeQuery(1);
  const animeRecQuery = useGetAnimeByGenreQuery({ genreId: topAnimeGenreIds, page: 1 }, { skip: !topAnimeGenreIds });

  const popularMovies = useMemo(() => {
    const recs = movieRecQuery.data?.results || [];
    const trending = movieTrendingQuery.data?.results || [];
    const watchlistIds = new Set(watchlist.map(item => String(item.contentId)));
    
    // Prioritize Recommendations, fall back to Trending
    const filteredRecs = recs.filter(m => !watchlistIds.has(String(m.id))).filter(isSafe);
    const filteredTrending = trending.filter(m => !watchlistIds.has(String(m.id))).filter(isSafe);
    
    return filteredRecs.length > 0 ? filteredRecs.slice(0, 6) : filteredTrending.slice(0, 6);
  }, [movieRecQuery.data, movieTrendingQuery.data, watchlist, isSafe]);

  const topAnime = useMemo(() => {
    const recs = animeRecQuery.data?.data || [];
    const trending = animeTopQuery.data?.data || [];
    const watchlistIds = new Set(watchlist.map(item => String(item.contentId)));
    
    // Prioritize Recommendations, fall back to Trending
    const filteredRecs = recs.filter(a => !watchlistIds.has(String(a.mal_id))).filter(isSafe);
    const filteredTrending = trending.filter(a => !watchlistIds.has(String(a.mal_id))).filter(isSafe);
    
    return filteredRecs.length > 0 ? filteredRecs.slice(0, 6) : filteredTrending.slice(0, 6);
  }, [animeRecQuery.data, animeTopQuery.data, watchlist, isSafe]);

  const loading = movieTrendingQuery.isLoading || animeTopQuery.isLoading;
  const error = movieTrendingQuery.error || animeTopQuery.error;

  if (error && popularMovies.length === 0 && topAnime.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger bg-dark text-danger border-danger">
          <h4 className="alert-heading">Discovery Interrupted</h4>
          <p>Failed to load recommendations. Please try again later.</p>
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
                <div className="mb-3">
                  <i className="bi bi-search text-info" style={{fontSize: '2.5rem'}}></i>
                </div>
                <h3 className="h4 text-info">Smart Discovery</h3>
                <p className="opacity-75 small">Find your next favorite movie or anime using our advanced search and filtering system.</p>
              </div>
            </Link>
          </div>
          <div className="col-md-4">
            <Link to="/watchlist" className="text-decoration-none h-100">
              <div className="p-4 bg-dark text-light rounded border border-secondary h-100 shadow-sm movie-card">
                <div className="mb-3">
                  <i className="bi bi-collection-play text-success" style={{fontSize: '2.5rem'}}></i>
                </div>
                <h3 className="h4 text-success">Track Progress</h3>
                <p className="opacity-75 small">Organize your library with custom statuses: Plan to Watch, Currently Watching, and Completed.</p>
              </div>
            </Link>
          </div>
          <div className="col-md-4">
            <Link to="/profile" className="text-decoration-none h-100">
              <div className="p-4 bg-dark text-light rounded border border-secondary h-100 shadow-sm movie-card">
                <div className="mb-3">
                  <i className="bi bi-graph-up-arrow text-warning" style={{fontSize: '2.5rem'}}></i>
                </div>
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
