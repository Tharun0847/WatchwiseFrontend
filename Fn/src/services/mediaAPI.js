import axios from "axios";
import { API_BASE_URL } from "../config";

// Increased timeout to 60 seconds to support backend retries
axios.defaults.timeout = 60000; 
axios.defaults.withCredentials = true; // Enable sending cookies automatically

const BACKEND_URL = `${ API_BASE_URL }/media`;

// Generic internal API calls
export const fetchUserFavorites = (userId) => axios.get(`${ API_BASE_URL }/favorites/${userId}`);

// Anime API Proxy
export const fetchTopAnime = (page = 1, signal) => axios.get(`${BACKEND_URL}/anime/top?page=${page}`, { signal });
export const fetchTrendingAnime = (page = 1, signal) => axios.get(`${BACKEND_URL}/anime/trending?page=${page}`, { signal });
export const fetchRecentHighRatedAnime = (page = 1, signal) => axios.get(`${BACKEND_URL}/anime/high-rated?page=${page}`, { signal });
export const searchAnime = (query, page = 1, signal) => axios.get(`${BACKEND_URL}/anime/search?q=${query}&page=${page}`, { signal });
export const fetchAnimeDetails = (id, signal) => axios.get(`${BACKEND_URL}/anime/${id}`, { signal });
export const fetchAnimeGenres = (signal) => axios.get(`${BACKEND_URL}/anime/genres`, { signal });
export const fetchAnimeByGenre = (genreId, page = 1, sortBy = "popularity.desc", lang = "", signal) => 
  axios.get(`${BACKEND_URL}/anime/by-genre?genreId=${genreId}&page=${page}&sortBy=${sortBy}&lang=${lang}`, { signal });
export const fetchAnimeRecommendations = (id, signal) => axios.get(`${BACKEND_URL}/anime/${id}/recommendations`, { signal });

// Movies API Proxy
export const fetchPopularMovies = (page = 1, lang = "", signal) => {
  const langQuery = lang ? `&lang=${lang}` : "";
  return axios.get(`${BACKEND_URL}/movie/popular?page=${page}${langQuery}`, { signal });
};

export const searchMovies = (query, page = 1, lang = "", signal) => {
  const langQuery = lang ? `&lang=${lang}` : "";
  return axios.get(`${BACKEND_URL}/movie/search?query=${query}&page=${page}${langQuery}`, { signal });
};

export const fetchMovieDetails = (id, signal) => 
  axios.get(`${BACKEND_URL}/movie/${id}`, { signal });

export const fetchMovieGenres = (signal) => 
  axios.get(`${BACKEND_URL}/movie/genres`, { signal });

export const fetchMovieLanguages = (signal) =>
  axios.get(`${BACKEND_URL}/movie/languages`, { signal });

export const fetchMoviesByGenre = (genreId, page = 1, sortBy = "popularity.desc", lang = "", signal) => {
  const langQuery = lang ? `&lang=${lang}` : "";
  return axios.get(`${BACKEND_URL}/movie/by-genre?genreId=${genreId}&page=${page}&sortBy=${sortBy}${langQuery}`, { signal });
};

export const fetchMovieRecommendations = (id, signal) =>
  axios.get(`${BACKEND_URL}/movie/${id}/recommendations`, { signal });
