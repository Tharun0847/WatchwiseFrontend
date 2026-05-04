import axios from "axios";

const API_URL = "http://localhost:6767/watchlist";

export const addToWatchlist = (item) => axios.post(`${API_URL}/add`, item);
export const getWatchlist = (userId) => axios.get(`${API_URL}/${userId}`);
export const removeFromWatchlist = (id) => axios.delete(`${API_URL}/remove/${id}`);
export const updateWatchlistStatus = (id, status) => axios.put(`${API_URL}/update-status/${id}`, { status });
