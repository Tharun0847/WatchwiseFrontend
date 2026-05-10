import React from "react";
import { fetchPopularMovies, searchMovies, fetchMovieGenres, fetchMoviesByGenre } from "../../services/mediaAPI";
import FilterBar from "../../common/FilterBar";
import MediaGrid from "../../common/MediaGrid";
import { useMediaLogic } from "../../hooks/useMediaLogic";

const movieFetchMethods = {
  getGenres: fetchMovieGenres,
  search: searchMovies,
  getByGenre: fetchMoviesByGenre,
  getInitial: fetchPopularMovies
};

function Movies() {
  const {
    items,
    recommended,
    genres,
    loading,
    loadingMore,
    error,
    watchlist,
    urlGenre,
    urlQuery,
    hasMore,
    hasMoreRecommended,
    visibleCount,
    setVisibleCount,
    visibleRecommendedCount,
    setVisibleRecommendedCount,
    handleGenreChange,
    toggleWatchlist,
    loadMore,
    loadMoreRecommended,
    navigate
  } = useMediaLogic("movie", movieFetchMethods);

  if (loading && items.length === 0) return <div className="text-center mt-5 text-light">Loading Movies...</div>;
  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;

  return (
    <div className="container py-4">
      <FilterBar 
        title="Discover Movies" 
        genres={genres} 
        selectedGenre={urlGenre} 
        onGenreChange={handleGenreChange} 
        type="movie"
      />

      {loading && items.length === 0 ? (
        <div className="text-center py-5 text-info">Loading results...</div>
      ) : (
        <>
          {/* Recommended Section */}
          {recommended.length > 0 && !urlQuery && !urlGenre && (
            <div className="mb-5 animate-fade-in">
              <h3 className="text-info border-start border-4 border-info ps-3 mb-4 h4">Recommended Based on Your Interests</h3>
              <MediaGrid 
                items={recommended.slice(0, visibleRecommendedCount)} 
                type="movie" 
                watchlist={watchlist}
                onToggleWatchlist={toggleWatchlist}
                onDetails={(m) => navigate(`/details/movie/${m.id}`)}
                genres={genres}
              />
              {(hasMoreRecommended || visibleRecommendedCount < recommended.length) && (
                <div className="text-center mt-4">
                  <button 
                    className="btn btn-outline-info" 
                    onClick={() => {
                      const nextVisible = visibleRecommendedCount + 6;
                      setVisibleRecommendedCount(nextVisible);
                      if (nextVisible >= recommended.length && hasMoreRecommended) {
                        loadMoreRecommended();
                      }
                    }} 
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading..." : "View More Recommendations"}
                  </button>
                </div>
              )}
              <hr className="border-secondary mt-5" />
            </div>
          )}

          {/* Main Section Header */}
          <h3 className="text-light mb-4 h4 text-center text-md-start">
            {urlQuery ? `Results for "${urlQuery}"` : urlGenre ? "Genre Matches" : "Trending Movies"}
          </h3>

          <MediaGrid 
            items={items.slice(0, visibleCount)} 
            type="movie" 
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            onDetails={(m) => navigate(`/details/movie/${m.id}`)}
            genres={genres}
          />

          {(hasMore || visibleCount < items.length) && (
            <div className="text-center mt-5">
              <button 
                className="btn btn-outline-light" 
                onClick={() => {
                  const nextVisible = visibleCount + 12;
                  setVisibleCount(nextVisible);
                  if (nextVisible >= items.length && hasMore) {
                    loadMore();
                  }
                }}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "View More Movies"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Movies;
