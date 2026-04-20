"use client";

import { useState, type FormEvent } from "react";
import { FilterWindow } from "./FilterWindow";
import type { FilterParams } from "./FilterWindow";

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
  const [showFilter, setShowFilter] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async (searchQuery: string, filters?: FilterParams) => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      params.set("search", searchQuery);

      if (filters) {
        if (filters.startDate !== undefined)
          params.set("startDate", filters.startDate);
        if (filters.endDate !== undefined)
          params.set("endDate", filters.endDate);
        if (filters.flagged !== undefined)
          params.set("flagged", String(filters.flagged));
        if (filters.archived !== undefined)
          params.set("archived", String(filters.archived));
        if (filters.minComments !== undefined)
          params.set("minComments", String(filters.minComments));
      }

      const response = await fetch(`/api/search?${params.toString()}`);

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleFilterApply = async (filters: FilterParams) => {
    // Use search term from filter or fall back to current query
    const searchQuery = filters.search || query;
    setQuery(searchQuery);
    performSearch(searchQuery, filters);
  };

  return (
    <div className="mx-auto max-w-4xl p-5 font-sans">
      <form
        onSubmit={handleSubmit}
        className="mb-[-25] flex flex-row gap-1.5 sm:gap-2.5" // Always row, smaller gap on mobile, reduced bottom margin
      >
        <div className="relative flex w-full flex-1 items-center rounded-md border-2 border-gray-300 bg-white px-2 sm:px-3">
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
            className="mr-1.5 h-4 w-4 shrink-0 text-gray-500 sm:mr-2 sm:h-5 sm:w-5" // Smaller icon on mobile
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
            className="w-full flex-1 border-none bg-transparent py-2 text-sm text-gray-900 placeholder-gray-400 outline-none sm:py-2.5 sm:text-base" // Smaller text/padding on mobile
          />

          {/* Filters Icon */}
          <button
            type="button"
            className="ml-1.5 flex cursor-pointer items-center border-none bg-transparent p-1 sm:ml-2" // Smaller margin on mobile
            onClick={(e) => {
              e.preventDefault();
              setShowFilter(true);
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
              className="h-4 w-4 shrink-0 text-gray-500 sm:h-5 sm:w-5" // Smaller icon on mobile
            >
              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
            </svg>
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`shrink-0 rounded-md border-none px-3 py-2 text-sm text-white sm:px-5 sm:py-2.5 sm:text-base ${
            // Smaller text/padding on mobile, removed w-full
            isLoading
              ? "cursor-not-allowed bg-gray-400"
              : "cursor-pointer bg-[#02ACF7] hover:bg-blue-700"
          }`}
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {showFilter && (
        <FilterWindow
          onClose={() => setShowFilter(false)}
          onApply={handleFilterApply}
        />
      )}

      {error && (
        <div className="mb-5 rounded-md border border-red-300 bg-red-100 p-4 text-red-700">
          Error: {error}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-bold">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </h2>
          {results.map((post) => (
            <div
              key={post.id}
              className="mb-2.5 rounded-md border border-gray-300 bg-gray-50 p-4"
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
