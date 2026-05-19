import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useGetAllUsersQuery } from "../../services/comparisonAPI";
import { Link } from "react-router-dom";

function DiscoverPeople() {
  const { user: currentUser } = useSelector((state) => state.userReducer);
  const { data: allUsers, isLoading, error } = useGetAllUsersQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;

  const otherUsers = allUsers?.filter((u) => u._id !== currentUser.id) || [];
  
  const filteredUsers = otherUsers.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  // Auto-focus the search field on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mt-4 text-light">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="text-info border-start border-info border-4 ps-3 mb-1">Discover People</h2>
          <p className="text-info opacity-75 small mb-0 ps-3">Find others with similar movie and anime tastes.</p>
        </div>
        
        {/* Local Search Field */}
        <div className="search-box" style={{ maxWidth: "400px", width: "100%" }}>
          <div className="input-group border border-secondary rounded-pill overflow-hidden bg-dark bg-opacity-50 shadow-sm">
            <span className="input-group-text bg-transparent border-0 px-3">
              <i className="bi bi-search" style={{ fontSize: "1.1rem", color: "#0dcaf0" }}></i>
            </span>
            <input
              type="text"
              className="form-control bg-transparent border-0 text-light shadow-none ps-0"
              placeholder="Search people by name..."
              value={searchTerm}
              ref={searchInputRef}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="btn btn-link text-info text-decoration-none border-0 px-3" 
                type="button"
                onClick={() => setSearchTerm("")}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status"></div>
          <p className="mt-3 opacity-75">Finding movie buffs...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger bg-dark border-danger text-danger">
          Error loading users. Please try again later.
        </div>
      ) : (
        <>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 mb-4">
            {paginatedUsers.map((user) => (
              <div key={user._id} className="col">
                <div className="card h-100 bg-dark border-secondary shadow-sm movie-card">
                  <div className="card-body text-center p-4">
                    <Link to={`/profile/${user._id}`} className="text-decoration-none">
                      <div 
                        className="bg-info text-dark rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm overflow-hidden" 
                        style={{ width: "64px", height: "64px", fontSize: "1.5rem", fontWeight: "bold" }}
                      >
                        {user.profilePic ? (
                          <img src={user.profilePic} alt={user.name} className="w-100 h-100 object-fit-cover" />
                        ) : (
                          user.name?.[0].toUpperCase() || "U"
                        )}
                      </div>
                      <h5 className="card-title text-info text-truncate mb-1">{user.name}</h5>
                    </Link>
                    <p className="card-text text-light opacity-50 small mb-4" style={{ minHeight: "2.5rem" }}>
                      {user.preferences?.genres?.length > 0 
                        ? `Interested in ${user.preferences.genres.slice(0, 2).join(", ")}` 
                        : "Exploring genres..."}
                    </p>
                    
                    <Link 
                      to={`/profile/${user._id}`} 
                      className="btn btn-info btn-sm rounded-pill w-100 fw-bold text-dark"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="col-12 text-center py-5">
                <div className="display-4 mb-3 opacity-25">👤</div>
                <h3 className="h5 opacity-50">No users found matching "{searchTerm}"</h3>
                <p className="opacity-25 small">Try a different name or browse the list.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex flex-column align-items-center mt-5 mb-5 pt-4 border-top border-secondary">
              <div className="d-flex align-items-center gap-3">
                <button 
                  className="btn btn-outline-info rounded-pill px-4 d-flex align-items-center gap-2"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  <i className="bi bi-arrow-left"></i> Previous
                </button>
                
                <span className="text-info opacity-75 fw-bold">
                  Page {currentPage + 1} of {totalPages}
                </span>

                <button 
                  className="btn btn-outline-info rounded-pill px-4 d-flex align-items-center gap-2"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                >
                  Next <i className="bi bi-arrow-right"></i>
                </button>
              </div>
              <p className="text-info opacity-50 x-small mt-2 uppercase tracking-wider">
                Showing {paginatedUsers.length} of {filteredUsers.length} people
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DiscoverPeople;
