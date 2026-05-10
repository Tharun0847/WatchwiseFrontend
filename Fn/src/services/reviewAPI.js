import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../config";

export const reviewApi = createApi({
  reducerPath: "reviewApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${ API_BASE_URL }/reviews`,
    prepareHeaders: (headers) => {
      const token = window.localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Reviews"],
  endpoints: (builder) => ({
    getReviews: builder.query({
      query: (contentId) => `/${contentId}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: "Reviews", id: _id })), { type: "Reviews", id: "LIST" }]
          : [{ type: "Reviews", id: "LIST" }],
    }),
    addReview: builder.mutation({
      query: (review) => ({
        url: "/add",
        method: "POST",
        body: review,
      }),
      invalidatesTags: [{ type: "Reviews", id: "LIST" }],
    }),
    deleteReview: builder.mutation({
      query: (id) => ({
        url: `/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Reviews", id: "LIST" }],
    }),
  }),
});

export const { useGetReviewsQuery, useAddReviewMutation, useDeleteReviewMutation } = reviewApi;
