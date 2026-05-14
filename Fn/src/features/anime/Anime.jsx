import React from "react";
import { fetchTopAnime, searchAnime, fetchAnimeGenres, fetchAnimeByGenre } from "../../services/mediaAPI";
import FilterBar from "../../common/FilterBar";
import MediaGrid from "../../common/MediaGrid";
import MediaSkeleton from "../../common/MediaSkeleton";
import { useMediaLogic } from "../../hooks/useMediaLogic";

const animeFetchMethods = {
  getGenres: fetchAnimeGenres,
  search: searchAnime,
  getByGenre: fetchAnimeByGenre,
  getInitial: fetchTopAnime
};

function Anime() {
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
  } = useMediaLogic("anime", animeFetchMethods);

  if (loading && items.length === 0) {
    return (
      <div className="container py-4">
        <div className="skeleton-shine mb-4" style={{ height: "60px", width: "100%", borderRadius: "10px" }}></div>
        <MediaSkeleton count={12} />
      </div>
    );
  }

  if (error) return <div className="text-center py-5 text-danger">{error}</div>;

  return (
    <div className="container py-4">
      <FilterBar 
        title="Discover Anime" 
        genres={genres} 
        selectedGenre={urlGenre} 
        onGenreChange={handleGenreChange} 
        type="anime"
      />

      {loading && items.length === 0 ? (
        <MediaSkeleton count={12} />
      ) : (
        <>
          {/* Recommended Section */}
          {recommended.length > 0 && !urlQuery && !urlGenre && (
            <div className="mb-5 animate-fade-in">
              <h3 className="text-success border-start border-4 border-success ps-3 mb-4 h4">Recommended Based on Your Interests</h3>
              <MediaGrid 
                items={recommended.slice(0, visibleRecommendedCount)} 
                type="anime" 
                onDetails={(a) => navigate(`/details/anime/${a.mal_id}`)}
                genres={genres}
                priorityCount={6}
              />
              {(hasMoreRecommended || visibleRecommendedCount < recommended.length) && (
                <div className="text-center mt-4">
                  <button 
                    className="btn btn-outline-success" 
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
            {urlQuery ? `Results for "${urlQuery}"` : urlGenre ? "Genre Matches" : "Trending Now (Airing)"}
          </h3>

          {items.length > 0 ? (
            <>
              <MediaGrid 
                items={items.slice(0, visibleCount)} 
                type="anime" 
                watchlist={watchlist}
                onToggleWatchlist={toggleWatchlist}
                onDetails={(a) => navigate(`/details/anime/${a.mal_id}`)}
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
                    {loadingMore ? "Loading..." : "View More Anime"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5 text-muted">
              <p className="h5 mb-0">No results found for your criteria.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Anime;
