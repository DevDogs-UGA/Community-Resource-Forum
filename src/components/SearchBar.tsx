"use client";

import { useState, type FormEvent } from "react";

interface Post {
  id: string;
  content: string | null;
  authorId: string;
  eventId: string | null;
  score: number;
  commentCount: number;
  flagCount: number;
  createdAt: Date;
}

interface SearchResponse {
  results: Post[];
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!query.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/search/${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = (await response.json()) as SearchResponse;
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-5 font-sans">
      <form
        onSubmit={handleSubmit}
        className="flex flex-row gap-1.5 sm:gap-2.5 mb-[-25]" // Always row, smaller gap on mobile, reduced bottom margin
      >
        <div
          className="relative flex-1 flex items-center bg-white border-2 border-gray-300 rounded-md px-2 sm:px-3 w-full"
        >
          {/* Search Icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor" // Uses text-gray-500
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 shrink-0" // Smaller icon on mobile
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts..."
            disabled={isLoading}
            className="flex-1 py-2 sm:py-2.5 text-sm sm:text-base bg-transparent text-gray-900 border-none outline-none placeholder-gray-400 w-full" // Smaller text/padding on mobile
          />

          {/* Filters Icon */}
          <button
            type="button"
            className="bg-transparent border-none cursor-pointer p-1 flex items-center ml-1.5 sm:ml-2" // Smaller margin on mobile
            onClick={(e) => {
              e.preventDefault();
              // Add filter functionality here
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor" // Uses text-gray-500
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 shrink-0" // Smaller icon on mobile
            >
              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
            </svg>
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`py-2 sm:py-2.5 px-3 sm:px-5 text-sm sm:text-base text-white border-none rounded-md shrink-0 ${ // Smaller text/padding on mobile, removed w-full
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#02ACF7] hover:bg-blue-700 cursor-pointer"
          }`}
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div
          className="p-4 bg-red-100 border border-red-300 rounded-md mb-5 text-red-700"
        >
          Error: {error}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </h2>
          {results.map((post) => (
            <div
              key={post.id}
              className="p-4 border border-gray-300 rounded-md mb-2.5 bg-gray-50"
            >
              <p className="mb-2.5">{post.content}</p>
              <div className="text-sm text-gray-600">
                Score: {post.score} | Comments: {post.commentCount}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && results.length === 0 && query && !error && hasSearched && (
        <div className="p-5 text-center text-gray-600">
          No results found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
