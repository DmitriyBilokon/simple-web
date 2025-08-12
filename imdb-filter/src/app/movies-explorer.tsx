"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Filters, { FiltersState } from "./components/Filters";
import MovieCard from "./components/MovieCard";
import type { MoviesResponse } from "@/types";

function buildQueryString(filters: FiltersState, page: number, pageSize: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.genres.length > 0) params.set("genres", filters.genres.join(","));
  if (filters.yearMin !== undefined) params.set("yearMin", String(filters.yearMin));
  if (filters.yearMax !== undefined) params.set("yearMax", String(filters.yearMax));
  if (filters.ratingMin !== undefined) params.set("ratingMin", String(filters.ratingMin));
  if (filters.ratingMax !== undefined) params.set("ratingMax", String(filters.ratingMax));
  params.set("sort", filters.sort);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return params.toString();
}

export default function MoviesExplorer() {
  const [filters, setFilters] = useState<FiltersState>({
    q: "",
    genres: [],
    sort: "rating-desc",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MoviesResponse | null>(null);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQueryString(filters, page, pageSize);
      const res = await fetch(`/api/movies?${qs}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json: MoviesResponse = await res.json();
      setData(json);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    data?.results.forEach((m) => m.genres.forEach((g) => genres.add(g)));
    // If no data yet, provide a default set based on known sample
    if (genres.size === 0) {
      [
        "Action",
        "Adventure",
        "Biography",
        "Crime",
        "Drama",
        "Fantasy",
        "History",
        "Mystery",
        "Romance",
        "Sci-Fi",
        "Thriller",
        "War",
        "Western",
      ].forEach((g) => genres.add(g));
    }
    return Array.from(genres);
  }, [data]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside className="lg:col-span-1">
        <div className="sticky top-4 space-y-4 p-4 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900">
          <Filters value={filters} onChange={setFilters} availableGenres={availableGenres} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Page size</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              >
                {[6, 12, 18, 24, 30, 36, 48].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Page</label>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={page}
                onChange={(e) => setPage(Math.min(totalPages, Math.max(1, Number(e.target.value))))}
                className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              />
              <div className="text-xs text-neutral-500 mt-1">of {totalPages}</div>
            </div>
          </div>
        </div>
      </aside>
      <section className="lg:col-span-3">
        {loading && (
          <div className="text-neutral-500">Loading movies…</div>
        )}
        {error && (
          <div className="text-red-600">{error}</div>
        )}
        {!loading && !error && data && (
          <>
            <div className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
              Showing {(data.page - 1) * data.pageSize + 1}–
              {Math.min(data.page * data.pageSize, data.total)} of {data.total} results
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.results.map((movie) => (
                <MovieCard key={movie.imdbId} movie={movie} />)
              )}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-2 rounded-md border border-black/10 dark:border-white/10 disabled:opacity-50"
              >
                Previous
              </button>
              <div className="text-sm">Page {page} of {totalPages}</div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-2 rounded-md border border-black/10 dark:border-white/10 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}