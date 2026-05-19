import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGetFavoritesQuery } from "../../services/favoriteAPI";
import FavoriteButton from "../favorites/FavoriteButton";
import DislikeButton from "../favorites/DislikeButton";
import OptimizedImage from "../../common/OptimizedImage";

const ProfileFavorites = ({ userId }) => {
  const { data: favorites, isLoading: favLoading } = useGetFavoritesQuery(userId, { skip: !userId });
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;

  const totalPages = favorites ? Math.ceil(favorites.length / itemsPerPage) : 0;
  const currentFavorites = favorites ? favorites.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage) : [];

  if (currentPage > 0 && currentFavorites.length === 0) {
    setCurrentPage(0);
  }

  return (
    <div className="mb-5">
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary pb-3">
        <div className="d-flex align-items-center">
          <div className="bg-info bg-opacity-10 p-2 rounded-circle me-3">
            <i className="bi bi-heart-fill text-info"></i>
          </div>
          <h3 className="mb-0 text-info h5 fw-bold">Favorites</h3>
        </div>
        
        {totalPages > 1 && (
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-info btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center"
              style={{ width: "28px", height: "28px" }}
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              title="Previous"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button 
              className="btn btn-outline-info btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center"
              style={{ width: "28px", height: "28px" }}
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
              title="Next"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
      
      {favLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border spinner-border-sm text-info"></div>
          <p className="small text-info opacity-50 mt-3">Loading favs...</p>
        </div>
      ) : !favorites || favorites.length === 0 ? (
        <div className="text-center py-5 bg-black bg-opacity-10 rounded-4 border border-secondary border-dashed">
          <i className="bi bi-heart mb-3 d-block fs-1 opacity-25"></i>
          <p className="small text-info opacity-50">No favorites added yet.</p>
        </div>
      ) : (
        <>
          <div className="row row-cols-2 g-3">
            {currentFavorites.map((fav) => (
              <div key={fav._id} className="col">
                <Link to={`/details/${fav.type}/${fav.contentId}`} className="text-decoration-none d-block h-100">
                  <div className="card h-100 bg-dark text-light border-secondary movie-card shadow-sm position-relative overflow-hidden border-0 rounded-3">
                    <FavoriteButton 
                      item={fav} 
                      type={fav.type} 
                      className="position-absolute top-0 end-0 m-2"
                    />
                    <DislikeButton 
                      item={fav} 
                      type={fav.type} 
                      className="position-absolute top-0 start-0 m-2"
                    />
                    <div className="position-relative overflow-hidden" style={{ height: "130px" }}>
                      <OptimizedImage 
                        src={fav.image} 
                        alt={fav.title} 
                        className="card-img-top w-100 h-100 object-fit-cover"
                      />
                      <div className="position-absolute bottom-0 start-0 w-100 p-2 bg-dark bg-opacity-75">
                        <p className="card-title text-info x-small text-truncate mb-0 fw-bold" title={fav.title}>{fav.title}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="text-center mt-4 pt-3 border-top border-secondary border-opacity-25">
              <span className="text-info opacity-50 x-small uppercase fw-bold tracking-wider">
                Page {currentPage + 1} of {totalPages}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(ProfileFavorites);
