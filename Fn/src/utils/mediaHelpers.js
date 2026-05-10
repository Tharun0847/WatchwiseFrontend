export const SAFE_GENRES_TO_EXCLUDE = ["Hentai", "Erotica", "Ecchi", "Boys Love", "Girls Love", "Sexual Violence"];

export const UNSAFE_KEYWORDS = [ "adult", "erotica", "sensual", "softcore", "lust", "desire", "erotic", "pleasure", "fetish", "sex", "voyeur", "prostitution", "nude", "brothel", "seduction", "xxx", "lingerie", "strip", "kink", "porn", "swinger", "orgasm", "orgies", "ejaculation", "naked", "intercourse"];

export const isContentSafe = (item, type, genres = []) => {
  if (type === "movie" && item.adult) return false;

  // For anime, Jikan has rating field
  if (type === "anime" && item.rating && (item.rating.includes("Rx") || item.rating.includes("R+"))) {
    return false;
  }

  const title = item.title || item.name || "";
  const overview = item.overview || item.synopsis || "";
  const textToSearch = `${title} ${overview}`.toLowerCase();

  if (UNSAFE_KEYWORDS.some(word => textToSearch.includes(word))) return false;

  const itemGenreNames = type === "movie" 
    ? item.genre_ids?.map(id => genres.find(g => g.id === id)?.name).filter(Boolean) || []
    : item.genres?.map(g => g.name) || [];

  return !itemGenreNames.some(g => SAFE_GENRES_TO_EXCLUDE.includes(g));
};

export const sortMedia = (list, type) => {
  return [...list].sort((a, b) => {
    let yearA, yearB, scoreA, scoreB;

    if (type === "movie") {
      yearA = a.release_date ? parseInt(a.release_date.split("-")[0]) : 0;
      yearB = b.release_date ? parseInt(b.release_date.split("-")[0]) : 0;
      scoreA = a.vote_average || 0;
      scoreB = b.vote_average || 0;
    } else {
      yearA = a.year || (a.aired?.from ? new Date(a.aired.from).getFullYear() : 0);
      yearB = b.year || (b.aired?.from ? new Date(b.aired.from).getFullYear() : 0);
      scoreA = a.score || 0;
      scoreB = b.score || 0;
    }

    if (yearB !== yearA) return yearB - yearA;
    return scoreB - scoreA;
  });
};
