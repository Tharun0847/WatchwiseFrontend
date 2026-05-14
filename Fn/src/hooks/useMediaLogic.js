import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetWatchlistQuery, useAddToWatchlistMutation, useRemoveFromWatchlistMutation } from "../services/watchlistAPI";
import { isContentSafe, sortMedia, SAFE_GENRES_TO_EXCLUDE } from "../utils/mediaHelpers";

const STABLE_EMPTY_OBJ = {};

export const useMediaLogic = (type, fetchMethods) => {
  const { user } = useSelector((state) => state.userReducer);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Refs for request management and breaking dependency cycles
  const abortControllerRef = useRef(null);
  const genresRef = useRef([]);

  const { data: watchlistData } = useGetWatchlistQuery(user?.id, { skip: !user?.id });
  const [addToWatchlist] = useAddToWatchlistMutation();
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation();

  const watchlist = useMemo(() => watchlistData || [], [watchlistData]);
  const watchlistIds = useMemo(() => new Set(watchlist.map(item => String(item.contentId))), [watchlist]);

  const urlQuery = searchParams.get("q") || "";
  const urlGenre = searchParams.get("genre") || "";
  const urlLang = searchParams.get("lang") || "";

  const [rawItems, setRawItems] = useState([]);
  const [rawRecommended, setRawRecommended] = useState([]);
  const [genres, setGenres] = useState([]);
  const [languages, setLanguages] = useState([]);
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

  // Keep genresRef in sync with state
  useEffect(() => {
    genresRef.current = genres;
  }, [genres]);

  const fetchGenres = useCallback(async (signal) => {
    try {
      const res = await fetchMethods.getGenres(signal);
      let genresData = type === "movie" ? (res.data.genres || []) : (res.data.data || []);
      
      // Filter out explicit genres for college project safety
      genresData = genresData.filter(g => !SAFE_GENRES_TO_EXCLUDE.includes(g.name));
      
      setGenres(genresData);
    } catch (err) {
      if (err.name !== "CanceledError") {
        console.error(`${type} genre fetch failed`, err);
      }
    } finally {
      setGenresLoaded(true);
    }
  }, [type, fetchMethods]);

  const fetchLanguages = useCallback(async (signal) => {
    if (type !== "movie" || !fetchMethods.getLanguages) return;
    try {
      const res = await fetchMethods.getLanguages(signal);
      const rawLangs = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const commonLangs = ["en", "hi", "te", "ta", "ml", "kn", "es", "fr", "ja", "ko", "zh", "it", "de", "ru"];
      const langs = rawLangs
        .filter(l => commonLangs.includes(l.iso_639_1))
        .sort((a, b) => a.english_name.localeCompare(b.english_name));
      setLanguages(langs.length > 0 ? langs : rawLangs.slice(0, 20));
    } catch (err) {
      if (err.name !== "CanceledError") {
        console.error(`${type} language fetch failed`, err);
      }
    }
  }, [type, fetchMethods]);

  const userPreferences = useMemo(() => user?.preferences || STABLE_EMPTY_OBJ, [user?.preferences]);

  const fetchData = useCallback(async (query, genre, lang, retryCount = 0) => {
    // 1. Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);
    setPage(1);
    setRecommendedPage(1);
    setVisibleCount(12);
    setVisibleRecommendedCount(6);

    try {
      // Fetch main content
      let mainPromise;
      if (query && query.length > 2) {
        mainPromise = fetchMethods.search(query, 1, lang, signal);
      } else if (genre) {
        mainPromise = fetchMethods.getByGenre(genre, 1, "popularity.desc", lang, signal);
      } else {
        mainPromise = fetchMethods.getInitial(1, lang, signal);
      }

      const mainRes = await mainPromise;
      const mainData = type === "movie" ? (mainRes.data.results || []) : (mainRes.data.data || []);
      setRawItems(mainData);
      setHasMore(type === "movie" ? (mainRes.data.total_pages > 1) : !!(mainRes.data.pagination?.has_next_page));

      setLoading(false);

      // 2. Fetch recommendations (using current genres from ref to avoid dependency cycle)
      const currentGenres = genresRef.current;
      if (!query && !genre && userPreferences.genres?.length > 0 && currentGenres.length > 0) {
        const genreIds = currentGenres
          .filter(g => userPreferences.genres.includes(g.name))
          .map(g => (type === "movie" ? g.id : g.mal_id));

        if (genreIds.length > 0) {
          const formattedGenreIds = type === "movie" ? genreIds.join("|") : genreIds.slice(0, 2).join(",");
          
          // Delay Jikan recommendations to avoid rate limits
          setTimeout(async () => {
            if (signal.aborted) return;
            try {
              const recRes = await fetchMethods.getByGenre(formattedGenreIds, 1, "popularity.desc", lang, signal);
              const recData = type === "movie" ? (recRes.data.results || []) : (recRes.data.data || []);
              setRawRecommended(recData);
              setHasMoreRecommended(type === "movie" ? (recRes.data.total_pages > 1) : !!(recRes.data.pagination?.has_next_page));
            } catch (err) {
              if (err.name !== "CanceledError") {
                console.warn(`Background ${type} recommendations fetch failed`, err);
              }
            }
          }, type === "anime" ? 1200 : 100);
        }
      } else {
        setRawRecommended([]);
      }
    } catch (err) {
      if (err.name === "CanceledError") return;

      if (type === "anime" && err.response?.status === 429 && retryCount < 2) {
        setTimeout(() => fetchData(query, genre, lang, retryCount + 1), 3000);
      } else {
        console.error(`${type} fetch failed`, err);
        setError(`Unable to load ${type}. Please check your connection.`);
        setLoading(false);
      }
    }
  }, [type, fetchMethods, userPreferences]); // Removed 'genres' from dependencies

  // Derived state for filtered items
  const items = useMemo(() => {
    const unique = rawItems.filter((item, index, self) =>
      index === self.findIndex((t) => (type === "movie" ? t.id : t.mal_id) === (type === "movie" ? item.id : item.mal_id))
    ).filter(item => isContentSafe(item, type, genres));
    return sortMedia(unique, type);
  }, [rawItems, type, genres]);

  const recommended = useMemo(() => {
    const unique = rawRecommended.filter((item, index, self) =>
      index === self.findIndex((t) => (type === "movie" ? t.id : t.mal_id) === (type === "movie" ? item.id : item.mal_id))
    ).filter(item => !watchlistIds.has(String(type === "movie" ? item.id : item.mal_id)))
     .filter(item => isContentSafe(item, type, genres));
    return sortMedia(unique, type);
  }, [rawRecommended, type, genres, watchlistIds]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      let res;
      if (urlQuery && urlQuery.length > 2) {
        res = await fetchMethods.search(urlQuery, nextPage, urlLang);
      } else if (urlGenre) {
        res = await fetchMethods.getByGenre(urlGenre, nextPage, "popularity.desc", urlLang);
      } else {
        res = await fetchMethods.getInitial(nextPage, urlLang);
      }

      const newData = type === "movie" ? (res.data.results || []) : (res.data.data || []);
      setRawItems(prev => [...prev, ...newData]);
      setPage(nextPage);
      setHasMore(type === "movie" ? nextPage < res.data.total_pages : !!res.data.pagination?.has_next_page);
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
        .filter(g => userPreferences.genres?.includes(g.name))
        .map(g => (type === "movie" ? g.id : g.mal_id));
      
      const formattedGenreIds = type === "movie" ? genreIds.join("|") : genreIds.slice(0, 2).join(",");
      const res = await fetchMethods.getByGenre(formattedGenreIds, nextPage, "popularity.desc", urlLang);
      const newData = type === "movie" ? (res.data.results || []) : (res.data.data || []);
      
      setRawRecommended(prev => [...prev, ...newData]);
      setRecommendedPage(nextPage);
      setHasMoreRecommended(type === "movie" ? nextPage < res.data.total_pages : !!res.data.pagination?.has_next_page);
    } catch (err) {
      console.error(`Load more recommended ${type} failed`, err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Initial fetch of genres and languages
  useEffect(() => {
    const controller = new AbortController();
    fetchGenres(controller.signal);
    fetchLanguages(controller.signal);
    return () => controller.abort();
  }, [fetchGenres, fetchLanguages]);

  // Main data fetch based on URL params
  useEffect(() => {
    if (genresLoaded) {
      fetchData(urlQuery, urlGenre, urlLang);
    }
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [urlQuery, urlGenre, urlLang, genresLoaded, fetchData]);

  const handleGenreChange = useCallback((e) => {
    const genreId = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (genreId) newParams.set("genre", genreId);
    else newParams.delete("genre");
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleLanguageChange = useCallback((e) => {
    const langCode = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (langCode) newParams.set("lang", langCode);
    else newParams.delete("lang");
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const toggleWatchlist = async (e, item) => {
    e.stopPropagation();
    if (!user?.id) return navigate("/login");

    const itemId = type === "movie" ? item.id.toString() : item.mal_id.toString();
    const existingItem = watchlist.find(i => i.contentId === itemId);

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
  };
};
