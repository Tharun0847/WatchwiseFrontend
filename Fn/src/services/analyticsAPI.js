import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const analyticsApi = createApi({
  reducerPath: "analyticsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:6767/analytics" }),
  endpoints: (builder) => ({
    getUserStats: builder.query({
      query: (userId) => `/${userId}`,
    }),
  }),
});

export const { useGetUserStatsQuery } = analyticsApi;
