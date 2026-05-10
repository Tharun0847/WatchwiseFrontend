import React from "react";

const FilterBar = ({ title, genres, selectedGenre, onGenreChange, type }) => {
  return (
    <div className="row mb-4 align-items-center g-3">
      <div className="col-lg-8">
        <h2 className="text-light mb-0 text-center text-lg-start">{title}</h2>
      </div>
      <div className="col-lg-4">
        <select 
          className="form-select bg-dark text-light border-secondary py-2"
          value={selectedGenre}
          onChange={onGenreChange}
        >
          <option value="">All Genres</option>
          {genres.map(g => (
            <option key={type === "movie" ? g.id : g.mal_id} value={type === "movie" ? g.id : g.mal_id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterBar;
