import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../config";

export const dislikeApi = createApi({
  reducerPath: "dislikeApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${ API_BASE_URL }/dislikes`,
    credentials: "include",
  }),
  tagTypes: ["Dislikes"],
  endpoints: (builder) => ({
    getDislikes: builder.query({
      query: (userId) => `/${userId}`,
      providesTags: ["Dislikes"],
    }),
    addDislike: builder.mutation({
      query: (dislike) => ({
        url: "/add",
        method: "POST",
        body: dislike,
      }),
      async onQueryStarted(dislike, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          dislikeApi.util.updateQueryData("getDislikes", dislike.userId, (draft) => {
            draft.unshift({ ...dislike, _id: `temp-${Date.now()}` });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["Dislikes"],
    }),
    removeDislike: builder.mutation({
      query: (id) => ({
        url: `/remove/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const state = getState();
        let targetUserId = null;
        
        // Search for the userId associated with this dislike
        for (const query of Object.values(state.dislikeApi.queries)) {
          if (query.endpointName === 'getDislikes' && query.data?.some(d => d._id === id)) {
            targetUserId = query.originalArgs;
            break;
          }
        }

        if (targetUserId) {
          const patchResult = dispatch(
            dislikeApi.util.updateQueryData("getDislikes", targetUserId, (draft) => {
              const index = draft.findIndex(d => d._id === id);
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
      invalidatesTags: ["Dislikes"],
    }),
  }),
});

export const { useGetDislikesQuery, useAddDislikeMutation, useRemoveDislikeMutation } = dislikeApi;
