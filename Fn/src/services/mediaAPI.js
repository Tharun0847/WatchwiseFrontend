import axios from "axios";
// import { API_BASE_URL } from "../config";
// Anime API (Jikan - Free, no key needed)
export const fetchTopAnime = () => axios.get("https://api.jikan.moe/v4/top/anime");
export const searchAnime = (query) => axios.get(`https://api.jikan.moe/v4/anime?q=${query}`);
export const fetchAnimeDetails = (id) => axios.get(`https://api.jikan.moe/v4/anime/${id}/full`);
export const fetchAnimeGenres = () => axios.get("https://api.jikan.moe/v4/genres/anime");
export const fetchAnimeByGenre = (genreId) => axios.get(`https://api.jikan.moe/v4/anime?genres=${genreId}`);
export const fetchAnimeRecommendations = (id) => axios.get(`https://api.jikan.moe/v4/anime/${id}/recommendations`);

// Movies API (TMDB - Requires API Key)
const TMDB_KEY = "bc882676942af1593f2496fcb3593dca"; 
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const fetchPopularMovies = () => 
  axios.get(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_KEY}`);

export const searchMovies = (query) => 
  axios.get(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_KEY}&query=${query}`);

export const fetchMovieDetails = (id) => 
  axios.get(`${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_KEY}&append_to_response=videos,credits`);

export const fetchMovieGenres = () => 
  axios.get(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_KEY}`);

export const fetchMoviesByGenre = (genreId) => 
  axios.get(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_KEY}&with_genres=${genreId}`);

export const fetchMovieRecommendations = (id) => 
  axios.get(`${TMDB_BASE_URL}/movie/${id}/recommendations?api_key=${TMDB_KEY}`);
