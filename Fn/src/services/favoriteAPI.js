import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const favoriteApi = createApi({
  reducerPath: "favoriteApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:6767/favorites" }),
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
      invalidatesTags: ["Favorites"],
    }),
    removeFavorite: builder.mutation({
      query: (id) => ({
        url: `/remove/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Favorites"],
    }),
  }),
});

export const { useGetFavoritesQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } = favoriteApi;
