import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../config";

export const watchlistApi = createApi({
  reducerPath: "watchlistApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${ API_BASE_URL }/watchlist`,
    credentials: "include",
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
      async onQueryStarted(item, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          watchlistApi.util.updateQueryData("getWatchlist", item.userId, (draft) => {
            draft.push({ ...item, _id: `temp-${Date.now()}` });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["Watchlist"],
    }),
    removeFromWatchlist: builder.mutation({
      query: (id) => ({
        url: `/remove/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const state = getState();
        let targetUserId = null;
        
        for (const query of Object.values(state.watchlistApi.queries)) {
          if (query.endpointName === 'getWatchlist' && query.data?.some(w => w._id === id)) {
            targetUserId = query.originalArgs;
            break;
          }
        }

        if (targetUserId) {
          const patchResult = dispatch(
            watchlistApi.util.updateQueryData("getWatchlist", targetUserId, (draft) => {
              const index = draft.findIndex(w => w._id === id);
              if (index !== -1) draft.splice(index, 1);
            })
          );
          try {
            await queryFulfilled;
          } catch {
            patchResult.undo();
          }
        }
      },
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
