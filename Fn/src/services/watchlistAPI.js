import axios from "axios";
import { API_BASE_URL } from "../config";

// const API_URL = `${API_BASE_URL}/watchlist`;

export const addToWatchlist = (item) => axios.post(`${API_BASE_URL}/watchlist/add`, item);
export const getWatchlist = (userId) => axios.get(`${API_BASE_URL}/watchlist/${userId}`);
export const removeFromWatchlist = (id) => axios.delete(`${API_BASE_URL}/watchlist/remove/${id}`);
export const updateWatchlistStatus = (id, status) => axios.put(`${API_BASE_URL}/watchlist/update-status/${id}`, { status });
