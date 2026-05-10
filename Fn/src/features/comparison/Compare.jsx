import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useGetAllUsersQuery, useCompareUsersQuery } from "../../services/comparisonAPI";
import { Link, useLocation } from "react-router-dom";

function Compare({ targetUserId: propTargetUserId }) {
  const location = useLocation();
  const { user: currentUser } = useSelector((state) => state.userReducer);
  const { data: allUsers, isLoading: usersLoading } = useGetAllUsersQuery();
  const [selectedUserId, setSelectedUserId] = useState(propTargetUserId || null);

  // Pre-select user if passed through navigation state (for standalone mode)
  useEffect(() => {
    if (!propTargetUserId && location.state?.selectedUserId) {
      setSelectedUserId(location.state.selectedUserId);
    }
  }, [location.state, propTargetUserId]);

  // Update selectedUserId if prop changes
  useEffect(() => {
    if (propTargetUserId) {
      setSelectedUserId(propTargetUserId);
    }
  }, [propTargetUserId]);

  const { data: result, isFetching: resultFetching } = useCompareUsersQuery(
    { userId: currentUser.id, targetId: selectedUserId },
    { skip: !selectedUserId }
  );

  const otherUsers = allUsers?.filter((u) => u._id !== currentUser.id) || [];

  return (
    <div className={propTargetUserId ? "" : "container py-4"}>
      <div className="row g-4">
        {/* User Selection Sidebar - Only show if not embedded with a specific target */}
        {!propTargetUserId && (
          <div className="col-lg-4">
            <div className="card bg-dark text-light border-secondary shadow mb-4">
              <div className="card-body">
                <h3 className="text-info border-bottom border-secondary pb-2 mb-3 h4">Compare Taste</h3>
                <p className="text-info opacity-75 small">Select a user to see how much your tastes match!</p>
                
                {usersLoading ? (
                  <p className="text-info small">Loading users...</p>
                ) : (
                  <div className="list-group list-group-flush" style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {otherUsers.map((user) => (
                      <button
                        key={user._id}
                        className={`list-group-item list-group-item-action bg-transparent border-secondary text-light d-flex align-items-center gap-3 py-2 ${
                          selectedUserId === user._id ? "active bg-info text-dark fw-bold" : ""
                        }`}
                        onClick={() => setSelectedUserId(user._id)}
                      >
                        <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "32px", height: "32px", fontSize: "0.8rem" }}>
                          {user.name?.[0].toUpperCase() || "U"}
                        </div>
                        <span className="text-truncate">{user.name}</span>
                      </button>
                    ))}
                    {otherUsers.length === 0 && <p className="text-info opacity-50 small italic">No other users found.</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comparison Results */}
        <div className={propTargetUserId ? "col-lg-12" : "col-lg-8"}>
          {!selectedUserId ? (
            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-info opacity-75 border border-secondary border-dashed rounded p-5 bg-dark bg-opacity-25">
              <span className="display-4 mb-3">🤝</span>
              <h4 className="h5 text-center">Select a user to start comparison</h4>
            </div>
          ) : resultFetching ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info" role="status"></div>
              <p className="mt-3 text-light small">Calculating similarity score...</p>
            </div>
          ) : result ? (
            <div className="animate-fade-in">
              {/* Score Header */}
              <div className="card bg-dark text-light border-secondary shadow mb-4 overflow-hidden">
                <div className="card-body text-center p-4 p-md-5">
                  <h5 className="text-info opacity-75 uppercase mb-3 small">Overall Taste Match</h5>
                  <div className="display-2 fw-bold text-info mb-2">{result.score}%</div>
                  <div className="progress bg-secondary bg-opacity-25 mx-auto" style={{ height: "10px", maxWidth: "400px" }}>
                    <div 
                      className="progress-bar bg-info" 
                      role="progressbar" 
                      style={{ width: `${result.score}%` }}
                    ></div>
                  </div>
                </div>
                <div className="row g-0 border-top border-secondary text-center">
                  <div className="col-4 border-end border-secondary py-2 py-md-3">
                    <h6 className="mb-0 text-info small">{result.overlapScore}%</h6>
                    <small className="text-info opacity-75 x-small">Overlap</small>
                  </div>
                  <div className="col-4 border-end border-secondary py-2 py-md-3">
                    <h6 className="mb-0 text-info small">{result.genreScore}%</h6>
                    <small className="text-info opacity-75 x-small">Genres</small>
                  </div>
                  <div className="col-4 py-2 py-md-3">
                    <h6 className="mb-0 text-info small">{result.ratingScore}%</h6>
                    <small className="text-info opacity-75 x-small">Ratings</small>
                  </div>
                </div>
              </div>

              <div className="row g-3 g-md-4">
                {/* Shared Genres */}
                <div className="col-md-6">
                  <div className="card bg-dark text-light border-secondary shadow h-100">
                    <div className="card-body">
                      <h5 className="text-info mb-3 small uppercase">Common Genres</h5>
                      <div className="d-flex gap-2 flex-wrap">
                        {result.commonGenres.map(g => (
                          <span key={g} className="badge bg-secondary text-light small">{g}</span>
                        ))}
                        {result.commonGenres.length === 0 && <p className="text-info opacity-50 x-small">No common genres yet.</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shared Count */}
                <div className="col-md-6">
                  <div className="card bg-dark text-light border-secondary shadow h-100 d-flex align-items-center justify-content-center p-3">
                    <div className="text-center">
                      <h2 className="text-success mb-0 h3">{result.sharedCount}</h2>
                      <p className="text-info opacity-75 mb-0 small">Common Items</p>
                    </div>
                  </div>
                </div>

                {/* Shared Items */}
                {result.sharedItems.length > 0 && (
                  <div className="col-12">
                    <div className="card bg-dark text-light border-secondary shadow">
                      <div className="card-body">
                        <h5 className="text-info mb-3 small uppercase">You both watched</h5>
                        <div className="row row-cols-3 row-cols-md-5 g-2">
                          {result.sharedItems.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="col">
                              <div className="text-center">
                                <img src={item.image} className="img-fluid rounded mb-1" style={{ height: "100px", width: "100%", objectFit: "cover" }} />
                                <p className="x-small text-truncate mb-0 px-1">{item.title}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <div className="col-12">
                    <div className="card bg-dark text-light border-secondary shadow">
                      <div className="card-body">
                        <h5 className="text-info mb-3 small uppercase">You may like from their list</h5>
                        <div className="row row-cols-2 row-cols-sm-3 row-cols-md-5 g-2">
                          {result.recommendations.map((item, idx) => (
                            <div key={idx} className="col">
                              <Link to={`/details/${item.type}/${item.contentId}`} className="text-decoration-none">
                                <div className="text-center">
                                  <img src={item.image} className="img-fluid rounded mb-1 border border-secondary movie-card" style={{ height: "120px", width: "100%", objectFit: "cover" }} />
                                  <p className="x-small text-info text-truncate mb-0 px-1">{item.title}</p>
                                </div>
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Compare;
