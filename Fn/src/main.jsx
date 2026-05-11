import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./app/store.js";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Signup from "./features/auth/Signup.jsx";
import Login from "./features/auth/Login.jsx";
import VerifyOTP from "./features/auth/VerifyOTP.jsx";
import ForgotPassword from "./features/auth/ForgotPassword.jsx";
import ResetPassword from "./features/auth/ResetPassword.jsx";
import ProtectedRoute from "./common/ProtectedRoute.jsx";
import Movies from "./features/movies/Movies.jsx";
import Anime from "./features/anime/Anime.jsx";
import Watchlist from "./features/watchlist/Watchlist.jsx";
import Details from "./common/Details.jsx";
import Profile from "./features/profile/Profile.jsx";
import Home from "./features/home/Home.jsx";
import Compare from "./features/comparison/Compare.jsx";
import Interests from "./features/profile/Interests.jsx";
import DiscoverPeople from "./features/profile/DiscoverPeople.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App></App>,
    children: [
      { path: "/", element: <Home /> },
      {
        // This is a "Layout Route" that protects all its children
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { path: "/movies", element: <Movies /> },
          { path: "/anime", element: <Anime /> },
          { path: "/watchlist", element: <Watchlist /> },
          { path: "/compare", element: <Compare /> },
          { path: "/discover", element: <DiscoverPeople /> },
          { path: "/interests", element: <Interests /> },
          { path: "/details/:type/:id", element: <Details /> },
          { path: "/profile/:id?", element: <Profile /> },
        ],
      },
      // These routes remain public
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "/verify-otp", element: <VerifyOTP /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password/:token", element: <ResetPassword /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <RouterProvider router={router}></RouterProvider>
  </Provider>,
);