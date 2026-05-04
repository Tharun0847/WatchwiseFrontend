import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useUpdateProfileMutation } from "../services/authAPI";
import { getWatchlist } from "../services/watchlistAPI";
import { useGetFavoritesQuery } from "../services/favoriteAPI";
import { updateUser } from "./userSlice";
import { Link } from "react-router-dom";

function Profile() {
  const { user } = useSelector((state) => state.userReducer);
  const [updateProfileFn] = useUpdateProfileMutation();
  const dispatch = useDispatch();

  const { data: favorites, isLoading: favLoading } = useGetFavoritesQuery(user?.id, { skip: !user?.id });

  const [formData, setFormData] = useState({
    name: user.username || "",
    email: user.email || "",
    password: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    movies: 0,
    anime: 0,
    completed: 0,
    topGenres: []
  });

  const fetchStats = async () => {
    try {
      const res = await getWatchlist(user.id);
      const items = res.data;
      
      // Calculate top genres
      const genreCounts = {};
      items.forEach(item => {
        item.genres?.forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      });
      const sortedGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(g => g[0]);

      setStats({
        total: items.length,
        movies: items.filter(i => i.type === "movie").length,
        anime: items.filter(i => i.type === "anime").length,
        completed: items.filter(i => i.status === "Completed").length,
        topGenres: sortedGenres
      });
    } catch {
      console.error("Error fetching stats");
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchStats();
    };
    init();
  }, [user.id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfileFn({ id: user.id, ...formData }).unwrap();
      if (res.msg === "Profile Updated") {
        const updatedUser = { ...user, username: res.user.username, email: res.user.email };
        dispatch(updateUser(updatedUser));
        window.localStorage.setItem("user", JSON.stringify(updatedUser));
        alert("Profile updated successfully!");
      }
    } catch {
      alert("Error updating profile");
    }
  };

  return (
    <div className="container py-5">
      <div className="row g-4">
        {/* Statistics Section */}
        <div className="col-md-4">
          <div className="card bg-dark text-light border-secondary shadow h-100">
            <div className="card-body p-4 text-center">
              <div 
                className="bg-info text-dark rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                style={{ width: "80px", height: "80px", fontSize: "2rem", fontWeight: "bold" }}
              >
                {user.username?.[0].toUpperCase()}
              </div>
              <h3 className="text-info">{user.username}</h3>
              <p className="opacity-75">{user.email}</p>
              
              <hr className="border-secondary my-4" />
              
              <div className="row g-3">
                <div className="col-6">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <h4 className="mb-0 text-info">{stats.total}</h4>
                    <small className="text-info opacity-75">Total Items</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <h4 className="mb-0 text-success">{stats.completed}</h4>
                    <small className="text-info opacity-75">Completed</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <h4 className="mb-0 text-light">{stats.movies}</h4>
                    <small className="text-info opacity-75">Movies</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <h4 className="mb-0 text-light">{stats.anime}</h4>
                    <small className="text-info opacity-75">Anime</small>
                  </div>
                </div>
              </div>

              {stats.topGenres.length > 0 && (
                <div className="mt-4 text-start">
                  <div className="d-flex justify-content-between align-items-center mb-2 px-3">
                    <label className="text-info opacity-75 small uppercase mb-0">Top Interests</label>
                    <Link to="/interests" className="text-info small text-decoration-none border border-info px-2 rounded">Edit</Link>
                  </div>
                  <div className="d-flex flex-wrap gap-2 justify-content-center">
                    {stats.topGenres.map(g => (
                      <span key={g} className="badge border border-info text-info">{g}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="col-md-8">
          <div className="card bg-dark text-light border-secondary shadow">
            <div className="card-body p-4">
              <h3 className="mb-4 text-info border-bottom border-secondary pb-2">Profile Settings</h3>
              
              <form onSubmit={handleUpdate}>
                <div className="mb-3">
                  <label className="form-label text-info opacity-75 small uppercase">Username</label>
                  <input 
                    type="text" 
                    className="form-control bg-secondary bg-opacity-10 text-light border-secondary p-3"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label text-info opacity-75 small uppercase">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control bg-secondary bg-opacity-10 text-light border-secondary p-3"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label text-info opacity-75 small uppercase">New Password (leave blank to keep current)</label>
                  <input 
                    type="password" 
                    className="form-control bg-secondary bg-opacity-10 text-light border-secondary p-3"
                    placeholder="Enter new password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-info btn-lg px-5 rounded-pill fw-bold text-dark">
                  Save Changes
                </button>
              </form>
            </div>
          </div>

          {/* Favorites Section */}
          <div className="card bg-dark text-light border-secondary shadow mt-4">
            <div className="card-body p-4">
              <h3 className="mb-4 text-info border-bottom border-secondary pb-2"><i className="bi bi-heart-fill me-2"></i>My Favorites</h3>
              {favLoading ? (
                <p>Loading favorites...</p>
              ) : favorites?.length === 0 ? (
                <p className="text-info opacity-75">You haven't added any favorites yet.</p>
              ) : (
                <div className="row row-cols-2 row-cols-md-4 g-3">
                  {favorites.map((fav) => (
                    <div key={fav._id} className="col">
                      <Link to={`/details/${fav.type}/${fav.contentId}`} className="text-decoration-none">
                        <div className="card h-100 bg-dark text-light border-secondary movie-card shadow-sm">
                          <img src={fav.image} className="card-img-top" alt={fav.title} style={{ height: "180px", objectFit: "cover" }} />
                          <div className="card-body p-2 text-center">
                            <p className="card-title text-info small text-truncate mb-0" title={fav.title}>{fav.title}</p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
