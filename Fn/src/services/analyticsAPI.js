import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../config";

export const analyticsApi = createApi({
  reducerPath: "analyticsApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${ API_BASE_URL }/analytics` }),
  endpoints: (builder) => ({
    getUserStats: builder.query({
      query: (userId) => `/${userId}`,
    }),
  }),
});

export const { useGetUserStatsQuery } = analyticsApi;
