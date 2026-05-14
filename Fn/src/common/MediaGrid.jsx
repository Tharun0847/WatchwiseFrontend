import React from "react";
import MediaCard from "./MediaCard";

const MediaGrid = ({ items, type, onDetails, genres, priorityCount = 0 }) => {
  return (
    <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-2 g-md-4">
      {items.map((item, index) => {
        const itemId = type === "movie" ? item.id.toString() : item.mal_id.toString();

        return (
          <MediaCard
            key={itemId}
            item={item}
            type={type}
            onClick={() => onDetails(item)}
            genres={genres}
            priority={index < priorityCount}
          />
        );
      })}
    </div>
  );
};

export default MediaGrid;
