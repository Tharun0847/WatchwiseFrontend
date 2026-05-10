import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { authApi } from "../services/authAPI";
import { reviewApi } from "../services/reviewAPI";
import { favoriteApi } from "../services/favoriteAPI";
import { comparisonApi } from "../services/comparisonAPI";
import { analyticsApi } from "../services/analyticsAPI";
import { watchlistApi } from "../services/watchlistAPI";
import userReducer from "../features/auth/userSlice";

export const store = configureStore({
  reducer: {
    userReducer,
    [authApi.reducerPath]: authApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer,
    [favoriteApi.reducerPath]: favoriteApi.reducer,
    [comparisonApi.reducerPath]: comparisonApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [watchlistApi.reducerPath]: watchlistApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      reviewApi.middleware,
      favoriteApi.middleware,
      comparisonApi.middleware,
      analyticsApi.middleware,
      watchlistApi.middleware
    ),
});
setupListeners(store.dispatch);
