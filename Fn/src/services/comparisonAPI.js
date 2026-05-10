import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../config";

export const comparisonApi = createApi({
  reducerPath: "comparisonApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${ API_BASE_URL }`,
    prepareHeaders: (headers) => {
      const token = window.localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getAllUsers: builder.query({
      query: () => "/users/all",
    }),
    compareUsers: builder.query({
      query: ({ userId, targetId }) => `/compare/${userId}/${targetId}`,
    }),
  }),
});

export const { useGetAllUsersQuery, useCompareUsersQuery } = comparisonApi;
