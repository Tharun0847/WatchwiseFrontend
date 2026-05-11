import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { updateUser } from "../features/auth/userSlice";

function Navbar() {
  const { user } = useSelector((state) => state.userReducer);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const searchInputRef = useRef(null);

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

  function logout() {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    dispatch(updateUser({}));
    navigate("/login");
  }

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    if (location.pathname.startsWith("/anime")) {
      navigate(`/anime?q=${encodeURIComponent(searchInput)}`);
    } else {
      navigate(`/movies?q=${encodeURIComponent(searchInput)}`);
    }
    setIsNavCollapsed(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchInput(params.get("q") || "");
  }, [location.search]);

  useEffect(() => {
    if (location.state?.focusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname, location.search]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark shadow sticky-top">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold fs-3 text-info d-flex align-items-center gap-2" to="/" onClick={() => setIsNavCollapsed(true)}>
          <span style={{ letterSpacing: "1px" }}>WatchWise</span>
        </Link>

        {user.token && (
          <SearchForm 
            className="d-flex d-lg-none ms-auto me-2" 
            style={{ maxWidth: "150px" }} 
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            handleSearch={handleSearch}
            searchInputRef={null}
          />
        )}

        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={handleNavCollapse}
          aria-controls="navbarNav"
          aria-expanded={!isNavCollapsed}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4 gap-2">
            {user.token && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/movies" onClick={() => setIsNavCollapsed(true)}>Movies</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/anime" onClick={() => setIsNavCollapsed(true)}>Anime</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/watchlist" onClick={() => setIsNavCollapsed(true)}>Watchlist</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/discover" onClick={() => setIsNavCollapsed(true)}>Discover People</NavLink>
                </li>
              </>
            )}
          </ul>

          {user.token && (
            <SearchForm 
              className="d-none d-lg-flex ms-lg-auto me-lg-3 my-2 my-lg-0" 
              style={{ maxWidth: "240px" }} 
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              handleSearch={handleSearch}
              searchInputRef={searchInputRef}
            />
          )}

          <div className="d-flex align-items-center gap-2 gap-lg-3 mt-3 mt-lg-0">
            {!user.token ? (
              <>
                <Link to="/login" className="btn btn-link text-info text-decoration-none fw-bold px-2" onClick={() => setIsNavCollapsed(true)}>
                  Login
                </Link>
                <Link to="/signup" className="btn btn-info px-4 rounded-pill fw-bold shadow-sm" onClick={() => setIsNavCollapsed(true)}>
                  Signup
                </Link>
              </>
            ) : (
              <div className="d-flex align-items-center gap-3 w-100 justify-content-between justify-content-lg-end">
                <Link to="/profile" className="text-light text-decoration-none d-flex align-items-center gap-2 group" onClick={() => setIsNavCollapsed(true)}>
                  <div className="bg-info text-dark rounded-circle d-flex align-items-center justify-content-center profile-avatar shadow-sm" style={{ width: "32px", height: "32px", fontWeight: "bold", fontSize: "1rem" }}>
                    {user.username?.[0].toUpperCase()}
                  </div>
                  <div className="d-lg-none d-xl-block">
                    <span className="fw-bold text-info" style={{ fontSize: "0.9rem" }}>{user.username}</span>
                  </div>
                </Link>
                <button
                  className="btn btn-outline-danger btn-sm px-3 rounded-pill"
                  onClick={() => {
                    logout();
                    setIsNavCollapsed(true);
                  }}
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

const SearchForm = ({ className, style, searchInput, setSearchInput, handleSearch, searchInputRef }) => (
  <form className={className} onSubmit={handleSearch} style={style}>
    <div className="input-group input-group-sm border border-secondary rounded-pill overflow-hidden bg-dark bg-opacity-50">
      <span className="input-group-text bg-transparent border-0 text-info px-2">
        <i className="bi bi-search" style={{ fontSize: "0.9rem" }}></i>
      </span>
      <input
        type="text"
        className="form-control bg-transparent border-0 text-light shadow-none ps-0"
        placeholder="Search..."
        value={searchInput}
        ref={searchInputRef}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      {searchInput && (
        <button 
          className="btn btn-link text-info text-decoration-none border-0 px-2" 
          type="button"
          onClick={() => setSearchInput("")}
        >
          <i className="bi bi-x-lg" style={{ fontSize: "0.8rem" }}></i>
        </button>
      )}
    </div>
  </form>
);

export default Navbar;
