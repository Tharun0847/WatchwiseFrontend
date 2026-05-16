import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useUpdateProfileMutation, useGetUserByIdQuery } from "../../services/authAPI";
import { useGetUserStatsQuery } from "../../services/analyticsAPI";
import { updateUser } from "../auth/userSlice";
import { Link, useParams } from "react-router-dom";
import Analytics from "../analytics/Analytics";
import Compare from "../comparison/Compare";
import ProfileFavorites from "./ProfileFavorites";
import { toast } from "react-hot-toast";

function Profile() {
  const { id: urlId } = useParams();
  const { user: currentUser } = useSelector((state) => state.userReducer);
  const isOwnProfile = !urlId || urlId === currentUser.id;
  
  const targetUserId = isOwnProfile ? currentUser.id : urlId;
  
  const { data: fetchedUser, isLoading: userLoading } = useGetUserByIdQuery(targetUserId, { skip: isOwnProfile });
  const [updateProfileFn] = useUpdateProfileMutation();
  const dispatch = useDispatch();

  const activeUser = isOwnProfile ? currentUser : (fetchedUser ? { 
    id: fetchedUser._id, 
    username: fetchedUser.name, 
    email: fetchedUser.email, 
    preferences: fetchedUser.preferences 
  } : null);

  const { data: analyticsSummary, isLoading: statsLoading } = useGetUserStatsQuery(targetUserId, { skip: !targetUserId });

  const topGenres = analyticsSummary?.genreData 
    ? [...analyticsSummary.genreData].sort((a, b) => b.value - a.value).slice(0, 3) 
    : [];

  const [isEditing, setIsEditing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    oldPassword: "",
    newPassword: "",
  });

  // Reset UI states when navigating between different profiles
  useEffect(() => {
    setIsComparing(false);
    setIsEditing(false);
    setShowAllGenres(false);
  }, [urlId]);

  useEffect(() => {
    if (isOwnProfile && currentUser) {
      setFormData({
        name: currentUser.username || "",
        email: currentUser.email || "",
        oldPassword: "",
        newPassword: "",
      });
    }
  }, [isOwnProfile, currentUser]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfileFn({ id: currentUser.id, ...formData }).unwrap();
      if (res.msg === "Profile Updated") {
        const updatedUser = { ...currentUser, username: res.user.username, email: res.user.email };
        dispatch(updateUser(updatedUser));
        window.localStorage.setItem("user", JSON.stringify(updatedUser));
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        setFormData(prev => ({ ...prev, oldPassword: "", newPassword: "" }));
      }
    } catch (err) {
      toast.error(err.data?.msg || "Error updating profile");
    }
  };

  if (userLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-info" role="status"></div>
        <p className="mt-3 text-info">Loading profile...</p>
      </div>
    );
  }

  if (!activeUser && !isOwnProfile) {
    return (
      <div className="container py-5 text-center">
        <h3 className="text-danger">User not found</h3>
        <Link to="/discover" className="btn btn-outline-info mt-3">Back to Discover</Link>
      </div>
    );
  }

  return (
    <div className="container py-4 py-md-5">
      {/* Horizontal Header Profile Card */}
      <div className="card bg-dark text-light border-secondary shadow mb-5 overflow-hidden rounded-4">
        <div className="card-body p-0">
          <div className="row g-0">
            {/* Left: Avatar and Identity */}
            <div className="col-lg-4 border-end border-secondary p-4 d-flex flex-column align-items-center justify-content-center bg-black bg-opacity-25 position-relative">
              {isOwnProfile && (
                <button 
                  className="btn btn-outline-info btn-sm position-absolute top-0 end-0 m-3 rounded-circle" 
                  onClick={() => setIsEditing(true)}
                  style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Edit Profile"
                >
                  <i className="bi bi-pencil-fill"></i>
                </button>
              )}
              <div 
                className="bg-info text-dark rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-lg border border-info border-4" 
                style={{ width: "110px", height: "110px", fontSize: "2.8rem", fontWeight: "bold" }}
              >
                {activeUser?.username?.[0].toUpperCase() || "U"}
              </div>
              <h2 className="text-info h3 mb-1 fw-bold">{activeUser?.username}</h2>
              <p className="text-info opacity-50 small mb-4">{activeUser?.email}</p>
              
              {!isOwnProfile && (
                <button 
                  className={`btn ${isComparing ? "btn-outline-info" : "btn-info text-dark"} btn-sm rounded-pill fw-bold px-4 shadow-sm`}
                  onClick={() => setIsComparing(!isComparing)}
                >
                  {isComparing ? <><i className="bi bi-graph-up me-2"></i>View Insights</> : <><i className="bi bi-people-fill me-2"></i>Compare Taste</>}
                </button>
              )}
            </div>

            {/* Middle: Stats Summary - Top Aligned */}
            <div className="col-lg-5 p-4 pt-5 d-flex flex-column justify-content-start border-end border-secondary">
              <div className="d-flex align-items-center mb-4">
                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                  <i className="bi bi-activity text-info"></i>
                </div>
                <h6 className="text-info uppercase mb-0 fw-bold tracking-wider" style={{ letterSpacing: "1px" }}>Activity Overview</h6>
              </div>
              
              {statsLoading ? (
                <div className="d-flex justify-content-around py-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="text-center">
                      <div className="bg-secondary bg-opacity-25 rounded-circle mb-2 mx-auto" style={{ width: "30px", height: "30px" }}></div>
                      <div className="bg-secondary bg-opacity-25 rounded" style={{ width: "40px", height: "10px" }}></div>
                    </div>
                  ))}
                </div>
              ) : analyticsSummary ? (
                <>
                  <div className="row g-2 text-center">
                    <div className="col-3">
                      <div className="p-3 bg-black bg-opacity-25 rounded-4 border border-secondary border-opacity-25 shadow-sm">
                        <div className="text-info h4 mb-0 fw-bold">{analyticsSummary.summary.totalItems}</div>
                        <div className="text-info opacity-50 x-small uppercase fw-bold mt-1">Items</div>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-3 bg-black bg-opacity-25 rounded-4 border border-secondary border-opacity-25 shadow-sm">
                        <div className="text-success h4 mb-0 fw-bold">{analyticsSummary.summary.completedCount}</div>
                        <div className="text-info opacity-50 x-small uppercase fw-bold mt-1">Done</div>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-3 bg-black bg-opacity-25 rounded-4 border border-secondary border-opacity-25 shadow-sm">
                        <div className="text-warning h4 mb-0 fw-bold">{analyticsSummary.summary.avgRating}</div>
                        <div className="text-info opacity-50 x-small uppercase fw-bold mt-1">Avg ★</div>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-3 bg-black bg-opacity-25 rounded-4 border border-secondary border-opacity-25 shadow-sm">
                        <div className="text-info h4 mb-0 fw-bold">{analyticsSummary.summary.favoriteCount}</div>
                        <div className="text-info opacity-50 x-small uppercase fw-bold mt-1">Favs</div>
                      </div>
                    </div>
                  </div>

                  {/* Top Interests (Dynamic) */}
                  <div className="mt-4 pt-3 border-top border-secondary border-opacity-25">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-fire text-warning me-2 small"></i>
                      <span className="text-info opacity-75 x-small uppercase fw-bold" style={{ letterSpacing: "0.5px" }}>Top Interests (Activity)</span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {topGenres.length > 0 ? (
                        topGenres.map(g => (
                          <span key={g.name} className="badge bg-warning bg-opacity-10 border border-warning border-opacity-25 text-warning x-small py-1 px-2 fw-normal">
                            {g.name} <span className="opacity-50 ms-1">{g.value}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-info opacity-50 x-small italic">Add movies or anime to see top interests</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-3 bg-black bg-opacity-10 rounded-3">
                  <p className="text-info opacity-50 small italic mb-0">No activity data available.</p>
                </div>
              )}
            </div>

            {/* Right: Interests (Static Preferences) - Top Aligned */}
            <div className="col-lg-3 p-4 pt-5 d-flex flex-column justify-content-start bg-black bg-opacity-10">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                  <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                    <i className="bi bi-stars text-info"></i>
                  </div>
                  <h6 className="text-info uppercase mb-0 fw-bold tracking-wider" style={{ letterSpacing: "1px" }}>Preferred</h6>
                </div>
                {isOwnProfile && (
                  <Link to="/interests" className="btn btn-outline-info btn-sm px-2 py-0 text-decoration-none x-small uppercase fw-bold rounded-pill">Edit</Link>
                )}
              </div>
              
              <div className="d-flex flex-wrap gap-2">
                {activeUser?.preferences?.genres?.length > 0 ? (
                  (showAllGenres ? activeUser.preferences.genres : activeUser.preferences.genres.slice(0, 8)).map(genre => (
                    <span key={genre} className="badge bg-info bg-opacity-10 border border-info border-opacity-25 text-info x-small py-1 px-2 fw-normal">
                      {genre}
                    </span>
                  ))
                ) : (
                  <div className="text-center w-100 py-3 border border-secondary border-dashed rounded-3">
                    <span className="text-info opacity-50 small italic">No interests selected</span>
                  </div>
                )}
                {activeUser?.preferences?.genres?.length > 8 && (
                  <button 
                    className="btn btn-link p-0 text-info opacity-50 x-small align-self-center ms-1 text-decoration-none fw-bold"
                    onClick={() => setShowAllGenres(!showAllGenres)}
                  >
                    {showAllGenres ? "Show Less" : `+${activeUser.preferences.genres.length - 8} more`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="row g-4">
        <div className="col-12">
          {isComparing ? (
            <div className="animate-fade-in">
              <div className="card bg-dark text-light border-secondary shadow-lg rounded-4">
                <div className="card-body p-4 p-md-5">
                  <div className="d-flex justify-content-between align-items-center mb-5 border-bottom border-secondary pb-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-info bg-opacity-10 p-3 rounded-circle me-3">
                        <i className="bi bi-people-fill text-info fs-4"></i>
                      </div>
                      <h3 className="mb-0 text-info h4 fw-bold">Taste Comparison</h3>
                    </div>
                    <button className="btn btn-outline-info btn-sm rounded-pill px-4 fw-bold" onClick={() => setIsComparing(false)}>
                      <i className="bi bi-arrow-left me-2"></i>Back to Insights
                    </button>
                  </div>
                  <Compare targetUserId={targetUserId} />
                </div>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {/* Visual Insights Section */}
              <div className="col-lg-8">
                <div className="card bg-dark text-light border-secondary shadow-lg h-100 rounded-4">
                  <div className="card-body p-4 p-md-5">
                    <div className="d-flex align-items-center mb-5 border-bottom border-secondary pb-3">
                      <div className="bg-info bg-opacity-10 p-3 rounded-circle me-3">
                        <i className="bi bi-graph-up text-info fs-4"></i>
                      </div>
                      <h3 className="mb-0 text-info h4 fw-bold">Viewing Analytics</h3>
                    </div>
                    <Analytics userId={targetUserId} />
                  </div>
                </div>
              </div>

              {/* Favorites Section */}
              <div className="col-lg-4">
                <ProfileFavorites userId={targetUserId} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal/Overlay */}
      {isEditing && isOwnProfile && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
          style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1060 }}
        >
          <div className="card bg-dark text-light border-info shadow-lg rounded-4" style={{ maxWidth: "450px", width: "90%" }}>
            <div className="card-header border-info bg-info bg-opacity-10 d-flex justify-content-between align-items-center p-3">
              <h5 className="mb-0 text-info uppercase fw-bold">Edit Profile</h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={() => setIsEditing(false)}
              ></button>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleUpdate}>
                <div className="mb-3">
                  <label className="form-label text-info opacity-75 small uppercase fw-bold">Username</label>
                  <input 
                    type="text" 
                    className="form-control bg-secondary bg-opacity-10 text-light border-secondary"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-info opacity-75 small uppercase fw-bold">Email</label>
                  <input 
                    type="email" 
                    className="form-control bg-secondary bg-opacity-10 text-light border-secondary"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                
                <hr className="border-secondary my-4" />
                <h6 className="text-info small uppercase mb-3 fw-bold">Change Password (Optional)</h6>
                
                <div className="mb-3">
                  <label className="form-label text-info opacity-75 small uppercase fw-bold">Current Password</label>
                  <input 
                    type="password" 
                    className="form-control bg-secondary bg-opacity-10 text-light border-secondary"
                    value={formData.oldPassword}
                    onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label text-info opacity-75 small uppercase fw-bold">New Password</label>
                  <input 
                    type="password" 
                    className="form-control bg-secondary bg-opacity-10 text-light border-secondary"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                </div>
                
                <div className="d-grid gap-2 mt-4">
                  <button type="submit" className="btn btn-info rounded-pill fw-bold text-dark shadow">
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary rounded-pill fw-bold mt-2" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
