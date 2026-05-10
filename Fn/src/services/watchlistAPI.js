import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../config";

export const watchlistApi = createApi({
  reducerPath: "watchlistApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${ API_BASE_URL }/watchlist`,
    prepareHeaders: (headers) => {
      const token = window.localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Watchlist"],
  endpoints: (builder) => ({
    getWatchlist: builder.query({
      query: (userId) => `/${userId}`,
      providesTags: ["Watchlist"],
    }),
    addToWatchlist: builder.mutation({
      query: (item) => ({
        url: "/add",
        method: "POST",
        body: item,
      }),
      invalidatesTags: ["Watchlist"],
    }),
    removeFromWatchlist: builder.mutation({
      query: (id) => ({
        url: `/remove/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Watchlist"],
    }),
    updateWatchlistStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/update-status/${id}`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Watchlist"],
    }),
  }),
});

export const { 
  useGetWatchlistQuery, 
  useAddToWatchlistMutation, 
  useRemoveFromWatchlistMutation,
  useUpdateWatchlistStatusMutation 
} = watchlistApi;

// Temporary exports for backward compatibility with cached files
export const addToWatchlist = () => { console.warn("Old addToWatchlist called"); };
export const getWatchlist = () => { console.warn("Old getWatchlist called"); };
export const removeFromWatchlist = () => { console.warn("Old removeFromWatchlist called"); };
export const updateWatchlistStatus = () => { console.warn("Old updateWatchlistStatus called"); };
