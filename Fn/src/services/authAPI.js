import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../config";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${ API_BASE_URL }/users`,
    prepareHeaders: (headers) => {
      // Cookies are handled automatically with credentials: 'include'
      return headers;
    },
    credentials: 'include', // Important for HttpOnly cookies
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (user) => ({
        url: "/login",
        method: "POST",
        body: user,
      }),
    }),
    signup: builder.mutation({
      query: (user) => ({
        url: "/register",
        method: "POST",
        body: user,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
    }),
    verifyOTP: builder.mutation({
      query: (data) => ({
        url: "/verify-otp",
        method: "POST",
        body: data,
      }),
    }),
    resendOTP: builder.mutation({
      query: (data) => ({
        url: "/resend-otp",
        method: "POST",
        body: data,
      }),
    }),
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: "/forgot-password",
        method: "POST",
        body: data,
      }),
    }),
    verifyResetOTP: builder.mutation({
      query: (data) => ({
        url: "/verify-reset-otp",
        method: "POST",
        body: data,
      }),
    }),
    resetPassword: builder.mutation({
      query: ({ token, password }) => ({
        url: `/reset-password/${token}`,
        method: "POST",
        body: { password },
      }),
    }),
    changeEmail: builder.mutation({
      query: (data) => ({
        url: "/change-email",
        method: "POST",
        body: data,
      }),
    }),
    updateProfile: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/update-profile/${id}`,
        method: "PUT",
        body: data,
      }),
    }),
    getUserById: builder.query({
      query: (id) => `/user/${id}`,
    }),
  }),
});

export const { 
  useSignupMutation, 
  useLoginMutation, 
  useLogoutMutation,
  useUpdateProfileMutation, 
  useGetUserByIdQuery,
  useVerifyOTPMutation,
  useResendOTPMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangeEmailMutation,
  useVerifyResetOTPMutation
} = authApi;
