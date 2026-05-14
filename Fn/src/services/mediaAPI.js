import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../config";

export const mediaApi = createApi({
  reducerPath: "mediaApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${API_BASE_URL}/media`,
    credentials: "include",
  }),
  // Cache for 15 minutes (900 seconds) - data will stay in memory for 15 minutes after 
  // the component is unmounted before being garbage collected
  keepUnusedDataFor: 900, 
  endpoints: (builder) => ({
    // Anime Endpoints
    getTopAnime: builder.query({
      query: (page = 1) => `/anime/top?page=${page}`,
    }),
    getTrendingAnime: builder.query({
      query: (page = 1) => `/anime/trending?page=${page}`,
    }),
    getRecentHighRatedAnime: builder.query({
      query: (page = 1) => `/anime/high-rated?page=${page}`,
    }),
    searchAnime: builder.query({
      query: ({ query, page = 1 }) => `/anime/search?q=${query}&page=${page}`,
    }),
    getAnimeDetails: builder.query({
      query: (id) => `/anime/${id}`,
    }),
    getAnimeGenres: builder.query({
      query: () => "/anime/genres",
    }),
    getAnimeByGenre: builder.query({
      query: ({ genreId, page = 1, sortBy = "popularity.desc", lang = "" }) => 
        `/anime/by-genre?genreId=${genreId}&page=${page}&sortBy=${sortBy}&lang=${lang}`,
    }),
    getAnimeRecommendations: builder.query({
      query: (id) => `/anime/${id}/recommendations`,
    }),

    // Movie Endpoints
    getPopularMovies: builder.query({
      query: ({ page = 1, lang = "" }) => {
        const langQuery = lang ? `&lang=${lang}` : "";
        return `/movie/popular?page=${page}${langQuery}`;
      },
    }),
    searchMovies: builder.query({
      query: ({ query, page = 1, lang = "" }) => {
        const langQuery = lang ? `&lang=${lang}` : "";
        return `/movie/search?query=${query}&page=${page}${langQuery}`;
      },
    }),
    getMovieDetails: builder.query({
      query: (id) => `/movie/${id}`,
    }),
    getMovieGenres: builder.query({
      query: () => "/movie/genres",
    }),
    getMovieLanguages: builder.query({
      query: () => "/movie/languages",
    }),
    getMoviesByGenre: builder.query({
      query: ({ genreId, page = 1, sortBy = "popularity.desc", lang = "" }) => {
        const langQuery = lang ? `&lang=${lang}` : "";
        return `/movie/by-genre?genreId=${genreId}&page=${page}&sortBy=${sortBy}${langQuery}`;
      },
    }),
    getMovieRecommendations: builder.query({
      query: (id) => `/movie/${id}/recommendations`,
    }),
  }),
});

export const {
  useGetTopAnimeQuery,
  useGetTrendingAnimeQuery,
  useGetRecentHighRatedAnimeQuery,
  useSearchAnimeQuery,
  useGetAnimeDetailsQuery,
  useGetAnimeGenresQuery,
  useGetAnimeByGenreQuery,
  useGetAnimeRecommendationsQuery,
  useGetPopularMoviesQuery,
  useSearchMoviesQuery,
  useGetMovieDetailsQuery,
  useGetMovieGenresQuery,
  useGetMovieLanguagesQuery,
  useGetMoviesByGenreQuery,
  useGetMovieRecommendationsQuery,
} = mediaApi;
