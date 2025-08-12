import MoviesExplorer from "./movies-explorer";

export default function Home() {
  return (
    <div className="min-h-screen p-6 sm:p-10 font-[family-name:var(--font-geist-sans)]">
      <main className="mx-auto max-w-7xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Film Finder (IMDb referenced)</h1>
        <MoviesExplorer />
      </main>
    </div>
  );
}

