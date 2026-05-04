import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { updateUser } from "./userSlice";

function Navbar() {
  const { user } = useSelector((state) => state.userReducer);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function logout() {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    dispatch(updateUser({}));
    navigate("/login");
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark shadow sticky-top">
      <div className="container-fluid">
        {/* Brand/Logo on the Left */}
        <Link className="navbar-brand fw-bold fs-3 text-info d-flex align-items-center gap-2" to="/">
          <span style={{ letterSpacing: "1px" }}>WatchWise</span>
        </Link>

        {/* Toggle button for mobile view */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4 gap-2">
            {user.token && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/movies">Movies</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/anime">Anime</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/watchlist">Watchlist</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/compare">Taste Match</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/analytics">Analytics</NavLink>
                </li>
              </>
            )}
          </ul>

          {/* Auth Buttons on the Right */}
          <div className="d-flex align-items-center gap-3">
            {!user.token ? (
              <>
                <Link to="/login" className="btn btn-link text-info text-decoration-none fw-bold">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-info px-4 rounded-pill fw-bold shadow-sm">
                  Signup
                </Link>
              </>
            ) : (
              <div className="d-flex align-items-center gap-3">
                <Link to="/profile" className="text-light text-decoration-none d-flex align-items-center gap-2 group">
                  <div className="bg-info text-dark rounded-circle d-flex align-items-center justify-content-center profile-avatar shadow-sm" style={{ width: "36px", height: "36px", fontWeight: "bold", fontSize: "1.1rem" }}>
                    {user.username?.[0].toUpperCase()}
                  </div>
                  <div className="d-none d-xl-block">
                    <span className="opacity-50 small d-block" style={{ fontSize: "0.7rem", lineHeight: "1" }}>Welcome back,</span>
                    <span className="fw-bold text-info" style={{ fontSize: "0.9rem" }}>{user.username}</span>
                  </div>
                </Link>
                <button
                  className="btn btn-outline-danger btn-sm px-3 rounded-pill"
                  onClick={logout}
                  style={{ fontSize: "0.8rem" }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
