import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../config";

export const favoriteApi = createApi({
  reducerPath: "favoriteApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${ API_BASE_URL }/favorites`,
    credentials: "include",
  }),
  tagTypes: ["Favorites"],
  endpoints: (builder) => ({
    getFavorites: builder.query({
      query: (userId) => `/${userId}`,
      providesTags: ["Favorites"],
    }),
    addFavorite: builder.mutation({
      query: (favorite) => ({
        url: "/add",
        method: "POST",
        body: favorite,
      }),
      async onQueryStarted(favorite, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          favoriteApi.util.updateQueryData("getFavorites", favorite.userId, (draft) => {
            draft.push({ ...favorite, _id: `temp-${Date.now()}` });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["Favorites"],
    }),
    removeFavorite: builder.mutation({
      query: (id) => ({
        url: `/remove/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const state = getState();
        let targetUserId = null;
        
        // Search for the userId associated with this favorite
        for (const query of Object.values(state.favoriteApi.queries)) {
          if (query.endpointName === 'getFavorites' && query.data?.some(f => f._id === id)) {
            targetUserId = query.originalArgs;
            break;
          }
        }

        if (targetUserId) {
          const patchResult = dispatch(
            favoriteApi.util.updateQueryData("getFavorites", targetUserId, (draft) => {
              const index = draft.findIndex(f => f._id === id);
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
      invalidatesTags: ["Favorites"],
    }),
  }),
});

export const { useGetFavoritesQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } = favoriteApi;
