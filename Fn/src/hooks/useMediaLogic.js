import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetWatchlistQuery, useAddToWatchlistMutation, useRemoveFromWatchlistMutation } from "../services/watchlistAPI";
import { isContentSafe, sortMedia } from "../utils/mediaHelpers";

export const useMediaLogic = (type, fetchMethods) => {
  const { user } = useSelector((state) => state.userReducer);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: watchlist } = useGetWatchlistQuery(user?.id, { skip: !user?.id });
  const [addToWatchlist] = useAddToWatchlistMutation();
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation();

  const urlQuery = searchParams.get("q") || "";
  const urlGenre = searchParams.get("genre") || "";

  const [items, setItems] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [genres, setGenres] = useState([]);
  const [genresLoaded, setGenresLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [recommendedPage, setRecommendedPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasMoreRecommended, setHasMoreRecommended] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const [visibleRecommendedCount, setVisibleRecommendedCount] = useState(6);

  const fetchGenres = useCallback(async () => {
    try {
      const res = await fetchMethods.getGenres();
      const genresData = type === "movie" ? (res.data.genres || []) : (res.data.data || []);
      setGenres(genresData);
    } catch (err) {
      console.error(`${type} genre fetch failed`, err);
    } finally {
      setGenresLoaded(true);
    }
  }, [type, fetchMethods]);

  const userId = user?.id;
  const userPreferencesStr = JSON.stringify(user?.preferences || {});
  const watchlistStr = JSON.stringify(watchlist || []);

  const fetchData = useCallback(async (query, genre, retryCount = 0) => {
    // Prevent starting a new fetch if one is already loading
    setLoading(true);
    setError(null);
    setPage(1);
    setRecommendedPage(1);
    setVisibleCount(12);

    try {
      let res;
      if (query && query.length > 2) {
        res = await fetchMethods.search(query, 1);
      } else if (genre) {
        res = await fetchMethods.getByGenre(genre, 1);
      } else {
        res = await fetchMethods.getInitial(1);
      }

      const rawData = type === "movie" ? (res.data.results || []) : (res.data.data || []);
      const uniqueData = rawData.filter((item, index, self) =>
        index === self.findIndex((t) => (type === "movie" ? t.id : t.mal_id) === (type === "movie" ? item.id : item.mal_id))
      ).filter(item => isContentSafe(item, type, genres));

      setItems(sortMedia(uniqueData, type));
      setHasMore(type === "movie" ? res.data.total_pages > 1 : res.data.pagination?.has_next_page);

      // Recommendations
      const preferences = JSON.parse(userPreferencesStr);
      const currentWatchlist = JSON.parse(watchlistStr);

      if (!query && !genre && preferences.genres?.length > 0 && genres.length > 0) {
        const genreIds = genres
          .filter(g => preferences.genres.includes(g.name))
          .map(g => (type === "movie" ? g.id : g.mal_id));

        if (genreIds.length > 0) {
          const formattedGenreIds = type === "movie" ? genreIds.join("|") : genreIds.slice(0, 2).join(",");
          
          if (type === "anime") await new Promise(r => setTimeout(r, 600)); // Jikan rate limit
          
          const recRes = await fetchMethods.getByGenre(formattedGenreIds, 1);
          const rawRecs = type === "movie" ? (recRes.data.results || []) : (recRes.data.data || []);
          const watchlistIds = new Set(currentWatchlist.map(item => String(item.contentId)));
          
          const uniqueRecs = rawRecs.filter((item, index, self) =>
            index === self.findIndex((t) => (type === "movie" ? t.id : t.mal_id) === (type === "movie" ? item.id : item.mal_id))
          ).filter(item => !watchlistIds.has(String(type === "movie" ? item.id : item.mal_id)))
           .filter(item => isContentSafe(item, type, genres));

          setRecommended(sortMedia(uniqueRecs, type));
          setHasMoreRecommended(type === "movie" ? recRes.data.total_pages > 1 : recRes.data.pagination?.has_next_page);
        }
      } else {
        setRecommended([]);
      }

      setLoading(false);
    } catch (err) {
      if (type === "anime" && err.response?.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1500;
        setTimeout(() => fetchData(query, genre, retryCount + 1), delay);
      } else {
        console.error(`${type} fetch failed`, err);
        setError(`Failed to fetch ${type}.`);
        setLoading(false);
      }
    }
  }, [type, fetchMethods, userId, userPreferencesStr, genres, watchlistStr]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      let res;
      if (urlQuery && urlQuery.length > 2) {
        res = await fetchMethods.search(urlQuery, nextPage);
      } else if (urlGenre) {
        res = await fetchMethods.getByGenre(urlGenre, nextPage);
      } else {
        res = await fetchMethods.getInitial(nextPage);
      }

      const newData = type === "movie" ? (res.data.results || []) : (res.data.data || []);
      const uniqueNewData = newData.filter(item => isContentSafe(item, type, genres));

      setItems(prev => sortMedia([...prev, ...uniqueNewData], type));
      setPage(nextPage);
      setHasMore(type === "movie" ? nextPage < res.data.total_pages : res.data.pagination?.has_next_page);
    } catch (err) {
      console.error(`Load more ${type} failed`, err);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreRecommended = async () => {
    const nextPage = recommendedPage + 1;
    setLoadingMore(true);
    try {
      const genreIds = genres
        .filter(g => user.preferences.genres.includes(g.name))
        .map(g => (type === "movie" ? g.id : g.mal_id));
      
      const formattedGenreIds = type === "movie" ? genreIds.join("|") : genreIds.slice(0, 2).join(",");
      const res = await fetchMethods.getByGenre(formattedGenreIds, nextPage);
      const newData = type === "movie" ? (res.data.results || []) : (res.data.data || []);
      const uniqueNewData = newData.filter(item => isContentSafe(item, type, genres));

      setRecommended(prev => sortMedia([...prev, ...uniqueNewData], type));
      setRecommendedPage(nextPage);
      setHasMoreRecommended(type === "movie" ? nextPage < res.data.total_pages : res.data.pagination?.has_next_page);
    } catch (err) {
      console.error(`Load more recommended ${type} failed`, err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  useEffect(() => {
    if (genresLoaded) {
      fetchData(urlQuery, urlGenre);
    }
  }, [urlQuery, urlGenre, genresLoaded, fetchData]);

  const handleGenreChange = (e) => {
    const genreId = e.target.value;
    if (genreId) {
      setSearchParams({ genre: genreId });
    } else {
      setSearchParams({});
    }
  };

  const toggleWatchlist = async (e, item) => {
    e.stopPropagation();
    if (!user?.id) return navigate("/login");

    const itemId = type === "movie" ? item.id.toString() : item.mal_id.toString();
    const existingItem = watchlist?.find(i => i.contentId === itemId);

    try {
      if (existingItem) {
        await removeFromWatchlist(existingItem._id).unwrap();
      } else {
        const newItem = {
          userId: user.id,
          contentId: itemId,
          title: item.title || item.name,
          image: type === "movie" 
            ? (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "")
            : item.images?.jpg?.large_image_url,
          rating: (type === "movie" ? item.vote_average : item.score) || 0,
          genres: type === "movie" 
            ? item.genre_ids?.map(id => genres.find(g => g.id === id)?.name).filter(Boolean) || []
            : item.genres?.map(g => g.name) || [],
          type: type
        };
        await addToWatchlist(newItem).unwrap();
      }
    } catch (err) {
      console.error("Watchlist toggle failed", err);
    }
  };

  return {
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
  };
};
