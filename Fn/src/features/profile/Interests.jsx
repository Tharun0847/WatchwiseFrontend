import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useUpdateProfileMutation } from "../../services/authAPI";
import { useGetMovieGenresQuery, useGetAnimeGenresQuery } from "../../services/mediaAPI";
import { updateUser } from "../auth/userSlice";
import { toast } from "react-hot-toast";

const EXCLUDED_GENRES = ["Hentai", "Erotica", "Ecchi", "Boys Love", "Girls Love", "Sexual Violence", "Gourmet", "Avant Garde", "Award Winning"];

function Interests() {
  const { user } = useSelector((state) => state.userReducer);
  const [updateProfile] = useUpdateProfileMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 1. Fetch Genres using RTK Query hooks
  const { data: movieGenresData, isLoading: movieLoading } = useGetMovieGenresQuery();
  const { data: animeGenresData, isLoading: animeLoading } = useGetAnimeGenresQuery();

  const [selectedGenres, setSelectedGenres] = useState(user.preferences?.genres || []);

  const movieGenres = useMemo(() => movieGenresData?.genres || [], [movieGenresData]);
  const animeGenres = useMemo(() => {
    return (animeGenresData?.data || []).filter(g => !EXCLUDED_GENRES.includes(g.name));
  }, [animeGenresData]);

  const loading = movieLoading || animeLoading;

  const toggleGenre = (genreName) => {
    if (selectedGenres.includes(genreName)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genreName));
    } else {
      setSelectedGenres([...selectedGenres, genreName]);
    }
  };

  const handleSave = async () => {
    if (selectedGenres.length < 3) {
      return toast.error("Please select at least 3 genres to get good recommendations!");
    }

    try {
      const res = await updateProfile({
        id: user.id,
        preferences: { genres: selectedGenres }
      }).unwrap();

      if (res.msg === "Profile Updated") {
        const updatedUser = { ...user, preferences: res.user.preferences };
        dispatch(updateUser(updatedUser));
        window.localStorage.setItem("user", JSON.stringify(updatedUser));
        toast.success("Interests updated!");
        navigate("/");
      }
    } catch (err) {
      toast.error("Failed to save interests");
    }
  };

  if (loading) return <div className="text-center mt-5 text-light">Loading interests...</div>;

  return (
    <div className="container py-4 py-md-5">
      <div className="text-center mb-4 mb-md-5">
        <h1 className="text-info fw-bold display-5">Welcome to WatchWise!</h1>
        <p className="lead text-light opacity-75 small">Tell us what you love to get personalized recommendations.</p>
      </div>

      <div className="card bg-dark text-light border-secondary shadow-lg p-2 p-md-4">
        <div className="card-body">
          <h3 className="mb-4 text-info border-bottom border-secondary pb-2 h5 uppercase">Select Your Favorite Genres</h3>
          
          <div className="mb-4 mb-md-5">
            <h5 className="text-info opacity-75 mb-3 uppercase small" style={{ fontSize: "0.7rem" }}>Movies</h5>
            <div className="d-flex flex-wrap gap-2">
              {movieGenres.map(g => (
                <button
                  key={g.id}
                  className={`btn btn-sm rounded-pill px-3 transition-all ${
                    selectedGenres.includes(g.name) ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary text-light'
                  }`}
                  onClick={() => toggleGenre(g.name)}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 mb-md-5">
            <h5 className="text-success opacity-75 mb-3 uppercase small" style={{ fontSize: "0.7rem" }}>Anime</h5>
            <div className="d-flex flex-wrap gap-2">
              {animeGenres.map(g => (
                <button
                  key={g.mal_id}
                  className={`btn btn-sm rounded-pill px-3 transition-all ${
                    selectedGenres.includes(g.name) ? 'btn-success text-white fw-bold' : 'btn-outline-secondary text-light'
                  }`}
                  onClick={() => toggleGenre(g.name)}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center mt-4 mt-md-5">
            <button 
              className="btn btn-info btn-lg px-5 rounded-pill fw-bold shadow text-dark w-100 w-md-auto"
              onClick={handleSave}
            >
              Start Exploring &rarr;
            </button>
            <p className="mt-3 text-info opacity-50 small x-small">You can change these later in your profile.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Interests;
