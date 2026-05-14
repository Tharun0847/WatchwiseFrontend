import React, { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  useGetMovieDetailsQuery, 
  useGetAnimeDetailsQuery, 
  useGetMovieRecommendationsQuery, 
  useGetAnimeRecommendationsQuery 
} from "../services/mediaAPI";
import { 
  useGetReviewsQuery, 
  useAddReviewMutation, 
  useDeleteReviewMutation 
} from "../services/reviewAPI";
import { toast } from "react-hot-toast";

import { useGetWatchlistQuery, useUpdateWatchlistStatusMutation } from "../services/watchlistAPI";
import FavoriteButton from "../features/favorites/FavoriteButton";
import WatchlistButton from "../features/watchlist/WatchlistButton";
import OptimizedImage from "./OptimizedImage";
import DetailSkeleton from "./DetailSkeleton";

function Details() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.userReducer);
  const isMovie = type === "movie";

  // 1. Fetch Main Content
  const movieDetails = useGetMovieDetailsQuery(id, { skip: !isMovie });
  const animeDetails = useGetAnimeDetailsQuery(id, { skip: isMovie });
  const currentDetails = isMovie ? movieDetails : animeDetails;
  
  const data = useMemo(() => {
    if (isMovie) return currentDetails.data;
    return currentDetails.data?.data;
  }, [isMovie, currentDetails.data]);

  // 2. Fetch Recommendations
  const movieRecs = useGetMovieRecommendationsQuery(id, { skip: !isMovie });
  const animeRecs = useGetAnimeRecommendationsQuery(id, { skip: isMovie });
  const currentRecs = isMovie ? movieRecs : animeRecs;

  // 3. Review State
  const [showTrailer, setShowTrailer] = React.useState(false);
  const [ratingInput, setRatingInput] = React.useState(10);
  const [reviewTextInput, setReviewTextInput] = React.useState("");
  const { data: reviews, isLoading: reviewsLoading } = useGetReviewsQuery(id);
  const [addReview] = useAddReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  // 4. Watchlist status handling
  const { data: watchlist } = useGetWatchlistQuery(user?.id, { skip: !user?.id });
  const [updateWatchlistStatus] = useUpdateWatchlistStatusMutation();
  const watchlistItem = useMemo(() => watchlist?.find(item => item.contentId === id), [watchlist, id]);

  const isSafe = (item) => {
    if (item.adult) return false;
    const unsafeKeywords = [
      "nude", "sex", "porn", "adult", "erotica", "hot girls", "sensual", "naked", "xxx",
      "softcore", "lust", "desire", "erotic", "pleasure", "fetish", "voyeur", "prostitution", "brothel",
      "seduction", "lingerie", "strip", "kink", "swinger", "orgasm", "orgies", "ejaculation", "intercourse"
    ];
    const recTitle = isMovie ? item.title : (item.entry ? item.entry.title : item.title);
    const recOverview = isMovie ? item.overview : (item.entry ? item.entry.synopsis : item.synopsis);
    const textToSearch = `${recTitle} ${recOverview || ""}`.toLowerCase();
    return !unsafeKeywords.some(word => textToSearch.includes(word));
  };

  const recommendations = useMemo(() => {
    const rawRecs = isMovie ? (currentRecs.data?.results || []) : (currentRecs.data?.data || []);
    const watchlistIds = new Set(watchlist?.map(item => item.contentId) || []);
    
    return rawRecs.filter(item => {
      const itemId = isMovie ? String(item.id) : String(item.entry ? item.entry.mal_id : item.mal_id);
      return !watchlistIds.has(itemId) && isSafe(item);
    }).slice(0, 6);
  }, [isMovie, currentRecs.data, watchlist]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      await updateWatchlistStatus({ id: watchlistItem._id, status: newStatus }).unwrap();
      toast.success("Status updated!");
    } catch {
      toast.error("Error updating status");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewTextInput.trim()) return toast.error("Please write a review");
    try {
      await addReview({
        userId: user.id,
        username: user.username,
        contentId: id,
        type,
        rating: ratingInput,
        reviewText: reviewTextInput
      }).unwrap();
      toast.success("Review added!");
      setReviewTextInput("");
    } catch {
      toast.error("Failed to add review");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Delete this review?")) {
      try {
        await deleteReview(reviewId).unwrap();
        toast.success("Review deleted!");
      } catch {
        toast.error("Failed to delete review");
      }
    }
  };

  React.useEffect(() => {
    window.scrollTo(0, 0);
    setShowTrailer(false);
  }, [id, type]);

  if (currentDetails.isLoading) return <DetailSkeleton />;
  if (!data) return <div className="text-center mt-5 text-danger">Failed to load content.</div>;

  const title = isMovie ? data.title : data.title;
  const image = isMovie 
    ? (data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null) 
    : (data.images?.jpg?.large_image_url || null);
  const rating = isMovie ? data.vote_average : data.score;
  const description = isMovie ? data.overview : data.synopsis;
  const year = isMovie ? data.release_date?.split("-")[0] : data.year || data.status;
  
  // Watch providers logic
  let providers = [];
  if (isMovie) {
    const watchData = (data["watch/providers"] || data.watch_providers)?.results;
    if (watchData) {
      const regionalData = watchData.IN || watchData.US || Object.values(watchData)[0];
      providers = [
        ...(regionalData?.flatrate || []),
        ...(regionalData?.ads || []),
        ...(regionalData?.rent || []),
        ...(regionalData?.buy || [])
      ].filter((v, i, a) => a.findIndex(t => t.provider_id === v.provider_id) === i);
    }
  } else {
    providers = data.streaming || [];
  }

  // Trailer logic
  let trailerUrl = null;
  if (isMovie && data.videos?.results) {
    const trailer = data.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube");
    if (trailer) {
      trailerUrl = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
    }
  } else if (!isMovie && data.trailer?.embed_url) {
    trailerUrl = `${data.trailer.embed_url}${data.trailer.embed_url.includes("?") ? "&" : "?"}autoplay=1`;
  }

  return (
    <div className="container py-4 py-md-5">
      <button className="btn btn-outline-info mb-4" onClick={() => navigate(-1)}>
        &larr; Back
      </button>

      <div className="row g-4 g-md-5 mb-5">
        <div className="col-lg-4">
          <OptimizedImage 
            src={image} 
            alt={title} 
            className="rounded shadow-lg border border-secondary mb-4 w-100" 
            style={{ height: "auto", aspectRatio: "2/3" }}
            loading="eager"
          />
          
          <div className="d-grid gap-2">
            <WatchlistButton item={data} type={type} variant="full" />

            {watchlistItem && (
              <div className="mt-3">
                <label className="text-light mb-2 small uppercase">Watching Status</label>
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
        
        <div className="col-lg-8 text-light">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-3 gap-3 text-center text-md-start">
            <h1 className="display-4 fw-bold text-info mb-0">{title}</h1>
            <FavoriteButton 
              item={data} 
              type={type} 
              className="align-self-center align-self-md-start" 
              style={{ width: "50px", height: "50px" }}
            />
          </div>
          <div className="d-flex gap-2 gap-md-3 mb-4 align-items-center justify-content-center justify-content-md-start flex-wrap">
            <span className="badge bg-secondary text-light small">{year}</span>
            <span className="text-warning h5 mb-0">★ {typeof rating === 'number' ? rating.toFixed(1) : 'N/A'}</span>
            <span className="badge bg-info text-dark small">{type.toUpperCase()}</span>
          </div>

          <div className="mb-4 text-center text-md-start">
            <h5 className="text-info small uppercase mb-3">Where to Watch</h5>
            {providers.length > 0 ? (
              <div className="d-flex gap-3 flex-wrap justify-content-center justify-content-md-start align-items-center">
                {providers.map((p, idx) => (
                  <div key={idx} className="text-center" title={isMovie ? p.provider_name : p.name}>
                    {isMovie ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/original${p.logo_path}`} 
                        alt={p.provider_name}
                        className="rounded shadow-sm"
                        style={{ width: "45px", height: "45px" }}
                      />
                    ) : (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-info small border border-info rounded px-2 py-1">
                        {p.name}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary small mb-0">Not available for streaming in your region.</p>
            )}
          </div>
          
          <h3 className="h4 border-bottom border-secondary pb-2 mb-3">Synopsis</h3>
          <p className="opacity-75" style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>{description}</p>

          <div className="mb-4">
            <h5 className="text-info small uppercase">Genres</h5>
            <div className="d-flex gap-2 flex-wrap justify-content-center justify-content-md-start">
              {data.genres?.map(g => (
                <span key={isMovie ? g.id : g.mal_id} className="badge border border-info text-info small">
                  {g.name}
                </span>
              ))}
            </div>
          </div>

          {trailerUrl && (
            <div className="mt-5">
              <h3 className="h4 border-bottom border-secondary pb-2 mb-3">Trailer</h3>
              <div
                className="shadow-lg rounded overflow-hidden border border-secondary bg-dark"
                style={{ width: '100%', aspectRatio: '21/9', position: 'relative' }}
              >
                {showTrailer ? (                  <iframe 
                    src={trailerUrl} 
                    title="Trailer" 
                    allowFullScreen 
                    allow="autoplay; encrypted-media"
                    className="w-100 h-100"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  ></iframe>
                ) : (
                  <div 
                    className="d-flex flex-column align-items-center justify-content-center cursor-pointer"
                    onClick={() => setShowTrailer(true)}
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="text-white text-center">
                      <i className="bi bi-play-circle-fill display-1 text-info"></i>
                      <h4 className="mt-3 fw-bold text-info">Watch Trailer</h4>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="row mt-5 pt-5 border-top border-secondary g-4">
        <div className="col-lg-7 order-2 order-lg-1">
          <h2 className="text-light mb-4 h3">User Reviews</h2>
          {reviewsLoading ? (
            <p className="text-info">Loading reviews...</p>
          ) : reviews?.length === 0 ? (
            <p className="text-light opacity-50 small">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {reviews.map((rev) => (
                <div key={rev._id} className="card bg-dark text-light border-secondary">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="text-info mb-0 small">@{rev.username}</h6>
                      <span className="text-warning x-small">★ {rev.rating}/10</span>
                    </div>
                    <p className="card-text opacity-75 small">{rev.reviewText}</p>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <small className="text-info opacity-50 x-small">{new Date(rev.createdAt).toLocaleDateString()}</small>
                      {rev.userId === user.id && (
                        <button 
                          className="btn btn-sm btn-outline-danger border-0 py-0"
                          onClick={() => handleDeleteReview(rev._id)}
                        >
                          <i className="bi bi-trash small"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="col-lg-5 order-1 order-lg-2">
          <div className="card bg-dark text-light border-secondary shadow-sm sticky-lg-top" style={{ top: "100px" }}>
            <div className="card-body p-3 p-md-4">
              <h4 className="text-info mb-3 h5 uppercase">Leave a Review</h4>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-3">
                  <label className="form-label text-info opacity-75 x-small uppercase">Rating (1-10)</label>
                  <select 
                    className="form-select bg-secondary bg-opacity-10 text-light border-secondary py-2"
                    value={ratingInput}
                    onChange={(e) => setRatingInput(Number(e.target.value))}
                  >
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => (
                      <option key={n} value={n}>{n} ★</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label text-info opacity-75 x-small uppercase">Thoughts</label>
                  <textarea 
                    className="form-control bg-secondary bg-opacity-10 text-light border-secondary"
                    rows="3"
                    placeholder="What did you think?"
                    value={reviewTextInput}
                    onChange={(e) => setReviewTextInput(e.target.value)}
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-info w-100 fw-bold text-dark py-2">Post Review</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="mt-5 pt-5 border-top border-secondary">
          <h2 className="text-light mb-4 h3 px-1">Recommended Content</h2>
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-2 g-md-3">
            {recommendations.map((rec) => {
              const recId = isMovie ? rec.id : rec.entry ? rec.entry.mal_id : rec.mal_id;
              const recTitle = isMovie ? rec.title : rec.entry ? rec.entry.title : rec.title;
              const recImg = isMovie 
                ? (rec.poster_path ? `https://image.tmdb.org/t/p/w342${rec.poster_path}` : null) 
                : (rec.entry ? rec.entry.images?.jpg?.image_url : rec.images?.jpg?.image_url);

              return (
                <div key={recId} className="col">
                  <Link to={`/details/${type}/${recId}`} className="text-decoration-none">
                    <div className="card h-100 bg-dark text-light border-secondary movie-card shadow-sm">
                      <OptimizedImage 
                        src={recImg} 
                        alt={recTitle} 
                        className="card-img-top" 
                        style={{ height: "auto", aspectRatio: "2/3" }}
                      />
                      <div className="card-body p-2 d-flex align-items-center justify-content-center">
                        <p className="card-title text-info x-small text-truncate mb-0 px-1" title={recTitle}>
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
