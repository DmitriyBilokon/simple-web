import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import type { Movie, MoviesResponse } from "@/types";

const DATA_PATH = path.join(process.cwd(), "src", "data", "movies.json");

function normalizeString(value: string): string {
  return value.toLowerCase();
}

function parseNumber(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const genresParam = url.searchParams.get("genres");
  const yearMin = parseNumber(url.searchParams.get("yearMin"));
  const yearMax = parseNumber(url.searchParams.get("yearMax"));
  const ratingMin = parseNumber(url.searchParams.get("ratingMin"));
  const ratingMax = parseNumber(url.searchParams.get("ratingMax"));
  const sort = (url.searchParams.get("sort") || "rating-desc") as
    | "rating-desc"
    | "rating-asc"
    | "year-desc"
    | "year-asc"
    | "title-asc"
    | "title-desc";
  const page = Math.max(1, parseNumber(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(1, parseNumber(url.searchParams.get("pageSize")) || 12));

  const fileContent = await fs.readFile(DATA_PATH, "utf-8");
  const allMovies: Movie[] = JSON.parse(fileContent);

  const activeGenres = (genresParam || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean)
    .map(normalizeString);

  const filtered = allMovies.filter((movie) => {
    if (q) {
      const query = normalizeString(q);
      const inTitle = normalizeString(movie.title).includes(query);
      const inId = normalizeString(movie.imdbId).includes(query);
      if (!inTitle && !inId) return false;
    }

    if (activeGenres.length > 0) {
      const movieGenres = movie.genres.map(normalizeString);
      const hasAllGenres = activeGenres.every((g) => movieGenres.includes(g));
      if (!hasAllGenres) return false;
    }

    if (yearMin !== undefined && movie.year < yearMin) return false;
    if (yearMax !== undefined && movie.year > yearMax) return false;

    if (ratingMin !== undefined && movie.rating < ratingMin) return false;
    if (ratingMax !== undefined && movie.rating > ratingMax) return false;

    return true;
  });

  const sorted = filtered.sort((a, b) => {
    switch (sort) {
      case "rating-asc":
        return a.rating - b.rating;
      case "rating-desc":
        return b.rating - a.rating;
      case "year-asc":
        return a.year - b.year;
      case "year-desc":
        return b.year - a.year;
      case "title-desc":
        return a.title.localeCompare(b.title) * -1;
      case "title-asc":
      default:
        return a.title.localeCompare(b.title);
    }
  });

  const total = sorted.length;
  const start = (page - 1) * pageSize;
  const results = sorted.slice(start, start + pageSize);

  const response: MoviesResponse = {
    total,
    page,
    pageSize,
    results,
  };

  return NextResponse.json(response, { status: 200 });
}