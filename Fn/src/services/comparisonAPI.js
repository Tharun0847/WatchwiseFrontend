import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const comparisonApi = createApi({
  reducerPath: "comparisonApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:6767" }),
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
