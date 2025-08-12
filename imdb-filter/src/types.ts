export type Movie = {
  imdbId: string;
  title: string;
  year: number;
  genres: string[];
  rating: number; // IMDb rating out of 10
  runtimeMinutes?: number;
  countries?: string[];
  posterUrl?: string;
  imdbUrl: string;
};

export type MoviesQuery = {
  q?: string;
  genres?: string[];
  yearMin?: number;
  yearMax?: number;
  ratingMin?: number;
  ratingMax?: number;
  sort?: "rating-desc" | "rating-asc" | "year-desc" | "year-asc" | "title-asc" | "title-desc";
  page?: number;
  pageSize?: number;
};

export type MoviesResponse = {
  total: number;
  page: number;
  pageSize: number;
  results: Movie[];
};