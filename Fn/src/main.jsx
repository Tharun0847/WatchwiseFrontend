import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./app/store.js";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Signup from "./component/Signup.jsx";
import Login from "./component/Login.jsx";
import ProtectedRoute from "./component/ProtectedRoute.jsx";
import Movies from "./component/Movies.jsx";
import Anime from "./component/Anime.jsx";
import Watchlist from "./component/Watchlist.jsx";
import Details from "./component/Details.jsx";
import Profile from "./component/Profile.jsx";
import Home from "./component/Home.jsx";
import Compare from "./component/Compare.jsx";
import Analytics from "./component/Analytics.jsx";
import Interests from "./component/Interests.jsx";

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
          { path: "/analytics", element: <Analytics /> },
          { path: "/interests", element: <Interests /> },
          { path: "/details/:type/:id", element: <Details /> },
          { path: "/profile", element: <Profile /> },
        ],
      },
      // These routes remain public
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <RouterProvider router={router}></RouterProvider>
  </Provider>,
);