import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { fetchMovieDetails, fetchAnimeDetails, fetchMovieRecommendations, fetchAnimeRecommendations } from "../services/mediaAPI";
import { addToWatchlist, getWatchlist, updateWatchlistStatus, removeFromWatchlist } from "../services/watchlistAPI";
import { useGetReviewsQuery, useAddReviewMutation, useDeleteReviewMutation } from "../services/reviewAPI";
import { useGetFavoritesQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } from "../services/favoriteAPI";

function Details() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.userReducer);
  const [data, setData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchlistItem, setWatchlistItem] = useState(null);

  // Review State
  const [ratingInput, setRatingInput] = useState(10);
  const [reviewTextInput, setReviewTextInput] = useState("");
  const { data: reviews, isLoading: reviewsLoading } = useGetReviewsQuery(id);
  const [addReview] = useAddReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  // Favorite Hooks
  const { data: favorites } = useGetFavoritesQuery(user?.id, { skip: !user?.id });
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();
  const isFavorite = favorites?.find(f => f.contentId === id);

  const loadDetails = async () => {
    setLoading(true);
    try {
      let res, recRes, watchlistRes;
      if (type === "movie") {
        [res, recRes] = await Promise.all([
          fetchMovieDetails(id),
          fetchMovieRecommendations(id)
        ]);
      } else {
        res = await fetchAnimeDetails(id);
        await new Promise(resolve => setTimeout(resolve, 500));
        recRes = await fetchAnimeRecommendations(id);
      }

      if (user?.id) {
        watchlistRes = await getWatchlist(user.id);
      }

      const watchlistIds = new Set(watchlistRes?.data.map(item => item.contentId) || []);
      
      setData(type === "movie" ? res.data : res.data.data);
      
      const recData = type === "movie" ? recRes.data.results : recRes.data.data;
      const filteredRecs = recData.filter(item => {
        const itemId = type === "movie" ? String(item.id) : String(item.entry ? item.entry.mal_id : item.mal_id);
        return !watchlistIds.has(itemId);
      });

      setRecommendations(filteredRecs.slice(0, 6));
      setLoading(false);
    } catch (err) {
      console.error("Failed to load details", err);
      setLoading(false);
    }
  };

  const checkWatchlist = async () => {
    if (!user?.id) return;
    try {
      const res = await getWatchlist(user.id);
      const found = res.data.find(item => item.contentId === id);
      setWatchlistItem(found || null);
    } catch (error) {
      console.error("Error checking watchlist", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      window.scrollTo(0, 0);
      await loadDetails();
      if (user?.id) {
        await checkWatchlist();
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id, user?.id]);

  const handleToggleWatchlist = async () => {
    if (!user?.id) return alert("Please login to use watchlist");

    if (watchlistItem) {
      try {
        await removeFromWatchlist(watchlistItem._id);
        setWatchlistItem(null);
        alert("Removed from watchlist");
      } catch {
        alert("Error removing from watchlist");
      }
    } else {
      try {
        const item = {
          userId: user.id,
          contentId: id,
          title: isMovie ? data.title : data.title,
          image: isMovie ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : data.images.jpg.large_image_url,
          rating: (isMovie ? data.vote_average : data.score) || 0,
          genres: data.genres?.map(g => g.name) || [],
          type: type
        };
        const res = await addToWatchlist(item);
        setWatchlistItem(res.data);
        alert("Added to watchlist");
      } catch (error) {
        console.error("Add error details:", error.response?.data);
        alert(error.response?.data?.message || "Error adding to watchlist");
      }
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      await updateWatchlistStatus(watchlistItem._id, newStatus);
      setWatchlistItem({ ...watchlistItem, status: newStatus });
    } catch {
      alert("Error updating status");
    }
  };

  const handleToggleFavorite = async () => {
    if (!user?.id) return alert("Please login to use favorites");
    try {
      if (isFavorite) {
        await removeFavorite(isFavorite._id).unwrap();
      } else {
        await addFavorite({
          userId: user.id,
          contentId: id,
          title: isMovie ? data.title : data.title,
          image: isMovie ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : data.images.jpg.large_image_url,
          rating: (isMovie ? data.vote_average : data.score) || 0,
          genres: data.genres?.map(g => g.name) || [],
          type: type
        }).unwrap();
      }
    } catch {
      alert("Error toggling favorite");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewTextInput.trim()) return alert("Please write a review");
    try {
      await addReview({
        userId: user.id,
        username: user.username,
        contentId: id,
        type,
        rating: ratingInput,
        reviewText: reviewTextInput
      }).unwrap();
      setReviewTextInput("");
      alert("Review added!");
    } catch {
      alert("Failed to add review");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Delete this review?")) {
      try {
        await deleteReview(reviewId).unwrap();
      } catch {
        alert("Failed to delete review");
      }
    }
  };

  if (loading && !data) return <div className="text-center mt-5 text-light">Loading details...</div>;
  if (!data) return <div className="text-center mt-5 text-danger">Failed to load content.</div>;

  const isMovie = type === "movie";
  const title = isMovie ? data.title : data.title;
  const image = isMovie 
    ? `https://image.tmdb.org/t/p/w500${data.poster_path}` 
    : data.images.jpg.large_image_url;
  const rating = isMovie ? data.vote_average : data.score;
  const description = isMovie ? data.overview : data.synopsis;
  const year = isMovie ? data.release_date?.split("-")[0] : data.year || data.status;
  
  // Trailer logic
  let trailerUrl = null;
  if (isMovie && data.videos?.results) {
    const trailer = data.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube");
    if (trailer) trailerUrl = `https://www.youtube.com/embed/${trailer.key}`;
  } else if (!isMovie && data.trailer?.embed_url) {
    trailerUrl = data.trailer.embed_url;
  }

  return (
    <div className="container py-5">
      <button className="btn btn-outline-info mb-4" onClick={() => navigate(-1)}>
        &larr; Back
      </button>

      <div className="row g-5 mb-5">
        <div className="col-md-4">
          <img src={image} alt={title} className="img-fluid rounded shadow-lg border border-secondary mb-4" />
          
          <div className="d-grid gap-2">
            <button 
              className={`btn btn-lg ${watchlistItem ? 'btn-outline-danger' : 'btn-info'}`}
              onClick={handleToggleWatchlist}
            >
              {watchlistItem ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </button>

            {watchlistItem && (
              <div className="mt-3">
                <label className="text-light mb-2">Watching Status</label>
                <select 
                  className="form-select bg-dark text-light border-secondary"
                  value={watchlistItem.status}
                  onChange={handleStatusChange}
                >
                  <option value="Plan to Watch">Plan to Watch</option>
                  <option value="Currently Watching">Currently Watching</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            )}
          </div>
        </div>
        
        <div className="col-md-8 text-light">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h1 className="display-4 fw-bold text-info mb-0">{title}</h1>
            <button 
              className={`btn btn-lg rounded-circle shadow-sm d-flex align-items-center justify-content-center ${isFavorite ? 'btn-info text-dark' : 'btn-outline-info'}`}
              onClick={handleToggleFavorite}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              style={{ width: "50px", height: "50px" }}
            >
              <i className={`bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'}`} style={{ fontSize: "1.2rem" }}></i>
            </button>
          </div>
          <div className="d-flex gap-3 mb-4 align-items-center">
            <span className="badge bg-secondary text-light fs-5">{year}</span>
            <span className="text-warning fs-4">★ {typeof rating === 'number' ? rating.toFixed(1) : 'N/A'}</span>
            <span className="badge bg-info text-dark">{type.toUpperCase()}</span>
          </div>
          
          <h3 className="h4 border-bottom border-secondary pb-2 mb-3">Synopsis</h3>
          <p className="lead opacity-75">{description}</p>

          <div className="mb-4">
            <h5 className="text-info">Genres</h5>
            <div className="d-flex gap-2 flex-wrap">
              {data.genres?.map(g => (
                <span key={isMovie ? g.id : g.mal_id} className="badge border border-info text-info">
                  {g.name}
                </span>
              ))}
            </div>
          </div>

          {trailerUrl && (
            <div className="mt-5">
              <h3 className="h4 border-bottom border-secondary pb-2 mb-3">Trailer</h3>
              <div className="ratio ratio-16x9 shadow-lg rounded overflow-hidden border border-secondary">
                <iframe src={trailerUrl} title="Trailer" allowFullScreen></iframe>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="row mt-5 pt-5 border-top border-secondary">
        <div className="col-md-7">
          <h2 className="text-light mb-4">User Reviews</h2>
          {reviewsLoading ? (
            <p className="text-info">Loading reviews...</p>
          ) : reviews?.length === 0 ? (
            <p className="text-light opacity-50">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {reviews.map((rev) => (
                <div key={rev._id} className="card bg-dark text-light border-secondary">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="text-info mb-0">@{rev.username}</h6>
                      <span className="text-warning">★ {rev.rating}/10</span>
                    </div>
                    <p className="card-text opacity-75">{rev.reviewText}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-info opacity-75">{new Date(rev.createdAt).toLocaleDateString()}</small>
                      {rev.userId === user.id && (
                        <button 
                          className="btn btn-sm btn-outline-danger border-0"
                          onClick={() => handleDeleteReview(rev._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="col-md-5">
          <div className="card bg-dark text-light border-secondary shadow-sm sticky-top" style={{ top: "100px" }}>
            <div className="card-body">
              <h4 className="text-info mb-3">Leave a Review</h4>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-3">
                  <label className="form-label text-info opacity-75 small">Your Rating (1-10)</label>
                  <select 
                    className="form-select bg-secondary bg-opacity-10 text-light border-secondary"
                    value={ratingInput}
                    onChange={(e) => setRatingInput(Number(e.target.value))}
                  >
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => (
                      <option key={n} value={n}>{n} ★</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label text-info opacity-75 small">Your Thoughts</label>
                  <textarea 
                    className="form-control bg-secondary bg-opacity-10 text-light border-secondary"
                    rows="4"
                    placeholder="What did you think of this?"
                    value={reviewTextInput}
                    onChange={(e) => setReviewTextInput(e.target.value)}
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-info w-100 fw-bold text-dark">Post Review</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="mt-5 pt-5 border-top border-secondary">
          <h2 className="text-light mb-4">Recommended Content</h2>
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-3">
            {recommendations.map((rec) => {
              const recId = isMovie ? rec.id : rec.entry ? rec.entry.mal_id : rec.mal_id;
              const recTitle = isMovie ? rec.title : rec.entry ? rec.entry.title : rec.title;
              const recImg = isMovie 
                ? `https://image.tmdb.org/t/p/w500${rec.poster_path}` 
                : rec.entry ? rec.entry.images.jpg.image_url : rec.images.jpg.image_url;

              return (
                <div key={recId} className="col">
                  <Link to={`/details/${type}/${recId}`} className="text-decoration-none">
                    <div className="card h-100 bg-dark text-light border-secondary movie-card shadow-sm">
                      <img src={recImg} className="card-img-top" alt={recTitle} style={{ height: "200px", objectFit: "cover" }} />
                      <div className="card-body p-2">
                        <p className="card-title text-info small text-truncate mb-0" title={recTitle}>
                          {recTitle}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Details;
