import React from "react";
import { fetchPopularMovies, searchMovies, fetchMovieGenres, fetchMoviesByGenre, fetchMovieLanguages } from "../../services/mediaAPI";
import FilterBar from "../../common/FilterBar";
import MediaGrid from "../../common/MediaGrid";
import MediaSkeleton from "../../common/MediaSkeleton";
import { useMediaLogic } from "../../hooks/useMediaLogic";

const movieFetchMethods = {
  getGenres: fetchMovieGenres,
  getLanguages: fetchMovieLanguages,
  search: searchMovies,
  getByGenre: fetchMoviesByGenre,
  getInitial: fetchPopularMovies
};

function Movies() {
  const {
    items,
    recommended,
    genres,
    languages,
    loading,
    loadingMore,
    error,
    watchlist,
    urlGenre,
    urlQuery,
    urlLang,
    hasMore,
    hasMoreRecommended,
    visibleCount,
    setVisibleCount,
    visibleRecommendedCount,
    setVisibleRecommendedCount,
    handleGenreChange,
    handleLanguageChange,
    toggleWatchlist,
    loadMore,
    loadMoreRecommended,
    navigate
  } = useMediaLogic("movie", movieFetchMethods);

  if (loading && items.length === 0) {
    return (
      <div className="container py-4">
        <div className="skeleton-shine mb-4" style={{ height: "60px", width: "100%", borderRadius: "10px" }}></div>
        <MediaSkeleton count={12} />
      </div>
    );
  }

  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;

  const currentLangName = languages.find(l => l.iso_639_1 === urlLang)?.english_name || "";
  const langPrefix = currentLangName ? `${currentLangName} ` : "";

  return (
    <div className="container py-4">
      <FilterBar 
        title={`Discover ${langPrefix}Movies`} 
        genres={genres} 
        selectedGenre={urlGenre} 
        onGenreChange={handleGenreChange} 
        languages={languages}
        selectedLang={urlLang}
        onLanguageChange={handleLanguageChange}
        type="movie"
      />

      {loading && items.length === 0 ? (
        <MediaSkeleton count={12} />
      ) : (
        <>
          {/* Recommended Section */}
          {recommended.length > 0 && !urlQuery && !urlGenre && (
            <div className="mb-5 animate-fade-in">
              <h3 className="text-info border-start border-4 border-info ps-3 mb-4 h4">Recommended {langPrefix}Movies</h3>
              <MediaGrid 
                items={recommended.slice(0, visibleRecommendedCount)} 
                type="movie" 
                onDetails={(m) => navigate(`/details/movie/${m.id}`)}
                genres={genres}
                priorityCount={6}
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
            {urlQuery ? `Results for "${urlQuery}"` : urlGenre ? `${langPrefix}Genre Matches` : `Trending ${langPrefix}Movies`}
          </h3>

          {items.length > 0 ? (
            <>
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
          ) : (
            <div className="text-center py-5 text-info">
              <p className="h5 mb-0">No results found for your criteria.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Movies;
