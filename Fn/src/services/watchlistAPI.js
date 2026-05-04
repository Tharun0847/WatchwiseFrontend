import axios from "axios";
import { API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/watchlist`;

export const addToWatchlist = (item) => axios.post(`${API_URL}/add`, item);
export const getWatchlist = (userId) => axios.get(`${API_URL}/${userId}`);
export const removeFromWatchlist = (id) => axios.delete(`${API_URL}/remove/${id}`);
export const updateWatchlistStatus = (id, status) => axios.put(`${API_URL}/update-status/${id}`, { status });
