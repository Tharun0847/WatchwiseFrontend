import React from "react";
import FavoriteButton from "../features/favorites/FavoriteButton";
import DislikeButton from "../features/favorites/DislikeButton";
import WatchlistButton from "../features/watchlist/WatchlistButton";
import OptimizedImage from "./OptimizedImage";

const MediaCard = ({ item, type, onClick, genres = [], priority = false }) => {
  const isMovie = type === "movie";
  const title = item.title || item.name;
  const rating = isMovie ? item.vote_average : item.score;
  const year = isMovie 
    ? (item.release_date ? item.release_date.split("-")[0] : "N/A")
    : (item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : item.status));
  
  // Use w342 for grid cards (Standard TMDB optimization)
  const image = isMovie 
    ? (item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null)
    : (item.images?.jpg?.large_image_url || null);

  const cardBorderClass = isMovie ? "border-secondary" : "border-success border-opacity-25";
  const titleColorClass = isMovie ? "text-info" : "text-success";
  const badgeClass = isMovie ? "bg-info text-dark" : "bg-success bg-opacity-25 text-white";

  const currentYear = new Date().getFullYear();
  const isNew = (parseInt(year) >= currentYear - 1);
  const isHighRated = (rating >= (isMovie ? 8 : 8.5));

  return (
    <div className="col">
      <div 
        className={`card h-100 bg-dark text-light shadow-sm movie-card position-relative ${cardBorderClass}`}
        onClick={onClick}
      >
        <FavoriteButton 
          item={item} 
          type={type} 
          genres={genres} 
          className="position-absolute top-0 end-0 m-1 m-md-2" 
        />
        <DislikeButton 
          item={item} 
          type={type} 
          genres={genres} 
          className="position-absolute top-0 start-0 m-1 m-md-2" 
        />
        <OptimizedImage 
          src={image} 
          alt={title} 
          className="card-img-top" 
          style={{ height: "auto", aspectRatio: "2/3" }}
          priority={priority}
        />
        <div className="card-body p-2 p-md-3">
          <h5 className={`${titleColorClass} card-title text-truncate small fw-bold mb-1`} title={title}>{title}</h5>
          <div className="d-flex justify-content-between align-items-center mb-1 mb-md-2">
            <span className="text-warning x-small">★ {rating ? rating.toFixed(1) : "N/A"}</span>
            <span className="badge bg-secondary x-small d-none d-sm-inline-block">{year}</span>
          </div>
          <div className="d-flex gap-1 flex-wrap d-none d-md-flex">
            {isNew && <span className="badge bg-success x-small">New</span>}
            {isHighRated && <span className="badge bg-warning text-dark x-small">Top</span>}
            {!isNew && !isHighRated && <span className={`badge x-small ${badgeClass}`}>{isMovie ? "Choice" : "Match"}</span>}
          </div>
          <WatchlistButton item={item} type={type} genres={genres} variant="icon" />
        </div>
      </div>
    </div>
  );
};

export default React.memo(MediaCard);
