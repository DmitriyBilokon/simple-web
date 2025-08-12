import Image from "next/image";
import type { Movie } from "@/types";

type Props = {
  movie: Movie;
};

export default function MovieCard({ movie }: Props) {
  const fallbackInitials = movie.title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <a
      href={movie.imdbUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-lg border border-black/10 dark:border-white/10 overflow-hidden hover:shadow-lg transition-shadow bg-white dark:bg-neutral-900"
    >
      <div className="aspect-[2/3] w-full bg-neutral-100 dark:bg-neutral-800 relative">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-neutral-400">
            {fallbackInitials}
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold line-clamp-1" title={movie.title}>
            {movie.title}
          </h3>
          <span className="text-xs text-neutral-500">{movie.year}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
          <span>{movie.genres.join(", ")}</span>
          <span className="font-semibold">★ {movie.rating.toFixed(1)}</span>
        </div>
      </div>
    </a>
  );
}