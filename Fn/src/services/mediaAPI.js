import axios from "axios";
import { API_BASE_URL } from "../config";

// Increased timeout to 60 seconds to support backend retries
axios.defaults.timeout = 60000; 

const BACKEND_URL = `${ API_BASE_URL }/media`;

// Add a request interceptor to attach the JWT token
axios.interceptors.request.use(
  (config) => {
    const token = window.localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Generic internal API calls
export const fetchUserFavorites = (userId) => axios.get(`${ API_BASE_URL }/favorites/${userId}`);

// Anime API Proxy
export const fetchTopAnime = (page = 1) => axios.get(`${BACKEND_URL}/anime/top?page=${page}`);
export const fetchTrendingAnime = (page = 1) => axios.get(`${BACKEND_URL}/anime/trending?page=${page}`);
export const fetchRecentHighRatedAnime = (page = 1) => axios.get(`${BACKEND_URL}/anime/high-rated?page=${page}`);
export const searchAnime = (query, page = 1) => axios.get(`${BACKEND_URL}/anime/search?q=${query}&page=${page}`);
export const fetchAnimeDetails = (id) => axios.get(`${BACKEND_URL}/anime/${id}`);
export const fetchAnimeGenres = () => axios.get(`${BACKEND_URL}/anime/genres`);
export const fetchAnimeByGenre = (genreId, page = 1) => axios.get(`${BACKEND_URL}/anime/by-genre?genreId=${genreId}&page=${page}`);
export const fetchAnimeRecommendations = (id) => axios.get(`${BACKEND_URL}/anime/${id}/recommendations`);

// Movies API Proxy
export const fetchPopularMovies = (page = 1) => 
  axios.get(`${BACKEND_URL}/movie/popular?page=${page}`);

export const searchMovies = (query, page = 1) => 
  axios.get(`${BACKEND_URL}/movie/search?query=${query}&page=${page}`);

export const fetchMovieDetails = (id) => 
  axios.get(`${BACKEND_URL}/movie/${id}`);

export const fetchMovieGenres = () => 
  axios.get(`${BACKEND_URL}/movie/genres`);

export const fetchMoviesByGenre = (genreId, page = 1, sortBy = "popularity.desc") => 
  axios.get(`${BACKEND_URL}/movie/by-genre?genreId=${genreId}&page=${page}&sortBy=${sortBy}`);

export const fetchMovieRecommendations = (id) =>
  axios.get(`${BACKEND_URL}/movie/${id}/recommendations`);
