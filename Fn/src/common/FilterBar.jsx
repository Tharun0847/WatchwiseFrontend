import React from "react";

const FilterBar = ({ 
  title, 
  genres = [], 
  selectedGenre = "", 
  onGenreChange = () => {}, 
  languages = [], 
  selectedLang = "", 
  onLanguageChange = () => {}, 
  type 
}) => {
  return (
    <div className="row mb-4 align-items-center g-3">
      <div className="col-lg-6">
        <h2 className="text-light mb-0 text-center text-lg-start">{title}</h2>
      </div>
      <div className="col-lg-6">
        <div className="d-flex gap-2 justify-content-center justify-content-lg-end">
          {type === "movie" && (
            <select 
              className="form-select bg-dark text-light border-secondary py-2"
              style={{ width: "180px" }}
              value={selectedLang}
              onChange={onLanguageChange}
            >
              <option value="">All Languages</option>
              {languages.map(l => (
                <option key={l.iso_639_1} value={l.iso_639_1}>
                  {l.english_name}
                </option>
              ))}
            </select>
          )}
          <select 
            className="form-select bg-dark text-light border-secondary py-2"
            style={{ width: "180px" }}
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
    </div>
  );
};

export default FilterBar;
