"use client";

import { useEffect, useMemo, useState } from "react";

export type FiltersState = {
  q: string;
  genres: string[];
  yearMin?: number;
  yearMax?: number;
  ratingMin?: number;
  ratingMax?: number;
  sort: "rating-desc" | "rating-asc" | "year-desc" | "year-asc" | "title-asc" | "title-desc";
};

type Props = {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  availableGenres: string[];
};

export default function Filters({ value, onChange, availableGenres }: Props) {
  const [local, setLocal] = useState<FiltersState>(value);

  useEffect(() => setLocal(value), [value]);

  useEffect(() => {
    const timeout = setTimeout(() => onChange(local), 250);
    return () => clearTimeout(timeout);
  }, [local, onChange]);

  const toggleGenre = (genre: string) => {
    setLocal((prev) => {
      const has = prev.genres.includes(genre);
      return { ...prev, genres: has ? prev.genres.filter((g) => g !== genre) : [...prev.genres, genre] };
    });
  };

  const genreOptions = useMemo(() => availableGenres.sort((a, b) => a.localeCompare(b)), [availableGenres]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Search</label>
        <input
          type="text"
          value={local.q}
          onChange={(e) => setLocal({ ...local, q: e.target.value })}
          placeholder="Title or IMDb ID"
          className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Genres</label>
        <div className="flex flex-wrap gap-2">
          {genreOptions.map((genre) => {
            const active = local.genres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  active
                    ? "bg-foreground text-background border-transparent"
                    : "bg-transparent text-foreground border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Year from</label>
          <input
            type="number"
            value={local.yearMin ?? ""}
            onChange={(e) => setLocal({ ...local, yearMin: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="e.g. 1990"
            className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Year to</label>
          <input
            type="number"
            value={local.yearMax ?? ""}
            onChange={(e) => setLocal({ ...local, yearMax: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="e.g. 2015"
            className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Min rating</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={local.ratingMin ?? ""}
            onChange={(e) => setLocal({ ...local, ratingMin: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="e.g. 8.0"
            className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max rating</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={local.ratingMax ?? ""}
            onChange={(e) => setLocal({ ...local, ratingMax: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="e.g. 9.5"
            className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Sort by</label>
        <select
          value={local.sort}
          onChange={(e) => setLocal({ ...local, sort: e.target.value as FiltersState["sort"] })}
          className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
        >
          <option value="rating-desc">Rating ↓</option>
          <option value="rating-asc">Rating ↑</option>
          <option value="year-desc">Year ↓</option>
          <option value="year-asc">Year ↑</option>
          <option value="title-asc">Title A→Z</option>
          <option value="title-desc">Title Z→A</option>
        </select>
      </div>
    </div>
  );
}