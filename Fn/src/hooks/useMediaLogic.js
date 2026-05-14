import { useState, useCallback, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetWatchlistQuery, useAddToWatchlistMutation, useRemoveFromWatchlistMutation } from "../services/watchlistAPI";
import { 
  useGetAnimeGenresQuery, 
  useGetMovieGenresQuery, 
  useGetMovieLanguagesQuery,
  useGetTopAnimeQuery,
  useSearchAnimeQuery,
  useGetAnimeByGenreQuery,
  useGetPopularMoviesQuery,
  useSearchMoviesQuery,
  useGetMoviesByGenreQuery
} from "../services/mediaAPI";
import { isContentSafe, sortMedia, SAFE_GENRES_TO_EXCLUDE } from "../utils/mediaHelpers";

const STABLE_EMPTY_OBJ = {};
const STABLE_EMPTY_ARRAY = [];

export const useMediaLogic = (type) => {
  const { user } = useSelector((state) => state.userReducer);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get("q") || "";
  const urlGenre = searchParams.get("genre") || "";
  const urlLang = searchParams.get("lang") || "";
  
  const [page, setPage] = useState(1);
  const [recommendedPage, setRecommendedPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(12);
  const [visibleRecommendedCount, setVisibleRecommendedCount] = useState(6);

  // 1. Fetch Watchlist
  const { data: watchlistData } = useGetWatchlistQuery(user?.id, { skip: !user?.id });
  const [addToWatchlist] = useAddToWatchlistMutation();
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation();

  const watchlist = useMemo(() => watchlistData || STABLE_EMPTY_ARRAY, [watchlistData]);
  const watchlistIds = useMemo(() => new Set(watchlist.map(item => String(item.contentId))), [watchlist]);

  // 2. Fetch Genres & Languages
  const isMovie = type === "movie";
  const { data: movieGenresData } = useGetMovieGenresQuery(undefined, { skip: !isMovie });
  const { data: animeGenresData } = useGetAnimeGenresQuery(undefined, { skip: isMovie });
  const { data: languagesData } = useGetMovieLanguagesQuery(undefined, { skip: !isMovie });

  const genres = useMemo(() => {
    const rawGenres = isMovie ? (movieGenresData?.genres || []) : (animeGenresData?.data || []);
    return rawGenres.filter(g => !SAFE_GENRES_TO_EXCLUDE.includes(g.name));
  }, [isMovie, movieGenresData, animeGenresData]);

  const languages = useMemo(() => {
    const rawLangs = Array.isArray(languagesData) ? languagesData : (languagesData?.data || []);
    const commonLangs = ["en", "hi", "te", "ta", "ml", "kn", "es", "fr", "ja", "ko", "zh", "it", "de", "ru"];
    return rawLangs
      .filter(l => commonLangs.includes(l.iso_639_1))
      .sort((a, b) => a.english_name.localeCompare(b.english_name));
  }, [languagesData]);

  // 3. Fetch Main Content based on filters
  const isSearching = urlQuery && urlQuery.length > 2;
  const isFiltering = !!urlGenre;

  // Movie Queries
  const moviePopularQuery = useGetPopularMoviesQuery({ page, lang: urlLang }, { skip: !isMovie || isSearching || isFiltering });
  const movieSearchQuery = useSearchMoviesQuery({ query: urlQuery, page, lang: urlLang }, { skip: !isMovie || !isSearching });
  const movieGenreQuery = useGetMoviesByGenreQuery({ genreId: urlGenre, page, lang: urlLang }, { skip: !isMovie || !isFiltering });

  // Anime Queries
  const animeTopQuery = useGetTopAnimeQuery(page, { skip: isMovie || isSearching || isFiltering });
  const animeSearchQuery = useSearchAnimeQuery({ query: urlQuery, page }, { skip: isMovie || !isSearching });
  const animeGenreQuery = useGetAnimeByGenreQuery({ genreId: urlGenre, page, lang: urlLang }, { skip: isMovie || !isFiltering });

  const currentQuery = isMovie 
    ? (isSearching ? movieSearchQuery : isFiltering ? movieGenreQuery : moviePopularQuery)
    : (isSearching ? animeSearchQuery : isFiltering ? animeGenreQuery : animeTopQuery);

  const loading = currentQuery.isLoading;
  const loadingMore = currentQuery.isFetching && page > 1;
  const error = currentQuery.error ? "Unable to load content. Please check your connection." : null;

  // Aggregate Items
  const [aggregatedItems, setAggregatedItems] = useState([]);
  
  useEffect(() => {
    const newData = isMovie ? (currentQuery.data?.results || []) : (currentQuery.data?.data || []);
    if (page === 1) {
      setAggregatedItems(newData);
    } else if (newData.length > 0) {
      setAggregatedItems(prev => {
        const combined = [...prev, ...newData];
        return combined.filter((item, index, self) =>
          index === self.findIndex((t) => (isMovie ? t.id : t.mal_id) === (isMovie ? item.id : item.mal_id))
        );
      });
    }
  }, [currentQuery.data, isMovie, page]);

  const items = useMemo(() => {
    const filtered = aggregatedItems.filter(item => isContentSafe(item, type, genres));
    return sortMedia(filtered, type);
  }, [aggregatedItems, type, genres]);

  const hasMore = isMovie 
    ? (currentQuery.data?.total_pages > page) 
    : !!(currentQuery.data?.pagination?.has_next_page);

  // 4. Recommendations logic
  const userPreferences = useMemo(() => user?.preferences || STABLE_EMPTY_OBJ, [user?.preferences]);
  const showRecommendations = !urlQuery && !urlGenre && userPreferences.genres?.length > 0;
  
  const recommendedGenreIds = useMemo(() => {
    if (!showRecommendations || genres.length === 0) return null;
    const ids = genres
      .filter(g => userPreferences.genres.includes(g.name))
      .map(g => (isMovie ? g.id : g.mal_id));
    
    if (ids.length === 0) return null;
    return isMovie ? ids.join("|") : ids.slice(0, 2).join(",");
  }, [showRecommendations, genres, userPreferences.genres, isMovie]);

  const movieRecQuery = useGetMoviesByGenreQuery({ genreId: recommendedGenreIds, page: recommendedPage, lang: urlLang }, { skip: !isMovie || !recommendedGenreIds });
  const animeRecQuery = useGetAnimeByGenreQuery({ genreId: recommendedGenreIds, page: recommendedPage, lang: urlLang }, { skip: isMovie || !recommendedGenreIds });

  const currentRecQuery = isMovie ? movieRecQuery : animeRecQuery;
  
  const [aggregatedRecs, setAggregatedRecs] = useState([]);
  
  useEffect(() => {
    const newData = isMovie ? (currentRecQuery.data?.results || []) : (currentRecQuery.data?.data || []);
    if (recommendedPage === 1) {
      setAggregatedRecs(newData);
    } else if (newData.length > 0) {
      setAggregatedRecs(prev => {
        const combined = [...prev, ...newData];
        return combined.filter((item, index, self) =>
          index === self.findIndex((t) => (isMovie ? t.id : t.mal_id) === (isMovie ? item.id : item.mal_id))
        );
      });
    }
  }, [currentRecQuery.data, isMovie, recommendedPage]);

  const recommended = useMemo(() => {
    const filtered = aggregatedRecs
      .filter(item => !watchlistIds.has(String(isMovie ? item.id : item.mal_id)))
      .filter(item => isContentSafe(item, type, genres));
    return sortMedia(filtered, type);
  }, [aggregatedRecs, isMovie, type, genres, watchlistIds]);

  const hasMoreRecommended = isMovie 
    ? (currentRecQuery.data?.total_pages > recommendedPage) 
    : !!(currentRecQuery.data?.pagination?.has_next_page);

  const loadMore = () => setPage(prev => prev + 1);
  const loadMoreRecommended = () => setRecommendedPage(prev => prev + 1);

  const handleGenreChange = useCallback((e) => {
    const genreId = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (genreId) newParams.set("genre", genreId);
    else newParams.delete("genre");
    setPage(1);
    setAggregatedItems([]);
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleLanguageChange = useCallback((e) => {
    const langCode = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (langCode) newParams.set("lang", langCode);
    else newParams.delete("lang");
    setPage(1);
    setAggregatedItems([]);
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const toggleWatchlist = async (e, item) => {
    e.stopPropagation();
    if (!user?.id) return navigate("/login");

    const itemId = isMovie ? item.id.toString() : item.mal_id.toString();
    const existingItem = watchlist.find(i => i.contentId === itemId);

    try {
      if (existingItem) {
        await removeFromWatchlist(existingItem._id).unwrap();
      } else {
        const newItem = {
          userId: user.id,
          contentId: itemId,
          title: item.title || item.name,
          image: isMovie 
            ? (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "")
            : item.images?.jpg?.large_image_url,
          rating: (isMovie ? item.vote_average : item.score) || 0,
          genres: isMovie 
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
